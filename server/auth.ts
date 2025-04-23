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
    // 1. Use explicit COOKIE_DOMAIN if set
    if (process.env.COOKIE_DOMAIN) {
      cookieDomain = process.env.COOKIE_DOMAIN;
      console.log(`🍪 Using explicitly configured COOKIE_DOMAIN: ${cookieDomain}`);
    } 
    // 2. Detect from FRONTEND_URL
    else if (process.env.FRONTEND_URL) {
      try {
        // Parse domain from the URL
        const url = new URL(process.env.FRONTEND_URL);
        const hostParts = url.hostname.split('.');
        
        // For domains with at least two parts (example.com), use a domain cookie
        if (hostParts.length >= 2) {
          // Extract the top two parts of the domain for the cookie
          const domain = hostParts.slice(-2).join('.');
          cookieDomain = `.${domain}`;
          console.log(`🍪 Detected cookie domain from FRONTEND_URL: ${cookieDomain}`);
        } else {
          cookieDomain = url.hostname;
          console.log(`🍪 Using hostname from FRONTEND_URL: ${cookieDomain}`);
        }
      } catch (error) {
        console.error(`❌ Error parsing FRONTEND_URL for cookie domain: ${error}`);
        // Fallback to default domains
        cookieDomain = process.env.FRONTEND_URL.includes('bluewhalecompetitions.co.uk') 
          ? '.bluewhalecompetitions.co.uk' 
          : '.onrender.com';
        console.log(`🍪 Using fallback cookie domain: ${cookieDomain}`);
      }
    }
    // 3. Default fallback
    else {
      cookieDomain = '.onrender.com';
      console.log(`🍪 Using default cookie domain: ${cookieDomain}`);
    }
  }
  
  console.log(`🍪 Session configuration:`, {
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    cookieDomain,
    sessionSecret: sessionSecret ? "[SET]" : "[NOT SET]"
  });

  // Configure session settings for better cross-domain cookie handling
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // None for cross-origin in production
      domain: process.env.NODE_ENV === "production" ? cookieDomain : undefined,
      // Set path to root to ensure cookies are available for all paths
      path: "/",
      httpOnly: true // Cookie not accessible via JavaScript
    },
    // Improved naming to avoid conflicts with other apps (prefixed and shortened)
    name: "bw.sid", 
    // Additional proxy trust config required for cross-domain cookies
    proxy: process.env.NODE_ENV === "production"
  };

  // Enhanced diagnostics for session setup
  app.set("trust proxy", 1);
  
  // Log session setup - this will be visible in the Render logs
  console.log(`\n🍪 SETTING UP SESSION AND PASSPORT [${new Date().toISOString()}]`);
  console.log('==================================================');
  console.log('Session settings:', {
    name: sessionSettings.name,
    resave: sessionSettings.resave,
    saveUninitialized: sessionSettings.saveUninitialized,
    cookie: {
      maxAge: sessionSettings.cookie?.maxAge,
      secure: sessionSettings.cookie?.secure,
      sameSite: sessionSettings.cookie?.sameSite,
      domain: sessionSettings.cookie?.domain,
      path: sessionSettings.cookie?.path,
      httpOnly: sessionSettings.cookie?.httpOnly
    },
    environment: process.env.NODE_ENV,
    cookieDomain: process.env.COOKIE_DOMAIN,
    frontendUrl: process.env.FRONTEND_URL,
    apiUrl: process.env.API_URL
  });
  
  // Create middleware for session diagnostics
  const sessionDiagnostics = (req: any, res: any, next: any) => {
    const sessionId = req.sessionID;
    if (!req._logged_session_info && sessionId) {
      req._logged_session_info = true;
      console.log(`\n📦 NEW SESSION CREATED [${new Date().toISOString()}]:`);
      console.log('==================================================');
      console.log('Session info:', {
        id: sessionId,
        cookie: req.session?.cookie,
        headers: {
          host: req.headers.host,
          origin: req.headers.origin,
          referer: req.headers.referer,
          'user-agent': req.headers['user-agent']
        }
      });
      console.log('==================================================\n');
    }
    next();
  };
  
  app.use(session(sessionSettings));
  app.use(sessionDiagnostics);
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('✅ Session and Passport initialized');
  console.log('==================================================\n');
  
  // Add session error logger middleware
  app.use((req, res, next) => {
    // Track original URL for error diagnostics
    req._originalUrl = req.originalUrl || req.url;
    
    // Catch and log session errors
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      // Log 500 errors which might indicate session issues
      if (res.statusCode >= 500) {
        console.error(`\n❌ SERVER ERROR IN REQUEST [${new Date().toISOString()}]:`);
        console.error('==================================================');
        console.error(`Error ${res.statusCode} in ${req.method} ${req._originalUrl}`);
        console.error('Request headers:', {
          origin: req.headers.origin,
          referer: req.headers.referer,
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          cookie: req.headers.cookie ? 'Present' : 'Not present',
        });
        console.error('Session info (if available):', {
          exists: !!req.session,
          id: req.sessionID || 'none',
          authenticated: req.isAuthenticated ? req.isAuthenticated() : 'function-not-available',
        });
        console.error('==================================================\n');
      }
      
      return originalEnd.apply(res, args);
    };
    
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`\n🔑 LOGIN ATTEMPT DIAGNOSTICS [${new Date().toISOString()}]`);
        console.log('==================================================');
        console.log(`🔍 Attempting to authenticate user: ${username}`);
        
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`❌ Authentication failed: User not found for username '${username}'`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`✅ User found: ${username} (ID: ${user.id})`);
        
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log(`❌ Authentication failed: Invalid password for user '${username}'`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`✅ Password verification successful for user '${username}'`);
        console.log('==================================================\n');
        return done(null, user);
      } catch (error) {
        console.error(`❌ Authentication error for username '${username}':`, error);
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
    // Extreme logging for Render - this will log to stdout
    console.log("=====================================================");
    console.log("🔴 REGISTRATION ATTEMPT AT " + new Date().toISOString());
    console.log("=====================================================");
    console.log("🔹 Registration request received:");
    console.log("IP:", req.ip);
    console.log("Origin:", req.headers.origin || "Not provided");
    console.log("Referer:", req.headers.referer || "Not provided"); 
    console.log("Host:", req.headers.host || "Not provided");
    console.log("User-Agent:", req.headers['user-agent'] || "Not provided");
    console.log("Content-Type:", req.headers['content-type'] || "Not provided");
    console.log("Username:", req.body.username || "Not provided");
    console.log("Email:", req.body.email || "Not provided");
    console.log("Environment:", process.env.NODE_ENV || "Not set");
    console.log("=====================================================");
    
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

  // Special test endpoint for authentication diagnostics
  app.post("/api/test-register", async (req, res) => {
    try {
      console.log('\n\n======================================================');
      console.log(`📋 TEST REGISTRATION ATTEMPT [${new Date().toISOString()}]`);
      console.log('======================================================');
      
      console.log('🌐 REQUEST INFO:');
      console.log('IP:', req.ip);
      console.log('Method:', req.method);
      console.log('URL:', req.originalUrl);
      
      console.log('\n🔤 REQUEST HEADERS:');
      Object.keys(req.headers).forEach(key => {
        console.log(`${key}:`, key === 'cookie' ? `Length: ${(req.headers[key] as string)?.length || 0}` : req.headers[key]);
      });
      
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
      
      // Test with made-up data to avoid creating a real user
      const testData = {
        username: `test-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        password: 'Test password',
      };
      
      console.log('\n👤 TEST USER DATA:');
      console.log('Username:', testData.username);
      console.log('Email:', testData.email);
      
      // Simulate creating a session and setting cookies
      if (req.session) {
        req.session.testData = {
          timestamp: new Date().toISOString(),
          message: 'This is a test session value'
        };
        console.log('\n✅ TEST SESSION VALUE SET');
      }
      
      // Set test cookies with different settings
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
      
      console.log('======================================================\n\n');
      
      // Return success response with diagnostic info
      res.json({
        status: 'success',
        message: 'Registration test completed. Check server logs for detailed information.',
        diagnostics: {
          timestamp: new Date().toISOString(),
          testUser: testData.username,
          environment: process.env.NODE_ENV || 'development',
          sessionCreated: req.session ? true : false,
          sessionId: req.sessionID || 'none',
          cookiesSet: [
            {
              name: 'test_cookie_lax',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            },
            {
              name: 'test_cookie_none',
              sameSite: 'none',
              secure: process.env.NODE_ENV === 'production'
            }
          ]
        }
      });
    } catch (error: any) {
      console.error('❌ TEST REGISTRATION ERROR:', error);
      res.status(500).json({ 
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/user", (req, res) => {
    // Enhanced logging for authentication debugging in production
    const requestInfo = {
      path: req.path,
      method: req.method,
      ip: req.ip,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'cookie': req.headers.cookie ? 'Present' : 'Not present',
        'cookie-length': req.headers.cookie ? req.headers.cookie.length : 0,
      },
      session: {
        exists: !!req.session,
        id: req.sessionID,
        authenticated: req.isAuthenticated(),
        cookie: req.session?.cookie ? {
          maxAge: req.session.cookie.maxAge,
          originalMaxAge: req.session.cookie.originalMaxAge,
          expires: req.session.cookie.expires,
          secure: req.session.cookie.secure,
          httpOnly: req.session.cookie.httpOnly,
          domain: req.session.cookie.domain,
          path: req.session.cookie.path,
          sameSite: req.session.cookie.sameSite,
        } : null
      },
      authInfo: {
        isAuthenticated: req.isAuthenticated(),
        passport: req.session?.passport,
        user: req.user ? { id: req.user.id, username: req.user.username } : null
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        FRONTEND_URL: process.env.FRONTEND_URL,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        API_URL: process.env.API_URL,
        SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set'
      }
    };

    // Log authentication request to server logs
    console.log(`\n🔒 AUTH REQUEST DIAGNOSTICS [${new Date().toISOString()}]:`);
    console.log('==================================================');
    console.log(JSON.stringify(requestInfo, null, 2));
    console.log('==================================================\n');

    if (!req.isAuthenticated()) {
      console.log('❌ Authentication failed: Not authenticated');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove password before sending to client
    const { password, ...userWithoutPassword } = req.user!;
    console.log(`✅ Authentication successful for user: ${req.user!.username} (ID: ${req.user!.id})`);
    res.json(userWithoutPassword);
  });
}
