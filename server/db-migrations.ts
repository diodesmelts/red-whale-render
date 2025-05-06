import { db } from './db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

/**
 * Auto-runs database migrations for columns that might be missing
 * Handles production environments without requiring manual scripts
 */
export async function runAutomaticMigrations() {
  logger.info('Running automatic database migrations...');

  try {
    // Check if pushToHeroBanner column exists
    const checkPushToHeroBannerColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND column_name = 'push_to_hero_banner';
    `);
    
    if (!checkPushToHeroBannerColumn.length) {
      logger.info('Adding push_to_hero_banner column to competitions table');
      
      await db.execute(sql`
        ALTER TABLE competitions
        ADD COLUMN push_to_hero_banner BOOLEAN DEFAULT FALSE;
      `);
      
      logger.info('Successfully added push_to_hero_banner column');
    } else {
      logger.info('push_to_hero_banner column already exists');
    }

    logger.info('Automatic database migrations completed successfully');
  } catch (error) {
    logger.error('Error during automatic database migrations:', error);
    // Don't throw, just log the error - this ensures the server still starts
    // even if migrations fail
  }
}