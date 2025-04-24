// Script specifically for running on Render to reset competitions
// This script is designed to be compatible with both CommonJS and ESM
// It runs directly on Render's environment to reset all competitions data
let Pool;
try {
  // Try ESM import first
  const pg = await import('pg');
  Pool = pg.Pool;
} catch (error) {
  // Fall back to CommonJS require
  const pg = require('pg');
  Pool = pg.Pool;
}

async function resetCompetitions() {
  console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Create a PostgreSQL pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false  // Required for Render PostgreSQL
    }
  });

  console.log('⚠️ ULTRA ROBUST APPROACH: Multiple methods to reset competition database');
  console.log('This script will try several approaches to ensure reset works');
  
  let resetSuccessful = false;
  let client = null;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Connected to database successfully');

    // METHOD 1: Transaction with session_replication_role
    if (!resetSuccessful) {
      console.log('\n🔄 METHOD 1: Transaction with session_replication_role');
      try {
        // Start a transaction
        await client.query('BEGIN');

        // Temporarily disable foreign key constraints
        await client.query('SET session_replication_role = \'replica\'');
        
        console.log('Deleting all entries...');
        const entriesResult = await client.query('DELETE FROM entries');
        console.log(`Deleted ${entriesResult.rowCount} entries`);
        
        console.log('Deleting all winners...');
        const winnersResult = await client.query('DELETE FROM winners');  
        console.log(`Deleted ${winnersResult.rowCount} winners`);
        
        console.log('Deleting all competitions...');
        const competitionsResult = await client.query('DELETE FROM competitions');
        console.log(`Deleted ${competitionsResult.rowCount} competitions`);
        
        // Reset sequences
        await client.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        // Re-enable foreign key constraints
        await client.query('SET session_replication_role = \'origin\'');
        
        // Commit the transaction
        await client.query('COMMIT');
        
        console.log('✅ METHOD 1 completed successfully!');
        resetSuccessful = true;
      } catch (error) {
        // Rollback transaction on error
        try {
          await client.query('ROLLBACK');
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
        console.error('❌ METHOD 1 failed:', error.message);
      }
    }
    
    // METHOD 2: TRUNCATE with CASCADE
    if (!resetSuccessful) {
      console.log('\n🔄 METHOD 2: TRUNCATE with CASCADE');
      try {
        // Try truncating all tables with CASCADE
        await client.query('BEGIN');
        
        console.log('Truncating all tables with CASCADE...');
        await client.query('TRUNCATE TABLE entries, winners, competitions CASCADE');
        
        // Reset sequences
        await client.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        await client.query('COMMIT');
        
        console.log('✅ METHOD 2 completed successfully!');
        resetSuccessful = true;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {}
        console.error('❌ METHOD 2 failed:', error.message);
      }
    }
    
    // METHOD 3: Individual DELETE operations with no constraints
    if (!resetSuccessful) {
      console.log('\n🔄 METHOD 3: Individual DELETE operations with no constraints');
      try {
        await client.query('BEGIN');
        
        // Disable ALL triggers temporarily
        await client.query('SET session_replication_role = \'replica\'');
        
        // Using raw SQL with no WHERE clause for maximum deletion power
        console.log('Forcefully deleting entries...');
        await client.query('DELETE FROM entries');
        
        console.log('Forcefully deleting winners...');
        await client.query('DELETE FROM winners');
        
        console.log('Forcefully deleting competitions...');
        await client.query('DELETE FROM competitions');
        
        // Reset sequences
        await client.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        // Re-enable triggers
        await client.query('SET session_replication_role = \'origin\'');
        
        await client.query('COMMIT');
        
        console.log('✅ METHOD 3 completed successfully!');
        resetSuccessful = true;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {}
        console.error('❌ METHOD 3 failed:', error.message);
      }
    }
    
    // METHOD 4: Direct ID-based deletion with temp tables
    if (!resetSuccessful) {
      console.log('\n🔄 METHOD 4: Direct ID-based deletion with temp tables');
      try {
        await client.query('BEGIN');
        
        // Create temporary tables to store IDs
        await client.query('CREATE TEMP TABLE comp_ids AS SELECT id FROM competitions');
        
        // Delete entries based on the stored competition IDs
        console.log('Deleting entries by competition ID...');
        await client.query('DELETE FROM entries WHERE competition_id IN (SELECT id FROM comp_ids)');
        
        // Delete winners based on the stored competition IDs
        console.log('Deleting winners by competition ID...');
        await client.query('DELETE FROM winners WHERE competition_id IN (SELECT id FROM comp_ids)');
        
        // Delete competitions
        console.log('Deleting stored competitions...');
        await client.query('DELETE FROM competitions WHERE id IN (SELECT id FROM comp_ids)');
        
        // Drop temp table
        await client.query('DROP TABLE comp_ids');
        
        // Reset sequences
        await client.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        await client.query('COMMIT');
        
        console.log('✅ METHOD 4 completed successfully!');
        resetSuccessful = true;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {}
        console.error('❌ METHOD 4 failed:', error.message);
      }
    }
    
    // METHOD 5: Nuclear option - drop and recreate tables
    if (!resetSuccessful) {
      console.log('\n🔄 METHOD 5: Nuclear option - reset schema');
      try {
        // This is the most extreme approach - drop and recreate tables
        await client.query('BEGIN');
        
        // Save the table schemas first
        console.log('Saving table schemas...');
        const tablesSchema = await client.query(`
          SELECT table_name, 
                 string_agg(column_name || ' ' || data_type, ', ') as columns
          FROM information_schema.columns
          WHERE table_name IN ('competitions', 'entries', 'winners')
            AND table_schema = 'public'
          GROUP BY table_name
        `);
        
        // Drop tables with CASCADE
        console.log('Dropping all competition-related tables...');
        await client.query('DROP TABLE IF EXISTS entries CASCADE');
        await client.query('DROP TABLE IF EXISTS winners CASCADE');
        await client.query('DROP TABLE IF EXISTS competitions CASCADE');
        
        // At this point, we would need to recreate the schema,
        // but that's beyond what we can safely do without the original schema
        // Instead, we'll leave it to the application to recreate tables on startup
        
        await client.query('COMMIT');
        
        console.log('⚠️ METHOD 5 completed with tables DROPPED! The application will need to recreate them on startup.');
        resetSuccessful = true;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {}
        console.error('❌ METHOD 5 failed:', error.message);
      }
    }
    
    // Final verification if any method succeeded
    if (resetSuccessful) {
      try {
        // Verify the tables are empty (or don't exist)
        try {
          const competitionsCount = await client.query('SELECT COUNT(*) FROM competitions');
          const entriesCount = await client.query('SELECT COUNT(*) FROM entries');
          const winnersCount = await client.query('SELECT COUNT(*) FROM winners');
          
          console.log('\n📊 Verification counts:');
          console.log(`- Competitions: ${competitionsCount.rows[0].count}`);
          console.log(`- Entries: ${entriesCount.rows[0].count}`);
          console.log(`- Winners: ${winnersCount.rows[0].count}`);
          
          if (competitionsCount.rows[0].count === '0' && 
              entriesCount.rows[0].count === '0' && 
              winnersCount.rows[0].count === '0') {
            console.log('✅ Database reset CONFIRMED! All tables are empty.');
          }
        } catch (verifyError) {
          console.log('⚠️ Could not verify table counts, tables may have been dropped.');
        }
      } catch (error) {
        console.error('Error during verification:', error);
      }
    } else {
      console.error('❌ ALL METHODS FAILED! Could not reset the database.');
      console.error('This may require manual intervention at the database level.');
    }
  } catch (connectionError) {
    console.error('❌ Error connecting to database:', connectionError);
  } finally {
    if (client) {
      try {
        client.release();
        await pool.end();
        console.log('Database connection closed.');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }
}

// Run the function
resetCompetitions();