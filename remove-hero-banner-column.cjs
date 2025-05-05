/**
 * Script to remove the push_to_hero_banner column from competitions table
 */
const { Pool } = require('pg');

async function removeColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking if push_to_hero_banner column exists...');
    
    // First check if the column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `;
    
    const { rows } = await pool.query(checkQuery);
    
    if (rows.length > 0) {
      console.log('⚠️ push_to_hero_banner column exists, removing it now...');
      
      // Remove the column
      await pool.query(`
        ALTER TABLE competitions 
        DROP COLUMN IF EXISTS push_to_hero_banner;
      `);
      
      console.log('✅ push_to_hero_banner column removed successfully!');
    } else {
      console.log('✅ push_to_hero_banner column does not exist, no need to remove!');
    }
    
    // Double check that it now does not exist
    const verifyQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length === 0) {
      console.log('✅ Verified that push_to_hero_banner column does not exist in the competitions table');
    } else {
      console.error('❌ Failed to remove push_to_hero_banner column!');
    }
    
  } catch (error) {
    console.error('❌ Error occurred:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
removeColumn().catch(console.error);