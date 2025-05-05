import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import { insertEntrySchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "./db"; // Import the pool for direct SQL queries

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Payment functionality will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : undefined;

// Import storage service for file uploads
import { storageService } from './storage-service';

// Configure multer for memory storage (files temporarily held in memory)
const multerStorage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  console.log('Multer fileFilter called with file:', { 
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    console.log('File accepted: Image file detected');
    cb(null, true);
  } else {
    console.error('File rejected: Not an image file');
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: multerStorage, 
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Note: Auth setup is now handled in index.ts or api-only.ts before calling this
  // Don't set up auth again here to avoid duplicate routes
  
  // Add debug log for auth routes
  console.log("🔍 Registering API routes...");
  
  // Seed the admin user in the database (if it doesn't exist)
  if (dataStorage instanceof Object && typeof (dataStorage as any).seedAdminUser === 'function') {
    await (dataStorage as any).seedAdminUser();
    console.log("👤 Admin user seeding completed");
  }
  
  // Enhanced health check with diagnostics - safe implementation
  app.get('/api/health', (req, res) => {
    try {
      // Collect diagnostic information
      const diagnostics = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          referer: req.headers.referer,
          userAgent: req.headers['user-agent'],
        },
        session: {
          exists: !!req.session,
          id: req.sessionID || 'no-session-id',
          // Safe check for authentication status
          authenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'function-not-available',
          // Safe extraction of cookie info
          cookie: req.session?.cookie ? {
            originalMaxAge: req.session.cookie.originalMaxAge,
            secure: req.session.cookie.secure,
            sameSite: req.session.cookie.sameSite,
            domain: req.session.cookie.domain,
          } : null
        },
        serverInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage().rss / 1024 / 1024 + 'MB',
        },
        config: {
          apiUrl: process.env.API_URL || 'not set',
          frontendUrl: process.env.FRONTEND_URL || 'not set',
          cookieDomain: process.env.COOKIE_DOMAIN || 'not set',
          environment: process.env.NODE_ENV || 'development',
        }
      };
      
      res.json(diagnostics);
    } catch (error) {
      // Fallback response if anything fails
      res.json({
        status: 'ok',
        error: `Health check diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        minimal: true
      });
    }
  });
  
  // Special test endpoint for diagnosing registration issues
  app.get('/api/register-diagnostics', (req, res) => {
    // Always log these diagnostics to the server console
    console.log('\n\n=====================================================');
    console.log('📋 REGISTRATION DIAGNOSTICS TEST AT', new Date().toISOString());
    console.log('=====================================================');
    
    console.log('🌐 REQUEST INFO:');
    console.log('IP:', req.ip);
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    
    console.log('\n🔤 REQUEST HEADERS:');
    console.log('Origin:', req.headers.origin || 'Not provided');
    console.log('Host:', req.headers.host || 'Not provided');
    console.log('Referer:', req.headers.referer || 'Not provided');
    console.log('User-Agent:', req.headers['user-agent'] || 'Not provided');
    console.log('Content-Type:', req.headers['content-type'] || 'Not provided');
    console.log('Cookie Length:', req.headers.cookie ? req.headers.cookie.length : 0);
    console.log('Cookie Present:', req.headers.cookie ? 'Yes' : 'No');
    
    console.log('\n👤 SESSION INFO:');
    console.log('Session Exists:', req.session ? 'Yes' : 'No');
    console.log('Session ID:', req.sessionID || 'No session ID');
    console.log('Is Authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'Function not available');
    
    if (req.session?.cookie) {
      console.log('\n🍪 COOKIE DETAILS:');
      console.log('Max Age:', req.session.cookie.maxAge);
      console.log('Original Max Age:', req.session.cookie.originalMaxAge);
      console.log('Expires:', req.session.cookie.expires);
      console.log('Secure Flag:', req.session.cookie.secure ? 'Yes' : 'No');
      console.log('HTTP Only:', req.session.cookie.httpOnly ? 'Yes' : 'No');
      console.log('Domain:', req.session.cookie.domain || 'Not set');
      console.log('Path:', req.session.cookie.path);
      console.log('SameSite:', req.session.cookie.sameSite);
    }
    
    console.log('\n⚙️ ENVIRONMENT CONFIGURATION:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
    console.log('API_URL:', process.env.API_URL || 'Not set');
    console.log('COOKIE_DOMAIN:', process.env.COOKIE_DOMAIN || 'Not set');
    console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'Not set');
    
    // Set a test cookie with different settings to see what works
    res.cookie('test_cookie_lax', 'value', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined
    });
    
    res.cookie('test_cookie_none', 'value', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      domain: process.env.COOKIE_DOMAIN || undefined
    });
    
    // Create a test session and try to store something in it
    if (req.session) {
      req.session.testValue = 'Diagnostic test at ' + new Date().toISOString();
      console.log('\n🔍 TEST SESSION VALUE SET');
    }
    
    console.log('=====================================================\n\n');
    
    // Return everything we logged as JSON
    res.json({
      status: 'success',
      message: 'Registration diagnostics complete. Check server logs for detailed information.',
      diagnostics: {
        timestamp: new Date().toISOString(),
        request: {
          ip: req.ip,
          method: req.method,
          url: req.originalUrl
        },
        headers: {
          origin: req.headers.origin || null,
          host: req.headers.host || null,
          referer: req.headers.referer || null,
          userAgent: req.headers['user-agent'] || null,
          contentType: req.headers['content-type'] || null,
          cookiePresent: req.headers.cookie ? true : false
        },
        session: {
          exists: req.session ? true : false,
          id: req.sessionID || null,
          isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : null,
          testValueSet: req.session ? true : false
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || null,
          frontendUrl: process.env.FRONTEND_URL || null,
          apiUrl: process.env.API_URL || null,
          cookieDomain: process.env.COOKIE_DOMAIN || null
        },
        testCookies: [
          {
            name: 'test_cookie_lax',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.COOKIE_DOMAIN || 'default'
          },
          {
            name: 'test_cookie_none',
            sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.COOKIE_DOMAIN || 'default'
          }
        ]
      }
    });
  });
  
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // Image upload endpoint with detailed error handling
  app.post('/api/upload', 
    // First middleware: Authentication check
    (req, res, next) => {
      console.log('🔒 Upload auth check - isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
      if (req.isAuthenticated && req.isAuthenticated()) {
        next();
      } else {
        console.error('❌ Authentication failed for upload request');
        return res.status(401).json({ message: 'Unauthorized', details: 'Authentication required' });
      }
    },
    // Second middleware: Multer file handler with custom error handling
    (req, res, next) => {
      console.log('📁 Starting multer file processing');
      
      // Use multer single file upload but with proper error handling
      upload.single('image')(req, res, (err) => {
        if (err) {
          console.error('❌ Multer error:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              message: 'File too large',
              details: 'Maximum file size is 5MB',
              error: err.message
            });
          }
          return res.status(400).json({ 
            message: 'File upload error',
            details: err.message,
            stack: err.stack
          });
        }
        
        console.log('✅ Multer processing complete, continuing to handler');
        next();
      });
    },
    // Final handler: Process the uploaded file
    async (req, res) => {
      console.log('🔄 Processing file upload request');
      try {
        // Debug info about the request
        console.log('📑 Request body keys:', Object.keys(req.body));
        console.log('📑 Request files:', req.files ? 'Present' : 'Not present');
        console.log('📑 Request file:', req.file ? 'Present' : 'Not present');
        
        if (!req.file) {
          console.error('❌ No file received in request');
          return res.status(400).json({ 
            message: 'No file uploaded',
            details: 'The request was processed but no file was found in the data'
          });
        }
      
      console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'bytes', 'Type:', req.file.mimetype);
      
      // Verify this is actually an image file
      if (!req.file.mimetype.startsWith('image/')) {
        console.error('Invalid file type:', req.file.mimetype);
        return res.status(400).json({ 
          message: 'Invalid file type', 
          details: 'Only image files are supported' 
        });
      }
      
      // Check Cloudinary configuration status
      const cloudinaryStatus = {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
        allConfigured: !!(
          process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_API_KEY && 
          process.env.CLOUDINARY_API_SECRET
        )
      };
      
      console.log('Cloudinary configuration status:', cloudinaryStatus);
      console.log('Sending file to storage service...');
      
      // Upload using the storage service (either local or Cloudinary)
      const result = await storageService.uploadFile(
        req.file.buffer, 
        req.file.originalname
      );
      
      console.log('Upload successful:', result);
      return res.status(200).json({ 
        url: result.url,
        publicId: result.publicId,
        message: 'File uploaded successfully',
        storageType: cloudinaryStatus.allConfigured ? 'cloudinary' : 'local'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error stack:', error.stack);
      
      // Check Cloudinary configuration for error reporting
      const cloudinaryStatus = {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
        allConfigured: !!(
          process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_API_KEY && 
          process.env.CLOUDINARY_API_SECRET
        )
      };
      
      return res.status(500).json({ 
        message: error.message,
        details: error.stack,
        cloudinaryStatus: cloudinaryStatus,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV || 'Not set'
      });
    }
  });
  
  // Middleware to check if user is authenticated
  function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Competitions routes
  app.get("/api/competitions", async (req, res) => {
    try {
      const { category, limit, offset, live, featured, sortBy } = req.query;
      
      const competitions = await dataStorage.listCompetitions({
        category: category as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        isLive: live ? live === 'true' : undefined,
        isFeatured: featured ? featured === 'true' : undefined,
        sortBy: sortBy as 'newest' | 'endingSoon' | 'popular' | undefined
      });
      
      res.json(competitions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/competitions/:id", async (req, res) => {
    try {
      console.log(`🔍 GET competition request for ID: ${req.params.id}`);
      
      // Validate ID
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error(`❌ Invalid competition ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      // Log request details for diagnostic purposes
      console.log(`📝 Request context:`, {
        id: id,
        userAgent: req.headers['user-agent'],
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : null,
        sessionID: req.sessionID || 'no-session'
      });
      
      try {
        // Get competition with enhanced error handling
        const competition = await dataStorage.getCompetition(id);
        
        if (!competition) {
          console.log(`⚠️ Competition not found with ID: ${id}`);
          return res.status(404).json({ message: "Competition not found" });
        }
        
        // Log success with minimal data for verification
        console.log(`✅ Successfully retrieved competition: ID=${id}, Title="${competition.title}"`);
        
        // Send response
        return res.json(competition);
      } catch (storageError: any) {
        console.error(`❌ Storage error fetching competition ID ${id}:`, storageError);
        
        // Attempt to use raw SQL as a last resort
        try {
          console.log(`🔄 Attempting fallback using direct SQL for competition ID: ${id}`);
          const { pool } = await import('./db');
          
          // Get available columns dynamically
          const columnInfoResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'competitions'
          `);
          
          const availableColumns = columnInfoResult.rows.map(row => row.column_name);
          console.log(`📋 Available columns in competitions table:`, availableColumns);
          
          // Build dynamic query
          const columnList = availableColumns.join(', ');
          const result = await pool.query(`
            SELECT ${columnList}
            FROM competitions 
            WHERE id = $1
          `, [id]);
          
          if (result.rows.length === 0) {
            console.log(`⚠️ Competition not found with fallback method, ID: ${id}`);
            return res.status(404).json({ message: "Competition not found" });
          }
          
          // Log success with additional details for monitoring
          console.log(`✅ Successfully retrieved competition with fallback method: ID=${id}, Title="${result.rows[0].title}" (Production fix)`);
          return res.json(result.rows[0]);
        } catch (sqlError: any) {
          console.error(`❌ SQL fallback error for competition ID ${id}:`, sqlError);
          return res.status(500).json({ 
            message: "Could not load competition details", 
            details: "Database error",
            errorId: Date.now()
          });
        }
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error processing competition request:`, error);
      return res.status(500).json({ 
        message: "Could not load competition details",
        errorId: Date.now()
      });
    }
  });

  // Entry routes - protected
  app.post("/api/entries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Check if this is a cart checkout with multiple items
      if (req.body.cartItems && Array.isArray(req.body.cartItems)) {
        console.log('Processing bulk entries from cart:', req.body.cartItems);
        
        const results = [];
        const errors = [];
        
        // Process each cart item
        for (const item of req.body.cartItems) {
          try {
            // Create a modified body for this item
            const modifiedBody = {
              userId: req.user!.id,
              competitionId: item.competitionId,
              ticketCount: item.ticketCount,
              selectedNumbers: item.selectedNumbers || [],
              paymentStatus: req.body.paymentStatus || 'completed',
              stripePaymentId: req.body.stripePaymentId
            };
            
            // Validate the data
            const validatedData = insertEntrySchema.parse(modifiedBody);
            
            // Verify competition exists and has tickets available
            const competition = await dataStorage.getCompetition(validatedData.competitionId);
            if (!competition) {
              errors.push(`Competition with ID ${validatedData.competitionId} not found`);
              continue;
            }
            
            if (!competition.isLive) {
              errors.push(`Competition ${competition.title} is no longer active`);
              continue;
            }
            
            const remainingTickets = competition.totalTickets - competition.ticketsSold;
            if (remainingTickets < validatedData.ticketCount) {
              errors.push(`Not enough tickets available for ${competition.title}`);
              continue;
            }
            
            // Check if user has exceeded max tickets
            const userEntries = await dataStorage.getEntries(req.user!.id);
            const ticketsForThisCompetition = userEntries
              .filter(entry => entry.competitionId === validatedData.competitionId)
              .reduce((sum, entry) => sum + entry.ticketCount, 0);
            
            if (ticketsForThisCompetition + validatedData.ticketCount > competition.maxTicketsPerUser) {
              errors.push(`You can only purchase up to ${competition.maxTicketsPerUser} tickets for ${competition.title}`);
              continue;
            }
            
            // Create entry record with selected numbers
            const entry = await dataStorage.createEntry({
              userId: req.user!.id,
              competitionId: validatedData.competitionId,
              ticketCount: validatedData.ticketCount,
              paymentStatus: validatedData.paymentStatus,
              stripePaymentId: validatedData.stripePaymentId,
              selectedNumbers: validatedData.selectedNumbers
            });
            
            results.push(entry);
          } catch (itemError: any) {
            console.error(`Error processing cart item:`, itemError, item);
            errors.push(`Error processing item for competition ID ${item.competitionId}: ${itemError.message}`);
          }
        }
        
        if (results.length === 0 && errors.length > 0) {
          // If all items failed, return an error
          return res.status(400).json({ 
            message: "Failed to create any entries", 
            errors 
          });
        }
        
        // Return the results, including any errors
        return res.status(201).json({ 
          entries: results, 
          errors: errors.length > 0 ? errors : undefined
        });
      } else {
        // Single entry creation (original code path)
        // Create a modified request body that includes the userId from the session
        const modifiedBody = {
          ...req.body,
          userId: req.user!.id
        };
        
        // Validate the data with the userId included
        const validatedData = insertEntrySchema.parse(modifiedBody);
        
        // Verify competition exists and has tickets available
        const competition = await dataStorage.getCompetition(validatedData.competitionId);
        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }
        
        if (!competition.isLive) {
          return res.status(400).json({ message: "This competition is no longer active" });
        }
        
        const remainingTickets = competition.totalTickets - competition.ticketsSold;
        if (remainingTickets < validatedData.ticketCount) {
          return res.status(400).json({ message: "Not enough tickets available" });
        }
        
        // Check if user has exceeded max tickets
        const userEntries = await dataStorage.getEntries(req.user!.id);
        const ticketsForThisCompetition = userEntries
          .filter(entry => entry.competitionId === validatedData.competitionId)
          .reduce((sum, entry) => sum + entry.ticketCount, 0);
        
        if (ticketsForThisCompetition + validatedData.ticketCount > competition.maxTicketsPerUser) {
          return res.status(400).json({ 
            message: `You can only purchase up to ${competition.maxTicketsPerUser} tickets for this competition` 
          });
        }
        
        // Create entry record with selected numbers if provided
        const entry = await dataStorage.createEntry({
          userId: req.user!.id,
          competitionId: validatedData.competitionId,
          ticketCount: validatedData.ticketCount,
          paymentStatus: validatedData.paymentStatus,
          stripePaymentId: validatedData.stripePaymentId,
          selectedNumbers: validatedData.selectedNumbers || []
        });
        
        res.status(201).json(entry);
      }
    } catch (error: any) {
      console.error("Entry creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const entries = await dataStorage.getEntries(req.user!.id);
      
      // Fetch competitions for each entry
      const entriesWithDetails = await Promise.all(
        entries.map(async (entry) => {
          const competition = await dataStorage.getCompetition(entry.competitionId);
          return {
            ...entry,
            competition: competition
          };
        })
      );
      
      res.json(entriesWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Winners routes
  app.get("/api/winners", async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (userId) {
        const winners = await dataStorage.getWinners(userId);
        
        // Fetch competitions for each win
        const winsWithDetails = await Promise.all(
          winners.map(async (winner) => {
            const competition = await dataStorage.getCompetition(winner.competitionId);
            return {
              ...winner,
              competition: competition
            };
          })
        );
        
        res.json(winsWithDetails);
      } else {
        // If not authenticated, just return recent public winners
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const { amount, cartItems } = req.body;
      
      console.log(`💰 Payment intent request received:`, {
        amount,
        cartItems,
        userId: req.user!.id
      });
      
      // Handle both single competition and cart checkout
      if (cartItems && Array.isArray(cartItems)) {
        // Cart checkout - validate all competitions exist
        for (const item of cartItems) {
          if (!item.competitionId || typeof item.competitionId !== 'number') {
            return res.status(400).json({ 
              message: `Invalid competition ID in cart: ${item.competitionId}` 
            });
          }
          
          const competition = await dataStorage.getCompetition(item.competitionId);
          if (!competition) {
            return res.status(404).json({ 
              message: `Competition with ID ${item.competitionId} not found` 
            });
          }
        }
      }
      
      // Validate that amount is a positive number
      if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        console.error(`❌ Invalid amount for payment: ${amount}`);
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Competition price is in GBP (pounds), but Stripe needs pence (integer)
      // Multiply by 100 to convert from pounds to pence
      const amountInPence = Math.round(amount * 100);
      
      console.log(`💰 Creating payment intent for £${amount} (${amountInPence} pence)`);
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPence, // Amount in pence (Stripe requires integer amount)
        currency: "gbp",
        payment_method_types: ['card'],
        metadata: {
          cartItems: JSON.stringify(cartItems),
          userId: req.user!.id.toString()
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  // Admin middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  // Admin promotion endpoint (for development only)
  app.post("/api/admin/promote-user", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const updatedUser = await dataStorage.promoteToAdmin(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Create new competition
  app.post("/api/admin/competitions", async (req, res) => {
    // Log authentication information
    console.log('🔍 CREATE competition request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for competition creation');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for competition creation');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      console.log(`📌 Attempting to create competition:`, req.body);
      
      const competition = await dataStorage.createCompetition(req.body);
      
      console.log(`✅ Successfully created competition: ${competition.title} (ID: ${competition.id})`);
      res.status(201).json(competition);
    } catch (error: any) {
      console.error(`❌ Error creating competition:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Update competition
  app.patch("/api/admin/competitions/:id", async (req, res) => {
    // Log authentication information
    console.log('🔍 PATCH competition request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      competitionId: req.params.id,
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for competition update');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for competition update');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      console.log(`📌 Attempting to update competition ${id}:`, req.body);
      
      const competition = await dataStorage.updateCompetition(id, req.body);
      
      if (!competition) {
        console.log(`❌ Competition ${id} not found for update`);
        return res.status(404).json({ message: "Competition not found" });
      }
      
      console.log(`✅ Successfully updated competition ${id}`);
      res.json(competition);
    } catch (error: any) {
      console.error(`❌ Error updating competition:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Common handler function for deleting competitions
  function deleteCompetitionHandler(req: Request, res: Response) {
    console.log(`🔎 DELETE Competition handler called from route: ${req.path}`);
    // Log authentication information and request details
    console.log('🔍 DELETE competition request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      competitionId: req.params.id,
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false,
      url: req.url,
      originalUrl: req.originalUrl,
      method: req.method,
      path: req.path,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        cookie: req.headers.cookie ? 'Present' : 'Not present',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for competition deletion');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for competition deletion');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      // Parse the ID with validation
      let id: number;
      try {
        id = parseInt(req.params.id);
        if (isNaN(id)) {
          throw new Error("Invalid competition ID");
        }
      } catch (parseError) {
        console.error(`❌ Invalid competition ID format: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid competition ID format" });
      }
      
      console.log(`📌 Attempting to fetch competition ${id} before deletion`);
      
      // Check if competition exists
      dataStorage.getCompetition(id)
        .then(competition => {
          if (!competition) {
            console.log(`❌ Competition ${id} not found for deletion`);
            return res.status(404).json({ message: "Competition not found" });
          }
          
          console.log(`📌 About to delete competition: ${competition.title} (ID: ${competition.id})`);
          
          // Allow deleting any competition, even with sold tickets
          dataStorage.deleteCompetition(id)
            .then(deleted => {
              // Check deletion result
              if (deleted) {
                console.log(`✅ Successfully deleted competition ${id}`);
                
                // Send a proper success response
                return res.status(204).end();
              } else {
                console.log(`⚠️ Competition ${id} not deleted, but no error thrown`);
                return res.status(400).json({ message: "Unable to delete competition" });
              }
            })
            .catch(deleteError => {
              console.error(`❌ Error during competition deletion for ID ${id}:`, deleteError);
              
              // More informative error for client
              return res.status(500).json({ 
                message: "Failed to delete competition",
                error: deleteError.message,
                code: 'DELETION_ERROR'
              });
            });
        })
        .catch(error => {
          // Log full error details for debugging
          console.error(`❌ Unhandled error in delete competition handler:`, {
            message: error.message,
            stack: error.stack,
            code: error.code,
            details: error
          });
          
          // Send a more specific error message to client
          res.status(500).json({ 
            message: "Server error while processing competition deletion",
            errorType: error.name || "UnknownError"
          });
        });
    } catch (error: any) {
      // Log full error details for debugging
      console.error(`❌ Unhandled error in delete competition handler:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error
      });
      
      // Send a more specific error message to client
      res.status(500).json({ 
        message: "Server error while processing competition deletion",
        errorType: error.name || "UnknownError"
      });
    }
  }
  
  // Register both route formats to handle delete operations
  // Direct SQL deletion endpoint - bypasses all possible issues
  app.delete("/api/competitions/direct/:id", async (req, res) => {
    try {
      console.log("🛑 DIRECT SQL DELETION ROUTE CALLED");
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // @ts-ignore - We know the user object structure
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      console.log(`🔥 Executing direct SQL deletion for competition ID: ${id}`);
      
      // Direct SQL query to delete the competition
      const result = await pool.query('DELETE FROM competitions WHERE id = $1 RETURNING id', [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`✅ Successfully deleted competition with direct SQL: ${id}`);
        return res.status(200).json({ success: true });
      } else {
        console.log(`❌ Competition not found or not deleted with ID: ${id}`);
        return res.status(404).json({ message: "Competition not found" });
      }
    } catch (error) {
      console.error("❌ Error in direct deletion:", error);
      return res.status(500).json({ 
        message: "Error deleting competition",
        error: error.message
      });
    }
  });
  
  // Standard admin route
  app.delete("/api/admin/competitions/:id", (req, res) => deleteCompetitionHandler(req, res));
  
  // Regular competition delete route
  app.delete("/api/competitions/:id", (req, res) => deleteCompetitionHandler(req, res));
  
  // Admin - Get all users
  app.get("/api/admin/users", async (req, res) => {
    // Log authentication information
    console.log('🔍 GET ALL USERS request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for retrieving all users');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for retrieving all users');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      console.log(`📌 Attempting to fetch all users`);
      
      const users = await dataStorage.getAllUsers();
      
      // Remove password before sending response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      console.log(`✅ Successfully retrieved ${users.length} users`);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error(`❌ Error retrieving users:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Promote user to admin
  app.patch("/api/admin/users/:id/promote", async (req, res) => {
    // Log authentication information
    console.log('🔍 PROMOTE USER request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false,
      targetUserId: req.params.id
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for promoting user to admin');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for promoting user');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      console.log(`📌 Attempting to promote user ${id} to admin`);
      
      const updatedUser = await dataStorage.promoteToAdmin(id);
      
      if (!updatedUser) {
        console.log(`❌ User ${id} not found for promotion`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log(`✅ Successfully promoted user ${id} to admin`);
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error(`❌ Error promoting user:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Update user
  app.patch("/api/admin/users/:id", async (req, res) => {
    // Log authentication information
    console.log('🔍 UPDATE USER request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false,
      targetUserId: req.params.id
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for updating user');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for updating user');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      console.log(`📌 Attempting to update user ${id}`);
      
      const updatedUser = await dataStorage.updateUser(id, req.body);
      
      if (!updatedUser) {
        console.log(`❌ User ${id} not found for update`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log(`✅ Successfully updated user ${id}`);
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error(`❌ Error updating user:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Get all entries
  app.get("/api/admin/entries", async (req, res) => {
    // Log authentication information
    console.log('🔍 GET ALL ENTRIES request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for retrieving all entries');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for retrieving all entries');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      console.log(`📌 Attempting to fetch all entries`);
      
      const entries = await dataStorage.getAllEntries();
      
      console.log(`✅ Successfully retrieved ${entries.length} entries`);
      res.json(entries);
    } catch (error: any) {
      console.error(`❌ Error retrieving entries:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Site Configuration Routes
  
  // Get site config by key
  app.get("/api/site-config/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const config = await dataStorage.getSiteConfig(key);
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all site config
  app.get("/api/site-config", async (req, res) => {
    try {
      const configs = await dataStorage.getAllSiteConfig();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update or create site config (admin only)
  app.post("/api/admin/site-config", async (req, res) => {
    // Log authentication information
    console.log('🔍 SITE CONFIG request received:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
      sessionID: req.sessionID || 'no-session-id',
      userId: req.user?.id || 'no-user',
      userIsAdmin: req.user?.isAdmin || false,
      configKey: req.body.key
    });
    
    // Authenticate user
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated for site config update');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log('❌ User is not an admin for site config update');
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const { key, value, description } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: "Key is required" });
      }
      
      console.log(`📌 Attempting to update site config "${key}":`, { value: value ? `${value.substring(0, 30)}...` : null });
      
      const config = await dataStorage.setSiteConfig({
        key,
        value,
        description
      });
      
      console.log(`✅ Successfully updated site config "${key}"`);
      res.status(201).json(config);
    } catch (error: any) {
      console.error(`❌ Error updating site config:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Webhook to handle successful payments
  app.post("/api/payment-webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = req.body;
    }
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { competitionId, ticketCount, userId } = paymentIntent.metadata;
      
      // Find any pending entries matching this payment
      const userEntries = await dataStorage.getEntries(parseInt(userId));
      const pendingEntry = userEntries.find(
        entry => entry.competitionId === parseInt(competitionId) && 
                entry.paymentStatus === "pending"
      );
      
      if (pendingEntry) {
        // Update the entry to completed
        await dataStorage.updateEntryPaymentStatus(
          pendingEntry.id, 
          "completed", 
          paymentIntent.id
        );
      }
    }
    
    res.json({ received: true });
  });

  // This is a duplicate implementation that should be removed in favor of the one in admin-routes.ts
  // However, keeping it temporarily to ensure backward compatibility
  app.post('/api/admin/reset-competitions-legacy', async (req, res) => {
    try {
      // Authentication check
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
      }
      
      console.log('🧹 Starting competition reset process...');
      
      // Comprehensive approach: try several methods to ensure successful reset
      
      // First approach: Use direct SQL transaction with error handling
      try {
        console.log('🔄 Attempt 1: Using SQL transaction');
        await pool.query('BEGIN');
        
        // Clear entries table first (to avoid foreign key constraints)
        console.log('🗑️ Deleting entries...');
        await pool.query('DELETE FROM entries');
        console.log('✓ Entries deleted');
        
        // Then clear winners
        console.log('🗑️ Deleting winners...');
        await pool.query('DELETE FROM winners');
        console.log('✓ Winners deleted');
        
        // Finally clear competitions
        console.log('🗑️ Deleting competitions...');
        await pool.query('DELETE FROM competitions');
        console.log('✓ Competitions deleted');
        
        // Reset sequences
        await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        await pool.query('COMMIT');
        console.log('✅ Transaction completed successfully');
        
        res.status(200).json({ 
          success: true, 
          message: 'All competitions have been successfully deleted.'
        });
        return;
      } catch (txError) {
        console.error('❌ Transaction method failed:', txError);
        // Try to rollback the transaction
        try {
          await pool.query('ROLLBACK');
          console.log('↩️ Transaction rolled back');
        } catch (rollbackError) {
          console.error('❌ Rollback also failed:', rollbackError);
        }
        
        // Don't return here - continue to the next approach
      }
      
      // Second approach: Try one-by-one operations outside a transaction
      try {
        console.log('🔄 Attempt 2: Using individual queries');
        
        // Clear entries table first (to avoid foreign key constraints)
        console.log('🗑️ Deleting entries individually...');
        await pool.query('DELETE FROM entries');
        console.log('✓ Entries deleted individually');
        
        // Then clear winners
        console.log('🗑️ Deleting winners individually...');
        await pool.query('DELETE FROM winners');
        console.log('✓ Winners deleted individually');
        
        // Finally clear competitions
        console.log('🗑️ Deleting competitions individually...');
        await pool.query('DELETE FROM competitions');
        console.log('✓ Competitions deleted individually');
        
        // Reset sequences
        await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        console.log('✅ Individual operations completed successfully');
        
        res.status(200).json({ 
          success: true, 
          message: 'All competitions have been successfully deleted.'
        });
        return;
      } catch (individualError) {
        console.error('❌ Individual queries method failed:', individualError);
        // Continue to the next approach
      }
      
      // Third approach: Force deletion with cascade
      try {
        console.log('🔄 Attempt 3: Using CASCADE operations');
        
        // Temporarily disable foreign key constraints
        await pool.query('SET CONSTRAINTS ALL DEFERRED');
        
        // Delete competitions with force
        console.log('🗑️ Force deleting competitions with CASCADE...');
        await pool.query('TRUNCATE competitions, entries, winners CASCADE');
        console.log('✓ Forced deletion successful');
        
        // Reset sequences
        await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        // Re-enable constraints
        await pool.query('SET CONSTRAINTS ALL IMMEDIATE');
        
        console.log('✅ CASCADE operation completed successfully');
        
        res.status(200).json({ 
          success: true, 
          message: 'All competitions have been successfully deleted with force approach.'
        });
        return;
      } catch (cascadeError) {
        console.error('❌ CASCADE operation failed:', cascadeError);
      }
      
      // If we reach here, all approaches failed
      console.error('❌ All reset approaches failed');
      res.status(500).json({ 
        success: false, 
        message: 'Multiple reset approaches failed. Database might be locked or corrupted.'
      });
    } catch (outerError) {
      console.error('❌ Catastrophic error in reset process:', outerError);
      res.status(500).json({ 
        success: false, 
        message: 'A severe error occurred during the reset process.',
        error: outerError.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}