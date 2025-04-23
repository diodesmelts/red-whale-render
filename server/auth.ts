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
  const sessionSecret = process.env.SESSION_SECRET || "red-whale-competitions-secret";
  
  // Determine the domain for cookies in production
  let cookieDomain;
  if (process.env.NODE_ENV === "production") {
    // Use environment variable if defined, otherwise try to detect from request origin
    cookieDomain = process.env.COOKIE_DOMAIN || 
                  (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('bluewhalecompetitions.co.uk') 
                    ? '.bluewhalecompetitions.co.uk' 
                    : '.onrender.com');
  }
  
  console.log(`🍪 Session configuration:`, {
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    cookieDomain,
    sessionSecret: sessionSecret ? "[SET]" : "[NOT SET]"
  });

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      domain: process.env.NODE_ENV === "production" ? cookieDomain : undefined,
      // Set path to root to ensure cookies are available for all paths
      path: "/"
    },
    // Improve naming to avoid conflicts with other apps
    name: "bluewhale.sid"
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
    console.log("🔹 Registration request received:", {
      ip: req.ip,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      body: { ...req.body, password: "[REDACTED]" }
    });
    
    try {
      // Validate request data using Zod schema
      console.log("⚙️ Validating registration data");
      const validatedData = insertUserSchema.parse(req.body);
      console.log("✅ Validation successful");
      
      // Check if username already exists
      console.log("🔍 Checking if username exists:", validatedData.username);
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        console.log("❌ Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      console.log("🔍 Checking if email exists:", validatedData.email);
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        console.log("❌ Email already exists");
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password and create user
      console.log("🔒 Hashing password");
      const hashedPassword = await hashPassword(validatedData.password);
      console.log("👤 Creating new user");
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        displayName: validatedData.displayName,
        mascot: validatedData.mascot,
        notificationSettings: validatedData.notificationSettings,
        isAdmin: false
      });
      console.log("✅ User created successfully", { id: user.id, username: user.username });
      
      // Remove password before sending to client
      const { password, ...userWithoutPassword } = user;
      
      // Log the user in
      console.log("🔑 Attempting to log in new user via req.login");
      req.login(user, (err) => {
        if (err) {
          console.error("❌ Login error after registration:", err);
          return next(err);
        }
        console.log("✅ User logged in successfully");
        console.log("📦 Session info:", {
          sessionID: req.sessionID,
          sessionCookie: req.session?.cookie,
          isAuthenticated: req.isAuthenticated()
        });
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("❌ Registration error:", error);
      
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error details:", JSON.stringify(error.errors));
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("🔹 Login request received:", {
      ip: req.ip,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      body: { ...req.body, password: "[REDACTED]" }
    });
    
    try {
      // Validate login request
      console.log("⚙️ Validating login data");
      const validatedData = loginSchema.parse(req.body);
      console.log("✅ Login data validation passed");
      
      console.log("🔑 Authenticating user:", validatedData.username);
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          console.error("❌ Authentication error:", err);
          return next(err);
        }
        
        if (!user) {
          console.log("❌ Authentication failed:", info?.message || "Invalid username or password");
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }
        
        console.log("✅ Authentication successful for user:", user.username);
        console.log("🔑 Attempting to establish session via req.login");
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("❌ Login error:", loginErr);
            return next(loginErr);
          }
          
          console.log("✅ Login successful, session established");
          console.log("📦 Session info:", {
            sessionID: req.sessionID,
            sessionCookie: req.session?.cookie,
            isAuthenticated: req.isAuthenticated()
          });
          
          // Remove password before sending to client
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error("❌ Login error:", error);
      
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error details:", JSON.stringify(error.errors));
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Remove password before sending to client
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
