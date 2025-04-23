const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { siteConfig } = require('./shared/schema');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  try {
    // Create the site_config table directly
    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_config (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database updated successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await pool.end();
  }
}

main();
