// add-selected-numbers-column.cjs
// This script adds the selected_numbers column to the entries table
// Run with: node add-selected-numbers-column.cjs

const { Pool } = require('pg');

async function main() {
  console.log('🔧 Adding selected_numbers column to entries table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking if selected_numbers column already exists...');
    
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'entries' AND column_name = 'selected_numbers'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ selected_numbers column already exists. No changes needed.');
      return;
    }
    
    console.log('🔧 Column does not exist, adding it now...');
    
    // Add the column
    await pool.query(`
      ALTER TABLE entries 
      ADD COLUMN IF NOT EXISTS selected_numbers JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log('✅ Successfully added selected_numbers column to entries table.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);