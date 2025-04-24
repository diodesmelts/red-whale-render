// Script specifically for running on Render to reset competitions
// CommonJS version that can be run directly
const { Pool } = require('pg');

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

  console.log('⚠️ Performing complete database reset for competitions...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database successfully');

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
      
      console.log('✅ Database reset completed successfully!');
      
      // Verify the tables are empty
      const competitionsCount = await client.query('SELECT COUNT(*) FROM competitions');
      const entriesCount = await client.query('SELECT COUNT(*) FROM entries');
      const winnersCount = await client.query('SELECT COUNT(*) FROM winners');
      
      console.log('Verification counts:');
      console.log(`- Competitions: ${competitionsCount.rows[0].count}`);
      console.log(`- Entries: ${entriesCount.rows[0].count}`);
      console.log(`- Winners: ${winnersCount.rows[0].count}`);
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('❌ Error during reset:', error);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  }
}

// Run the function
resetCompetitions();