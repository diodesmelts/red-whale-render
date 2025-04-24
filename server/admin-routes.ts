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
adminRouter.post('/reset-competitions', isAdmin, async (req, res) => {
  try {
    // Start a transaction
    console.log('Starting competition reset process...');
    
    // Delete all entries
    console.log('Deleting entries...');
    await db.delete(entries);
    
    // Delete all winners
    console.log('Deleting winners...');
    await db.delete(winners);
    
    // Delete all competitions
    console.log('Deleting competitions...');
    await db.delete(competitions);
    
    console.log('Reset completed successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'All competitions, entries, and winners have been successfully deleted.' 
    });
  } catch (error: any) {
    console.error('Error during competition reset:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during the reset process.', 
      error: error.message 
    });
  }
});

export default adminRouter;