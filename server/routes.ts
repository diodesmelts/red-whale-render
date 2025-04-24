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
      const id = parseInt(req.params.id);
      const competition = await dataStorage.getCompetition(id);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.json(competition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Entry routes - protected
  app.post("/api/entries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertEntrySchema.parse(req.body);
      
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
      
      // Create entry record
      const entry = await dataStorage.createEntry({
        userId: req.user!.id,
        competitionId: validatedData.competitionId,
        ticketCount: validatedData.ticketCount,
        paymentStatus: "pending",
        stripePaymentId: validatedData.stripePaymentId
      });
      
      res.status(201).json(entry);
    } catch (error: any) {
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
      const { amount, competitionId, ticketCount } = req.body;
      
      // Validate the competition exists
      const competition = await dataStorage.getCompetition(parseInt(competitionId));
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "gbp",
        metadata: {
          competitionId,
          ticketCount,
          userId: req.user!.id.toString()
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
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
  app.post("/api/admin/competitions", isAdmin, async (req, res) => {
    try {
      const competition = await dataStorage.createCompetition(req.body);
      res.status(201).json(competition);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Update competition
  app.patch("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competition = await dataStorage.updateCompetition(id, req.body);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.json(competition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Delete competition
  app.delete("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competition = await dataStorage.getCompetition(id);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Allow deleting any competition, even with sold tickets
      await dataStorage.deleteCompetition(id);
      
      // Return success response without additional checks
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Get all users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await dataStorage.getAllUsers();
      
      // Remove password before sending response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Promote user to admin
  app.patch("/api/admin/users/:id/promote", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await dataStorage.promoteToAdmin(id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Update user
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await dataStorage.updateUser(id, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin - Get all entries
  app.get("/api/admin/entries", isAdmin, async (req, res) => {
    try {
      const entries = await dataStorage.getAllEntries();
      res.json(entries);
    } catch (error: any) {
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
  app.post("/api/admin/site-config", isAdmin, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: "Key is required" });
      }
      
      const config = await dataStorage.setSiteConfig({
        key,
        value,
        description
      });
      
      res.status(201).json(config);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}