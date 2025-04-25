import { Router } from 'express';
import { db } from './db';
import { competitions, entries, winners } from '@shared/schema';

// Create a router
const adminRouter = Router();

// Function to check if a user is an admin
function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
  
  next();
}

// Reset competitions route - only accessible by admins
// This is the correct implementation referenced by client code at /api/admin/reset-competitions
adminRouter.post('/reset-competitions', isAdmin, async (req, res) => {
  try {
    console.log('🧹 Starting competition reset process...');
    
    // Comprehensive approach: try several methods to ensure successful reset
    
    // First approach: Use Drizzle ORM with transaction
    try {
      console.log('🔄 Attempt 1: Using Drizzle ORM transaction');
      
      // Delete all entries
      console.log('🗑️ Deleting entries...');
      await db.delete(entries);
      console.log('✓ Entries deleted');
      
      // Delete all winners
      console.log('🗑️ Deleting winners...');
      await db.delete(winners);
      console.log('✓ Winners deleted');
      
      // Delete all competitions
      console.log('🗑️ Deleting competitions...');
      await db.delete(competitions);
      console.log('✓ Competitions deleted');
      
      console.log('✅ Drizzle operations completed successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'All competitions have been successfully deleted.'
      });
      return;
    } catch (drizzleError) {
      console.error('❌ Drizzle ORM method failed:', drizzleError);
      // Continue to the next approach without returning an error yet
    }
    
    // If we reach here, the Drizzle approach failed
    // Fall back to direct SQL operations
    try {
      const { pool } = await import('./db');
      
      console.log('🔄 Attempt 2: Using direct SQL queries');
      await pool.query('BEGIN');
      
      // Clear entries table first (to avoid foreign key constraints)
      console.log('🗑️ Deleting entries via SQL...');
      await pool.query('DELETE FROM entries');
      console.log('✓ Entries deleted via SQL');
      
      // Then clear winners
      console.log('🗑️ Deleting winners via SQL...');
      await pool.query('DELETE FROM winners');
      console.log('✓ Winners deleted via SQL');
      
      // Finally clear competitions
      console.log('🗑️ Deleting competitions via SQL...');
      await pool.query('DELETE FROM competitions');
      console.log('✓ Competitions deleted via SQL');
      
      // Reset sequences
      await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
      
      await pool.query('COMMIT');
      console.log('✅ SQL transaction completed successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'All competitions have been successfully deleted using SQL.'
      });
      return;
    } catch (sqlError) {
      console.error('❌ SQL method failed:', sqlError);
      
      // Try to rollback
      try {
        const { pool } = await import('./db');
        await pool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      // Try one more extreme approach - TRUNCATE with CASCADE
      try {
        const { pool } = await import('./db');
        
        console.log('🔄 Emergency Attempt: Using TRUNCATE CASCADE');
        await pool.query('TRUNCATE competitions, entries, winners CASCADE');
        
        // Reset sequences
        await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        console.log('✅ Emergency TRUNCATE completed successfully');
        
        res.status(200).json({ 
          success: true, 
          message: 'All competitions have been reset using emergency procedures.'
        });
        return;
      } catch (truncateError) {
        console.error('❌ Emergency TRUNCATE failed:', truncateError);
        // Now we've really failed
        res.status(500).json({ 
          success: false, 
          message: 'All reset approaches failed. Database might be locked or corrupted.'
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Catastrophic error in reset process:', error);
    res.status(500).json({ 
      success: false, 
      message: 'A severe error occurred during the reset process.', 
      error: error.message 
    });
  }
});

export default adminRouter;