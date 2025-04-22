import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, insertUserSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // Simple hash for development
  return password;
}

async function comparePasswords(supplied: string, stored: string) {
  // Simple comparison for development
  return supplied === stored;
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "red-whale-competitions-secret";
  
  console.log("Setting up session with secret:", sessionSecret.substring(0, 3) + "****");
  console.log("Current NODE_ENV:", process.env.NODE_ENV);

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "blue-whale-sid", // Changed to match current project name
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request data using Zod schema
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password and create user
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: await hashPassword(validatedData.password),
        displayName: validatedData.displayName,
        mascot: validatedData.mascot,
        notificationSettings: validatedData.notificationSettings,
        isAdmin: false
      });
      
      // Remove password before sending to client
      const { password, ...userWithoutPassword } = user;
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      console.log("Login attempt with data:", { username: req.body.username });
      
      // Validate request data
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          
          console.log("Login successful for user:", user.username);
          console.log("Session ID:", req.sessionID);
          
          // Remove password before sending to client
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Log info about the session before logout
    console.log("Logout request received. Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("Session data:", req.session);
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user request received. Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("Session data:", req.session);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove password before sending to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Development-only route to directly login the admin user (for testing)
  // IMPORTANT: This should be removed in production!
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/dev/login-admin", async (req, res) => {
      try {
        // Get the admin user
        let adminUser = await storage.getUserByUsername("admin");
        
        // If admin doesn't exist, create one
        if (!adminUser) {
          console.log("Creating admin user for development");
          adminUser = await storage.createUser({
            username: "admin",
            password: "Jack123!",
            email: "admin@example.com",
            displayName: "Admin User",
            mascot: "blue-whale",
            isAdmin: true,
            notificationSettings: {
              email: true,
              inApp: true
            }
          });
          console.log("Admin user created:", adminUser);
        }
        
        // Log the user in directly
        req.login(adminUser, (err) => {
          if (err) {
            console.error("Direct login error:", err);
            return res.status(500).json({ message: "Failed to login admin" });
          }
          
          console.log("Admin user logged in directly. Session ID:", req.sessionID);
          
          // Remove password before sending
          const { password, ...userWithoutPassword } = adminUser;
          return res.json({ 
            message: "Admin user logged in successfully", 
            user: userWithoutPassword,
            sessionID: req.sessionID
          });
        });
      } catch (error) {
        console.error("Error in direct admin login:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
  }
}