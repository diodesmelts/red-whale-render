#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Check if DATABASE_URL environment variable is defined
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTable() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database.');

    try {
      // Check if pushToHeroBanner column exists in competitions table
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'competitions' 
        AND column_name = 'push_to_hero_banner';
      `;
      
      const { rows } = await client.query(checkColumnQuery);
      
      if (rows.length === 0) {
        console.log('push_to_hero_banner column does not exist. Adding it to the competitions table...');
        
        // Add the pushToHeroBanner column
        const addColumnQuery = `
          ALTER TABLE competitions
          ADD COLUMN push_to_hero_banner BOOLEAN DEFAULT FALSE;
        `;
        
        await client.query(addColumnQuery);
        console.log('Successfully added push_to_hero_banner column to competitions table.');
      } else {
        console.log('push_to_hero_banner column already exists in competitions table.');
      }

      console.log('Database migration completed successfully!');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error('Error during database migration:', err);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

checkTable().catch(console.error);