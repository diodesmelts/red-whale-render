import { Router } from 'express';
import { db } from './db';
import { competitions, entries, winners, siteConfig, users } from '@shared/schema';
import { TicketService } from './ticket-service';
import { eq, desc } from 'drizzle-orm';

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

// Create Test Competitions (Dev Environment Only)
// This endpoint is only for local testing in Replit
adminRouter.post('/dev-create-test-competitions', isAdmin, async (req, res) => {
  // Check if this is a development environment
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!isDev) {
    return res.status(403).json({ 
      message: 'This endpoint is only available in development environments'
    });
  }
  
  try {
    console.log('🧪 Creating test competitions for development...');
    
    // Delete any existing competitions first
    console.log('🧹 Clearing existing test data...');
    await db.delete(entries);
    await db.delete(winners);
    await db.delete(competitions);
    console.log('✅ Existing data cleared');
    
    // Create test competitions with properly formatted dates
    const testCompetitions = [
      {
        title: "PlayStation 5 Console",
        description: "Win a brand new PlayStation 5 console with controller and games!",
        imageUrl: "/uploads/image-1745416110136-244748299.png",
        ticketPrice: 5,
        totalTickets: 1000,
        maxTicketsPerUser: 25,
        prizeValue: 500,
        category: "ELECTRONICS",
        brand: "Sony",
        isLive: true,
        isFeatured: true,
        drawDate: new Date("2025-06-01") // Must be a Date object for Drizzle
      },
      {
        title: "MacBook Pro M3",
        description: "Win a brand new MacBook Pro with M3 chip!",
        imageUrl: "/uploads/image-1745528670330-21249645.png",
        ticketPrice: 10,
        totalTickets: 750,
        maxTicketsPerUser: 15,
        prizeValue: 2000,
        category: "ELECTRONICS",
        brand: "Apple",
        isLive: true,
        isFeatured: true,
        drawDate: new Date("2025-05-15") // Must be a Date object for Drizzle
      },
      {
        title: "Ninja Air Fryer",
        description: "Win the latest Ninja Air Fryer, perfect for healthy cooking!",
        imageUrl: "/uploads/image-1745595843618-675484257.png",
        ticketPrice: 3,
        totalTickets: 500,
        maxTicketsPerUser: 10,
        prizeValue: 150,
        category: "APPLIANCES",
        brand: "Ninja",
        isLive: true,
        isFeatured: false,
        drawDate: new Date("2025-04-29") // Must be a Date object for Drizzle
      }
    ];
    
    // Insert the test competitions
    const results = [];
    for (const comp of testCompetitions) {
      console.log(`📌 Creating test competition: ${comp.title}`);
      
      try {
        const result = await db.insert(competitions).values(comp).returning();
        const newCompId = result[0].id;
        results.push(result[0]);
        console.log(`✅ Created competition: ${comp.title} with ID ${newCompId}`);
        
        // Initialize ticket statuses for this test competition
        try {
          console.log(`🎟️ Initializing ticket statuses for test competition ${newCompId}`);
          await TicketService.initializeTicketStatuses(newCompId);
        } catch (ticketError) {
          console.error(`⚠️ Error initializing ticket statuses for test competition: ${ticketError}`);
        }
      } catch (error) {
        console.error(`❌ Error creating competition ${comp.title}:`, error);
        // Continue with other competitions even if one fails
      }
    }
    
    // Return success with created competitions
    return res.status(201).json({
      message: `Successfully created ${results.length} test competitions`,
      competitions: results
    });
    
  } catch (error: any) {
    console.error('❌ Error creating test competitions:', error);
    return res.status(500).json({
      message: 'Failed to create test competitions',
      error: error.message
    });
  }
});

// Create a single test competition
adminRouter.post('/dev-create-competition', isAdmin, async (req, res) => {
  // Check if this is a development environment
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!isDev) {
    return res.status(403).json({ 
      message: 'This endpoint is only available in development environments'
    });
  }
  
  try {
    const {
      title,
      description,
      imageUrl,
      ticketPrice,
      totalTickets,
      maxTicketsPerUser,
      prizeValue,
      category,
      brand,
      isLive,
      isFeatured,
      drawDate: drawDateString // String from request
    } = req.body;
    
    console.log('📌 Dev competition create data:', req.body);
    
    // Validate required fields
    if (!title || !description || !ticketPrice || !totalTickets || !drawDateString) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, ticketPrice, totalTickets, and drawDate are required' 
      });
    }
    
    // Convert drawDate string to Date object
    const drawDate = new Date(drawDateString);
    
    // Create the competition with a proper date object
    const competitionData = {
      title,
      description,
      imageUrl: imageUrl || '/default-competition-image.png',
      ticketPrice: Number(ticketPrice),
      totalTickets: Number(totalTickets),
      maxTicketsPerUser: maxTicketsPerUser ? Number(maxTicketsPerUser) : 10,
      prizeValue: prizeValue ? Number(prizeValue) : 0,
      category: category || 'APPLIANCES',
      brand: brand || '',
      isLive: isLive || false,
      isFeatured: isFeatured || false,
      drawDate // Proper Date object for Drizzle
    };
    
    console.log('📌 Attempting to create competition with proper date format:', {
      ...competitionData,
      drawDate: competitionData.drawDate.toISOString() // Show it's a proper Date object
    });
    
    const result = await db.insert(competitions).values(competitionData).returning();
    const newCompetitionId = result[0].id;
    
    console.log(`✅ Successfully created competition: ${title} with ID ${newCompetitionId}`);
    
    // Initialize ticket statuses for the new competition
    try {
      console.log(`🎟️ Initializing ticket statuses for new competition ${newCompetitionId}`);
      await TicketService.initializeTicketStatuses(newCompetitionId);
      console.log(`✅ Ticket statuses initialized for competition ${newCompetitionId}`);
    } catch (ticketError) {
      console.error(`⚠️ Error initializing ticket statuses: ${ticketError}`);
      // We don't fail the request if this fails, as the competition was created successfully
    }
    
    return res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('❌ Error creating competition:', error);
    return res.status(500).json({
      message: 'Failed to create competition',
      error: error.message
    });
  }
});

// Get competitions
adminRouter.get('/competitions', isAdmin, async (req, res) => {
  try {
    const result = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a competition
adminRouter.delete('/competitions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id);
    
    // Start with entries referencing this competition
    await db.delete(entries).where(eq(entries.competitionId, numId));
    
    // Then delete winners related to this competition
    await db.delete(winners).where(eq(winners.competitionId, numId));
    
    // Finally delete the competition itself
    const result = await db.delete(competitions).where(eq(competitions.id, numId)).returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    res.json({ success: true, message: 'Competition deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ message: error.message });
  }
});

// Utility to fix image URLs in database (convert absolute URLs to relative)
adminRouter.post('/fix-image-urls', isAdmin, async (req, res) => {
  try {
    console.log('🔧 Starting image URL fix process...');
    
    // 1. Find competitions with absolute URLs
    const competitionList = await db.select().from(competitions);
    let competitionsFixed = 0;
    
    for (const competition of competitionList) {
      if (competition.imageUrl && (
          competition.imageUrl.includes('replit.dev') || 
          competition.imageUrl.includes('replit.app') ||
          competition.imageUrl.includes('repl.co') ||
          competition.imageUrl.includes('onrender.com')
      )) {
        // Extract just the path from the URL
        try {
          const urlObj = new URL(competition.imageUrl);
          const relativePath = urlObj.pathname;
          console.log(`🔧 Converting competition image URL: "${competition.imageUrl}" -> "${relativePath}"`);
          
          // Update the competition with the relative URL
          await db.update(competitions)
            .set({ imageUrl: relativePath })
            .where(eq(competitions.id, competition.id));
          
          competitionsFixed++;
        } catch (e) {
          console.error(`❌ Error parsing URL ${competition.imageUrl}:`, e);
        }
      }
    }
    
    // 2. Fix site config URLs
    const configList = await db.select().from(siteConfig);
    let configsFixed = 0;
    
    for (const config of configList) {
      if (config.value && (
          config.value.includes('replit.dev') || 
          config.value.includes('replit.app') ||
          config.value.includes('repl.co') ||
          config.value.includes('onrender.com')
      )) {
        // Extract just the path from the URL
        try {
          const urlObj = new URL(config.value);
          const relativePath = urlObj.pathname;
          console.log(`🔧 Converting site config URL: "${config.value}" -> "${relativePath}"`);
          
          // Update the config with the relative URL
          await db.update(siteConfig)
            .set({ value: relativePath, updatedAt: new Date() })
            .where(eq(siteConfig.id, config.id));
          
          configsFixed++;
        } catch (e) {
          console.error(`❌ Error parsing URL ${config.value}:`, e);
        }
      }
    }
    
    console.log(`✅ Fixed ${competitionsFixed} competition URLs and ${configsFixed} config URLs`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully fixed image URLs`,
      competitionsFixed,
      configsFixed
    });
  } catch (error: any) {
    console.error('❌ Error fixing image URLs:', error);
    res.status(500).json({ 
      message: 'Failed to fix image URLs',
      error: error.message
    });
  }
});

// Admin endpoint to get detailed ticket statistics for a competition
adminRouter.get('/competitions/:id/ticket-stats', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id);
    
    if (isNaN(numId)) {
      return res.status(400).json({ message: 'Invalid competition ID format' });
    }
    
    // First verify the competition exists
    const competition = await db.select()
      .from(competitions)
      .where(eq(competitions.id, numId))
      .limit(1);
      
    if (!competition.length) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Get all entries for this competition to calculate stats
    const entryList = await db.select()
      .from(entries)
      .where(eq(entries.competitionId, numId));
    
    // Calculate purchased tickets
    const purchasedNumbers = new Set();
    for (const entry of entryList) {
      if (entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
        for (const num of entry.selectedNumbers) {
          purchasedNumbers.add(Number(num));
        }
      }
    }
    
    // Get in-cart numbers - tickets that are in active carts but not purchased
    const inCartNumbers = new Set();
    const pendingEntries = entryList.filter(entry => entry.paymentStatus === 'pending');
    
    for (const entry of pendingEntries) {
      if (entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
        for (const num of entry.selectedNumbers) {
          inCartNumbers.add(Number(num));
        }
      }
    }
    
    // Create a range of all possible ticket numbers
    const totalRange = Array.from({ length: competition[0].totalTickets }, (_, i) => i + 1);
    
    // Return comprehensive stats
    res.json({
      totalTickets: competition[0].totalTickets,
      purchasedTickets: purchasedNumbers.size,
      inCartTickets: inCartNumbers.size,
      availableTickets: competition[0].totalTickets - purchasedNumbers.size - inCartNumbers.size,
      soldTicketsCount: purchasedNumbers.size,
      allNumbers: {
        totalRange: totalRange,
        purchased: Array.from(purchasedNumbers),
        inCart: Array.from(inCartNumbers)
      }
    });
  } catch (error: any) {
    console.error('Error fetching competition ticket stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin endpoint to get cart items for a competition
adminRouter.post('/competitions/:id/cart-items', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id);
    
    if (isNaN(numId)) {
      return res.status(400).json({ message: 'Invalid competition ID format' });
    }
    
    // Get all pending entries (in cart) for this competition
    const activeEntries = await db.select()
      .from(entries)
      .where(eq(entries.competitionId, numId));
      
    // Filter for pending entries
    const pendingEntries = activeEntries.filter(entry => entry.paymentStatus === 'pending');
    
    // Extract all numbers from pending entries
    const inCartNumbers = new Set();
    for (const entry of pendingEntries) {
      if (entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
        for (const num of entry.selectedNumbers) {
          inCartNumbers.add(Number(num));
        }
      }
    }
    
    console.log(`Found ${inCartNumbers.size} in-cart numbers for competition ${numId}`);
    
    // Return the cart numbers
    return res.json({
      competitionId: numId,
      inCartNumbers: Array.from(inCartNumbers)
    });
  } catch (error: any) {
    console.error('Error fetching competition cart numbers:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Admin endpoint to lookup ticket owner by competition ID and ticket number
adminRouter.get('/competitions/:competitionId/ticket/:ticketNumber/owner', isAdmin, async (req, res) => {
  try {
    console.log('🔍 TICKET OWNER LOOKUP request received:', {
      competitionId: req.params.competitionId,
      ticketNumber: req.params.ticketNumber,
      userId: req.user?.id,
      userIsAdmin: req.user?.isAdmin
    });

    const competitionId = parseInt(req.params.competitionId);
    const ticketNumber = parseInt(req.params.ticketNumber);
    
    if (isNaN(competitionId) || isNaN(ticketNumber)) {
      return res.status(400).json({ message: 'Invalid competition ID or ticket number' });
    }
    
    console.log(`📌 Looking up owner for ticket #${ticketNumber} in competition #${competitionId}`);
    
    // First, verify the competition exists
    const competition = await db.select()
      .from(competitions)
      .where(eq(competitions.id, competitionId))
      .limit(1);
      
    if (!competition.length) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Use the centralized TicketService to get ticket and user details
    const ticketLookup = await TicketService.getUserByTicketNumber(competitionId, ticketNumber);
    
    if (ticketLookup.ticketStatus === 'not_found') {
      return res.status(404).json({ 
        message: 'Ticket not found in this competition' 
      });
    }
    
    if (ticketLookup.ticketStatus !== 'purchased') {
      return res.status(404).json({ 
        message: `Ticket is ${ticketLookup.ticketStatus}, not yet purchased` 
      });
    }
    
    if (!ticketLookup.user) {
      return res.status(404).json({ 
        message: 'User information not found for this ticket' 
      });
    }
    
    // Construct the response
    const ticketOwner = {
      ticketNumber,
      ticketStatus: ticketLookup.ticketStatus,
      userId: ticketLookup.user.id,
      userDetails: {
        ...ticketLookup.user,
        // Don't include any sensitive information
        password: undefined
      },
      purchaseDate: ticketLookup.purchaseDate
    };
    
    console.log(`✅ Found owner for ticket #${ticketNumber}: User ID #${ticketLookup.user.id}`);
    
    res.json(ticketOwner);
  } catch (error: any) {
    console.error('❌ Error looking up ticket owner:', error);
    res.status(500).json({ message: 'Failed to lookup ticket owner' });
  }
});

// Prepare for Render deployment endpoint
adminRouter.post('/prepare-render-deploy', isAdmin, async (req, res) => {
  try {
    console.log('🚀 Starting Render deployment preparation...');
    
    // Execute the shell script that prepares the deployment package
    const { exec } = require('child_process');
    const scriptPath = './prepare-render-deploy.sh';
    
    exec(`bash ${scriptPath}`, (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error(`❌ Execution error: ${error}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Error executing deployment script', 
          error: error.message,
          stderr 
        });
      }
      
      if (stderr) {
        console.warn(`⚠️ Script warnings: ${stderr}`);
      }
      
      console.log(`📝 Script output: ${stdout}`);
      
      // Success response with detailed information
      res.status(200).json({
        success: true,
        message: 'Render deployment package created successfully',
        details: 'The deployment package is now ready in the "dist-ready" directory. Push this to GitHub and deploy it on Render.',
        instructions: [
          '1. Push the "dist-ready" directory to GitHub',
          '2. On Render, create a new Web Service and connect to your GitHub repository',
          '3. Set the Root Directory to "dist-ready"',
          '4. Set the Build Command to: npm install',
          '5. Set the Start Command to: node server-docker.js',
          '6. Add the required environment variables (DATABASE_URL, STRIPE_SECRET_KEY, etc.)',
          '7. Deploy your application'
        ],
        logs: stdout
      });
    });
  } catch (error: any) {
    console.error('❌ Error preparing for Render deployment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to prepare for Render deployment', 
      error: error.message 
    });
  }
});

export default adminRouter;