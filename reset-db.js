import { pool } from './server/db.js';

async function resetDatabase() {
  console.log('⚠️ WARNING: This will permanently delete all competitions from the database! ⚠️');
  console.log('Starting database reset process...');

  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database successfully');

    try {
      // Start a transaction for safety
      await client.query('BEGIN');

      // Truncate the competitions table
      console.log('Truncating competitions table...');
      await client.query('TRUNCATE TABLE competitions CASCADE');
      
      // Also truncate entries to be safe
      console.log('Truncating entries table...');
      await client.query('TRUNCATE TABLE entries CASCADE');

      // Also truncate winners to be safe
      console.log('Truncating winners table...');
      await client.query('TRUNCATE TABLE winners CASCADE');

      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('✅ Database reset completed successfully!');
    } catch (error) {
      // If there's an error, roll back the transaction
      await client.query('ROLLBACK');
      console.error('❌ Error during database reset:', error.message);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    // Close the pool to end the process
    await pool.end();
  }
}

// Run the reset function
resetDatabase();