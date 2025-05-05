/**
 * Script to add the missing push_to_hero_banner column to competitions table
 */
const { Pool } = require('pg');

async function addMissingColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking if push_to_hero_banner column exists...');
    
    // First check if the column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `;
    
    const { rows } = await pool.query(checkQuery);
    
    if (rows.length === 0) {
      console.log('⚠️ push_to_hero_banner column does not exist, adding it now...');
      
      // Add the column with a default value of false
      await pool.query(`
        ALTER TABLE competitions 
        ADD COLUMN IF NOT EXISTS push_to_hero_banner BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('✅ push_to_hero_banner column added successfully!');
    } else {
      console.log('✅ push_to_hero_banner column already exists!');
    }
    
    // Double check that it now exists
    const verifyQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verified that push_to_hero_banner column exists in the competitions table');
    } else {
      console.error('❌ Failed to add push_to_hero_banner column!');
    }
    
  } catch (error) {
    console.error('❌ Error occurred:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
addMissingColumn().catch(console.error);