import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Auto-runs database migrations for columns that might be missing
 * Handles production environments without requiring manual scripts
 */
export async function runAutomaticMigrations() {
  console.log('[INFO] Running automatic database migrations...');

  try {
    // Check if pushToHeroBanner column exists
    const checkPushToHeroBannerColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `);
    
    // Check the rows property instead of length
    const rows = checkPushToHeroBannerColumn.rows || [];
    
    if (rows.length === 0) {
      console.log('[INFO] Adding push_to_hero_banner column to competitions table');
      
      await db.execute(sql`
        ALTER TABLE competitions
        ADD COLUMN push_to_hero_banner BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('[INFO] Successfully added push_to_hero_banner column');
    } else {
      console.log('[INFO] push_to_hero_banner column already exists');
    }

    console.log('[INFO] Automatic database migrations completed successfully');
  } catch (error) {
    console.error('[ERROR] Error during automatic database migrations:', error);
    // Don't throw, just log the error - this ensures the server still starts
    // even if migrations fail
  }
}