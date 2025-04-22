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

// Configure multer for file uploads
const uploadsDir = './uploads';
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
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
  // Set up authentication routes
  setupAuth(app);
  
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // Image upload endpoint
  app.post('/api/upload', isAuthenticated, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const filePath = `/${req.file.path}`; // Path relative to server root
      return res.status(200).json({ 
        url: filePath,
        message: 'File uploaded successfully' 
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
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
      
      // Check if tickets have been sold
      if (competition.ticketsSold > 0) {
        return res.status(400).json({ 
          message: "Cannot delete competition with sold tickets" 
        });
      }
      
      const result = await dataStorage.deleteCompetition(id);
      
      if (!result) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.status(204).end();
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