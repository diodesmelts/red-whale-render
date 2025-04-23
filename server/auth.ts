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
  // Simple session configuration - no cross-domain requirements
  const sessionSecret = process.env.SESSION_SECRET || "blue-whale-competitions-secret";
  
  // Configure session settings
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax', // Default for most use cases
      path: "/",
      httpOnly: true,
    },
    name: "bw.sid"
  };

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
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
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
    try {
      // Validate login request
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
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

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove password before sending to client
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Health check endpoint is now in routes.ts
}