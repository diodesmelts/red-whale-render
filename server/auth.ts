import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, insertUserSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

// Add proper type declaration for Express User
declare global {
  namespace Express {
    // Use our User type from schema but without password
    interface User extends Omit<import("@shared/schema").User, "password"> {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session configuration with cross-domain compatibility for production
  const sessionSecret = process.env.SESSION_SECRET || "blue-whale-competitions-secret";
  console.log('🔑 Configuring session middleware with environment:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- COOKIE_DOMAIN:', process.env.COOKIE_DOMAIN);
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
  
  // Configure session settings
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-domain in production
      path: "/",
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN || undefined, // Set domain in production
    },
    name: "bw.sid"
  };
  
  console.log('✅ Session cookie configuration:', {
    secure: sessionSettings.cookie?.secure,
    sameSite: sessionSettings.cookie?.sameSite,
    domain: sessionSettings.cookie?.domain,
    path: sessionSettings.cookie?.path,
    maxAge: sessionSettings.cookie?.maxAge
  });

  // Trust proxy for production deploys
  if (process.env.NODE_ENV === 'production') {
    app.set("trust proxy", 1);
  }
  
  // Set up session and Passport
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport to use local username/password strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log('🔍 LocalStrategy starting authentication for:', username);
      try {
        console.log('Attempting to find user by username');
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.error('❌ User not found with username:', username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log('✅ User found:', { id: user.id, isAdmin: user.isAdmin });
        
        console.log('Verifying password');
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.error('❌ Invalid password for user:', username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log('✅ Password valid, user authenticated successfully:', { id: user.id, username: user.username, isAdmin: user.isAdmin });
        
        if (user.isBanned) {
          console.error('❌ User is banned:', username);
          return done(null, false, { message: "Your account has been suspended. Please contact support." });
        }
        
        return done(null, user);
      } catch (error) {
        console.error('❌ Error in LocalStrategy:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('📝 Serializing user to session:', { id: user.id, username: user.username });
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log('🔍 Deserializing user from session ID:', id);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.error('❌ User not found during deserialization, session ID:', id);
        return done(null, false);
      }
      console.log('✅ User deserialized successfully:', { id: user.id, username: user.username, isAdmin: user.isAdmin });
      
      // In production, also check if user has been banned
      if (user.isBanned) {
        console.log('⛔ Preventing login for banned user:', user.username);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error('❌ Error deserializing user:', error);
      done(error);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    console.log('📝 Registration request received');
    try {
      console.log('Request body:', { ...req.body, password: 'REDACTED', confirmPassword: 'REDACTED' });
      
      // Validate request data using Zod schema
      console.log('Validating request data with Zod schema');
      const validatedData = insertUserSchema.parse(req.body);
      console.log('✅ Data validation successful');
      
      // Check if username already exists
      console.log('Checking if username already exists:', validatedData.username);
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        console.log('❌ Username already exists');
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      console.log('Checking if email already exists:', validatedData.email);
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        console.log('❌ Email already exists');
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password and create user
      console.log('Hashing password and creating user');
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        displayName: validatedData.displayName,
        mascot: validatedData.mascot,
        notificationSettings: validatedData.notificationSettings,
        isAdmin: false
      });
      console.log('✅ User created successfully:', { id: user.id, username: user.username });
      
      // Remove password before sending to client
      const { password, ...userWithoutPassword } = user;
      
      // Log the user in
      console.log('Logging in the newly registered user');
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Error logging in new user:', err);
          return next(err);
        }
        console.log('✅ User logged in successfully');
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log('🔒 Login request received');
    try {
      // Log request data without exposing password
      console.log('Login request body:', { username: req.body.username, password: 'REDACTED' });
      
      // Validate login request
      console.log('Validating login data with schema');
      try {
        loginSchema.parse(req.body);
        console.log('✅ Login data validation successful');
      } catch (validationError) {
        console.error('❌ Login data validation failed:', validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ message: validationError.errors });
        }
        throw validationError;
      }
      
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          console.error('❌ Authentication error:', err);
          return next(err);
        }
        
        if (!user) {
          console.error('❌ Authentication failed:', info?.message || "Invalid username or password");
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }
        
        console.log('✅ User authenticated successfully:', { id: user.id, username: user.username, isAdmin: user.isAdmin });
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('❌ Login session creation error:', loginErr);
            return next(loginErr);
          }
          
          console.log('✅ Login session created successfully');
          
          // Remove password before sending to client
          const { password, ...userWithoutPassword } = user;
          console.log('Returning user data to client:', { id: userWithoutPassword.id, username: userWithoutPassword.username, isAdmin: userWithoutPassword.isAdmin });
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      next(error);
    }
  });

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    console.log('🔒 Current user request received');
    console.log('Session ID:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log('❌ Unauthorized - user not authenticated');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log('✅ User is authenticated:', { id: req.user.id, username: req.user.username });
    
    // Remove password before sending to client
    const { password, ...userWithoutPassword } = req.user as User;
    console.log('Sending user data to client:', { id: userWithoutPassword.id, username: userWithoutPassword.username, isAdmin: userWithoutPassword.isAdmin });
    res.json(userWithoutPassword);
  });

  // Health check endpoint is now in routes.ts
  
  // Delete user account endpoint
  app.delete("/api/user", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      
      // First log the user out
      req.logout(async (err) => {
        if (err) return next(err);
        
        // Then delete the user from the database
        const deleted = await storage.deleteUser(userId);
        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete user account" });
        }
        
        // Send success response
        res.status(200).json({ message: "User account deleted successfully" });
      });
    } catch (error) {
      console.error('❌ Error deleting user account:', error);
      next(error);
    }
  });
}