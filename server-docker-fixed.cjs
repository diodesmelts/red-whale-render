// Server startup script for Docker deployment
// This runs inside the Docker container using CommonJS

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');
const multer = require('multer');
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const connectPgPromise = require('@neondatabase/serverless');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

// PRODUCTION IMPROVEMENTS: Console filter for production environments
// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug
};

// Patterns of log messages to suppress in production
const suppressionPatterns = [
  /Requesting active cart items/,
  /Request to get ticket statistics/,
  /Request to GET/,
  /Request to POST/,
  /CORS request/,
  /User deserialized successfully/,
  /Deserializing user/,
  /hasSession:/,
  /sessionID:/,
  /hasSessionData:/
];

// Only modify logging in production
if (process.env.NODE_ENV === 'production') {
  console.log('🔇 Setting up production logging - reducing log verbosity');
  
  // Override console.log to filter out noisy messages
  console.log = function(...args) {
    // Convert arguments to string for pattern testing
    const logString = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    // Check if this log message should be suppressed
    const shouldSuppress = suppressionPatterns.some(pattern => 
      pattern.test(logString)
    );
    
    // Only output if not suppressed
    if (!shouldSuppress) {
      originalConsole.log(...args);
    }
  };
  
  // Apply similar filtering to console.info and console.debug
  console.info = function(...args) {
    const logString = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    const shouldSuppress = suppressionPatterns.some(pattern => 
      pattern.test(logString)
    );
    
    if (!shouldSuppress) {
      originalConsole.info(...args);
    }
  };
  
  console.debug = function(...args) {
    // Suppress all debug logs in production
    return;
  };
  
  console.log('🔇 Production logging configured - routine logs suppressed');
}

// PRODUCTION IMPROVEMENTS: Helper functions for error responses
function errorResponse(res, status, message, defaultData = {}) {
  return res.status(status).json({
    message,
    ...defaultData
  });
}

// Default data structures for error responses
function defaultTicketStats() {
  return {
    totalTickets: 0,
    purchasedTickets: 0,
    inCartTickets: 0,
    availableTickets: 0,
    soldTicketsCount: 0,
    allNumbers: {
      totalRange: [],
      purchased: [],
      inCart: []
    }
  };
}

function defaultCartItems() {
  return {
    inCartNumbers: []
  };
}

// Set up Stripe if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16"
    });
    // Perform a lightweight API call to verify the key works
    stripe.paymentMethods.list({ limit: 1 })
      .then(() => {
        console.log('✅ Stripe initialized and API key verified successfully');
      })
      .catch(error => {
        console.error('❌ Stripe API key verification failed:', error.message);
        // Don't assign null here - leave stripe as the instance
        // so it will show a proper error on checkout attempts
      });
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
    // Keep stripe as null so we'll return a helpful error
  }
} else {
  console.log('⚠️ No Stripe secret key found in environment variables');
}

// Create Express app
const app = express();

// Set up CORS for all routes
const cors = require('cors');

// Determine allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  [
    'http://localhost:3000', 
    'https://bluewhalecompetitions.co.uk',
    'http://bluewhalecompetitions.co.uk',
    'https://www.bluewhalecompetitions.co.uk',
    'http://www.bluewhalecompetitions.co.uk',
    'https://mobycomps.co.uk',
    'http://mobycomps.co.uk',
    'https://www.mobycomps.co.uk',
    'http://www.mobycomps.co.uk'
  ];

console.log('🔌 Allowed origins:', allowedOrigins);

// Configure CORS with default handling for missing origin
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      // or known origins
      if (!origin) {
        console.log(`🔄 Allowing request with no origin`);
      } else {
        console.log(`🔄 CORS request from origin: ${origin}`);
        console.log(`🔄 Origin ${origin} is allowed`);
      }
      callback(null, true);
    } else {
      console.log(`❌ CORS request from disallowed origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isRender = !!process.env.RENDER;
const projectRoot = __dirname;

console.log('🌐 Environment:', {
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  isRender,
  projectRoot,
  workingDir: process.cwd()
});

// Configure Cloudinary if the credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('☁️ Cloudinary configured for image uploads');
} else {
  console.log('⚠️ Cloudinary credentials missing, using local file storage for images');
}

// Configure multer for file uploads
// If in production/cloud, use memory storage as a buffer for Cloudinary
// If in development without Cloudinary, use disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the uploads directory exists
    const uploadsDir = path.join(projectRoot, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '-'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only allow one file at a time
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Setup PostgreSQL connection using environment variables
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set. Please set it to connect to the database.");
  process.exit(1);
}

const db = new Pool({
  connectionString: dbUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

db.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
  })
  .catch(err => {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    process.exit(1); // Fail the app if we can't connect to the database
  });

// Middleware to parse JSON requests
app.use(express.json());

// Add session management middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'placeholder-secret-do-not-use-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction || isRender, // Important for proper cookie handling behind proxies
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: isProduction, // Only secure in production
    sameSite: isProduction ? 'none' : 'lax',
    path: "/",
    httpOnly: true,
  },
  name: "bw.sid"
}));

// Trust proxy when in production (needed for secure cookies behind load balancers)
if (isProduction || isRender) {
  console.log('🔒 Setting trust proxy to handle secure cookies in production');
  app.set('trust proxy', 1);
}

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Utility functions for password handling
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function comparePasswords(supplied, stored) {
  return new Promise((resolve, reject) => {
    const [hashed, salt] = stored.split('.');
    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(
        Buffer.from(hashed, 'hex'),
        derivedKey
      ));
    });
  });
}

// Set up passport local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    console.log(`🔍 Authenticating user: ${username}`);
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return done(null, false);
    }

    const user = result.rows[0];
    const passwordMatches = await comparePasswords(password, user.password);

    if (!passwordMatches) {
      console.log(`❌ Incorrect password for user: ${username}`);
      return done(null, false);
    }

    console.log(`✅ Authentication successful for user: ${username}`);
    return done(null, user);
  } catch (error) {
    console.error(`❌ Error during authentication:`, error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  console.log(`🔒 Serializing user to session: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(`🔍 Deserializing user from session ID: ${id}`);
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found for ID: ${id}`);
      return done(null, false);
    }
    
    const user = result.rows[0];
    console.log(`✅ User deserialized successfully: { id: ${user.id}, username: '${user.username}', isAdmin: ${user.is_admin} }`);
    
    // Convert snake_case to camelCase
    return done(null, {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin
    });
  } catch (error) {
    console.error(`❌ Error during deserialization:`, error);
    return done(error);
  }
});

// Middleware for route protection
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

// Log basic request info for API paths
app.use('/api', (req, res, next) => {
  const sessionInfo = {
    hasSession: req.session ? true : false,
    sessionID: req.sessionID || 'no-session-id',
    hasSessionData: req.session && Object.keys(req.session).length > 0
  };
  
  console.log(`🔍 Request to ${req.method} ${req.path}`, sessionInfo);
  next();
});

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Session test endpoint (for troubleshooting)
app.get('/api/session-test', (req, res) => {
  // Test value to validate session persistence
  if (!req.session.testValue) {
    req.session.testValue = Date.now();
  }
  
  res.json({
    sessionID: req.sessionID,
    testValue: req.session.testValue,
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    } : null
  });
});

// Current user endpoint
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  res.json(req.user);
});

// Login route
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error in login:', err);
      return res.status(500).json({ message: "Internal server error during login" });
    }
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    req.login(user, (err) => {
      if (err) {
        console.error('Error in req.login:', err);
        return res.status(500).json({ message: "Error establishing session" });
      }
      
      // Return the user object (without password)
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      });
    });
  })(req, res, next);
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error('Error during logout:', err);
      return res.status(500).json({ message: "Error during logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Username or email already in use" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    const result = await db.query(
      'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin',
      [username, email, hashedPassword, false]
    );
    
    const newUser = result.rows[0];
    
    // Log in the user automatically
    req.login({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.is_admin
    }, (err) => {
      if (err) {
        console.error('Error in automatic login after registration:', err);
        return res.status(500).json({ message: "Registration successful but error during automatic login" });
      }
      
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin
      });
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: "Error during registration" });
  }
});

// Image upload route - supports both Cloudinary (production) and local file storage (dev)
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    // If we have Cloudinary credentials and this is a suitable environment
    if (isProduction && 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get the file path from multer
      const filePath = req.file.path;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'competitions',
        resource_type: 'image'
      });
      
      // Remove the temporary local file
      fs.unlinkSync(filePath);
      
      // Return the Cloudinary URL
      return res.json({ 
        url: result.secure_url,
        provider: 'cloudinary'
      });
    } else {
      // Local file storage (for development or when Cloudinary is not available)
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In development, we serve files directly from the uploads folder
      // The path should be relative to the server root
      const fileUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        url: fileUrl,
        provider: 'local'
      });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: "Error uploading image", error: error.message });
  }
});

// Competitions API endpoints
// Get all competitions
app.get('/api/competitions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM competitions 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: "Error fetching competitions" });
  }
});

// Get a single competition by ID
app.get('/api/competitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM competitions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ message: "Error fetching competition" });
  }
});

// Get competitions to feature on the hero banner
app.get('/api/hero-banner-competitions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM competitions 
      WHERE push_to_hero_banner = true AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hero banner competitions:', error);
    res.status(500).json({ message: "Error fetching hero banner competitions" });
  }
});

// Create a new competition (admin only)
app.post('/api/admin/competitions', isAdmin, async (req, res) => {
  try {
    const { 
      title, description, imageUrl, category, prizeValue, ticketPrice, 
      totalTickets, startDate, endDate, status 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !prizeValue || !ticketPrice || !totalTickets) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const result = await db.query(`
      INSERT INTO competitions (
        title, description, image_url, category, prize_value, 
        ticket_price, total_tickets, start_date, end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `, [
      title, description, imageUrl, category, prizeValue, 
      ticketPrice, totalTickets, startDate, endDate, status || 'active'
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ message: "Error creating competition", error: error.message });
  }
});

// Update a competition (admin only)
app.put('/api/admin/competitions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, imageUrl, category, prizeValue, ticketPrice, 
      totalTickets, startDate, endDate, status, pushToHeroBanner, brand, drawDate 
    } = req.body;
    
    // Get the current competition to merge with updates
    const currentComp = await db.query('SELECT * FROM competitions WHERE id = $1', [id]);
    
    if (currentComp.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Start building the SQL query
    let queryParts = [];
    let queryParams = [];
    let paramCounter = 1;
    
    // Only include fields that are provided in the request
    if (title !== undefined) {
      queryParts.push(`title = $${paramCounter++}`);
      queryParams.push(title);
    }
    
    if (description !== undefined) {
      queryParts.push(`description = $${paramCounter++}`);
      queryParams.push(description);
    }
    
    if (imageUrl !== undefined) {
      queryParts.push(`image_url = $${paramCounter++}`);
      queryParams.push(imageUrl);
    }
    
    if (category !== undefined) {
      queryParts.push(`category = $${paramCounter++}`);
      queryParams.push(category);
    }
    
    if (prizeValue !== undefined) {
      queryParts.push(`prize_value = $${paramCounter++}`);
      queryParams.push(prizeValue);
    }
    
    if (ticketPrice !== undefined) {
      queryParts.push(`ticket_price = $${paramCounter++}`);
      queryParams.push(ticketPrice);
    }
    
    if (totalTickets !== undefined) {
      queryParts.push(`total_tickets = $${paramCounter++}`);
      queryParams.push(totalTickets);
    }
    
    if (startDate !== undefined) {
      queryParts.push(`start_date = $${paramCounter++}`);
      queryParams.push(startDate);
    }
    
    if (endDate !== undefined) {
      queryParts.push(`end_date = $${paramCounter++}`);
      queryParams.push(endDate);
    }
    
    if (status !== undefined) {
      queryParts.push(`status = $${paramCounter++}`);
      queryParams.push(status);
    }
    
    if (pushToHeroBanner !== undefined) {
      queryParts.push(`push_to_hero_banner = $${paramCounter++}`);
      queryParams.push(pushToHeroBanner);
    }
    
    if (brand !== undefined) {
      queryParts.push(`brand = $${paramCounter++}`);
      queryParams.push(brand);
    }
    
    if (drawDate !== undefined) {
      queryParts.push(`draw_date = $${paramCounter++}`);
      queryParams.push(drawDate);
    }
    
    // Add the competition ID as the last parameter
    queryParams.push(id);
    
    // Execute the update query if there are fields to update
    if (queryParts.length > 0) {
      const query = `
        UPDATE competitions 
        SET ${queryParts.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, queryParams);
      res.json(result.rows[0]);
    } else {
      // If no fields to update, just return the current competition
      res.json(currentComp.rows[0]);
    }
  } catch (error) {
    console.error('Error updating competition:', error);
    res.status(500).json({ message: "Error updating competition", error: error.message });
  }
});

// Delete a competition (admin only)
app.delete('/api/admin/competitions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the competition exists
    const checkResult = await db.query('SELECT id FROM competitions WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Delete the competition
    await db.query('DELETE FROM competitions WHERE id = $1', [id]);
    
    res.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ message: "Error deleting competition" });
  }
});

// Get active cart items for a competition
app.post('/api/competitions/:id/active-cart-items', async (req, res) => {
  try {
    const { id } = req.params;
    const { cartItems } = req.body;
    
    console.log(`🛒 Requesting active cart items for competition: ${id}`);
    
    // Check if the competition exists
    const compResult = await db.query('SELECT id FROM competitions WHERE id = $1', [id]);
    
    if (compResult.rows.length === 0) {
      console.error(`❌ Competition not found for active cart items: ${id}`);
      return errorResponse(res, 404, "Competition not found", defaultCartItems());
    }
    
    // Get all numbers that are already in active carts (within the past 30 minutes)
    const cartQuery = `
      SELECT ticket_number 
      FROM cart_items 
      WHERE competition_id = $1 
        AND created_at > NOW() - INTERVAL '30 minutes'
    `;
    
    const cartResult = await db.query(cartQuery, [id]);
    
    // Extract the numbers from the results
    const inCartNumbers = cartResult.rows.map(row => row.ticket_number);
    
    // Filter out any numbers that are already in the user's own cart
    const userCartNumbers = Array.isArray(cartItems) ? cartItems : [];
    
    // Create a Set for O(1) lookups
    const userCartSet = new Set(userCartNumbers);
    
    // Filter the inCartNumbers to exclude those in the user's cart
    const filteredCartNumbers = inCartNumbers.filter(num => !userCartSet.has(num));
    
    return res.json({ inCartNumbers: filteredCartNumbers });
  } catch (error) {
    console.error('Error fetching active cart items:', error);
    return errorResponse(res, 500, "Error processing cart items", defaultCartItems());
  }
});

// Get ticket statistics for a competition
app.get('/api/competitions/:id/ticket-stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Request to get ticket statistics for competition: ${id}`);
    
    // Check if the competition exists
    const compResult = await db.query('SELECT total_tickets FROM competitions WHERE id = $1', [id]);
    
    if (compResult.rows.length === 0) {
      console.error(`❌ Competition not found for ticket stats: ${id}`);
      return errorResponse(res, 404, "Competition not found", defaultTicketStats());
    }
    
    const totalTickets = compResult.rows[0].total_tickets;
    
    // Get all purchased tickets for this competition
    const purchasedQuery = `
      SELECT ticket_number 
      FROM purchased_tickets 
      WHERE competition_id = $1
    `;
    
    const purchasedResult = await db.query(purchasedQuery, [id]);
    const purchasedNumbers = purchasedResult.rows.map(row => row.ticket_number);
    
    // Get all tickets in active carts (not yet purchased)
    const cartQuery = `
      SELECT ticket_number 
      FROM cart_items 
      WHERE competition_id = $1 
        AND created_at > NOW() - INTERVAL '30 minutes'
    `;
    
    const cartResult = await db.query(cartQuery, [id]);
    const inCartNumbers = cartResult.rows.map(row => row.ticket_number);
    
    // Calculate available tickets (total - purchased - in cart)
    const purchasedSet = new Set(purchasedNumbers);
    const inCartSet = new Set(inCartNumbers);
    
    // Create an array from 1 to totalTickets
    const allNumbersArray = Array.from({ length: totalTickets }, (_, i) => i + 1);
    
    // Count tickets
    const purchasedTickets = purchasedNumbers.length;
    const inCartTickets = inCartNumbers.length;
    
    // Count the available tickets (not purchased or in cart)
    const availableTickets = allNumbersArray.filter(
      num => !purchasedSet.has(num) && !inCartSet.has(num)
    ).length;
    
    return res.json({
      totalTickets,
      purchasedTickets,
      inCartTickets,
      availableTickets,
      soldTicketsCount: purchasedTickets,
      allNumbers: {
        totalRange: allNumbersArray,
        purchased: Array.from(purchasedSet),
        inCart: Array.from(inCartSet)
      }
    });
  } catch (error) {
    console.error('Error calculating ticket statistics:', error);
    return errorResponse(res, 500, 
      error.message || "Error calculating ticket statistics", 
      defaultTicketStats()
    );
  }
});

// Create or update cart items
app.post('/api/cart/items', async (req, res) => {
  try {
    const { competitionId, ticketNumbers } = req.body;
    
    if (!competitionId || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    
    // Check if the competition exists
    const compResult = await db.query('SELECT id FROM competitions WHERE id = $1', [competitionId]);
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Generate a unique cart ID if not authenticated
    // For authenticated users, we use their user ID
    const cartId = req.isAuthenticated() ? `user_${req.user.id}` : `anon_${req.sessionID}`;
    
    // Check which numbers are already purchased
    const purchasedQuery = `
      SELECT ticket_number 
      FROM purchased_tickets 
      WHERE competition_id = $1 
        AND ticket_number = ANY($2::int[])
    `;
    
    const purchasedResult = await db.query(purchasedQuery, [competitionId, ticketNumbers]);
    const purchasedNumbers = purchasedResult.rows.map(row => row.ticket_number);
    
    if (purchasedNumbers.length > 0) {
      return res.status(409).json({ 
        message: "Some ticket numbers are already purchased", 
        purchasedNumbers 
      });
    }
    
    // Check which numbers are in other active carts
    const cartQuery = `
      SELECT ticket_number 
      FROM cart_items 
      WHERE competition_id = $1 
        AND ticket_number = ANY($2::int[]) 
        AND cart_id != $3
        AND created_at > NOW() - INTERVAL '30 minutes'
    `;
    
    const cartResult = await db.query(cartQuery, [competitionId, ticketNumbers, cartId]);
    const inOtherCarts = cartResult.rows.map(row => row.ticket_number);
    
    if (inOtherCarts.length > 0) {
      return res.status(409).json({ 
        message: "Some ticket numbers are in other carts", 
        inOtherCarts 
      });
    }
    
    // Remove any existing cart items for this competition and cart
    await db.query(`
      DELETE FROM cart_items 
      WHERE competition_id = $1 AND cart_id = $2
    `, [competitionId, cartId]);
    
    // Insert new cart items
    const insertPromises = ticketNumbers.map(ticketNumber => {
      return db.query(`
        INSERT INTO cart_items (cart_id, competition_id, ticket_number, created_at) 
        VALUES ($1, $2, $3, NOW())
      `, [cartId, competitionId, ticketNumber]);
    });
    
    await Promise.all(insertPromises);
    
    res.status(201).json({ 
      message: "Tickets added to cart", 
      cartId, 
      competitionId, 
      ticketNumbers 
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: "Error updating cart" });
  }
});

// Get the current user's cart
app.get('/api/cart', async (req, res) => {
  try {
    // Generate cart ID based on auth status
    const cartId = req.isAuthenticated() ? `user_${req.user.id}` : `anon_${req.sessionID}`;
    
    // Get all items in the cart that are still active (within 30 minutes)
    const cartQuery = `
      SELECT ci.competition_id, ci.ticket_number, c.title, c.ticket_price, c.image_url
      FROM cart_items ci
      JOIN competitions c ON ci.competition_id = c.id
      WHERE ci.cart_id = $1 AND ci.created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY ci.created_at DESC
    `;
    
    const cartResult = await db.query(cartQuery, [cartId]);
    
    // Group by competition
    const cartByCompetition = {};
    
    cartResult.rows.forEach(item => {
      if (!cartByCompetition[item.competition_id]) {
        cartByCompetition[item.competition_id] = {
          id: item.competition_id,
          title: item.title,
          ticketPrice: item.ticket_price,
          imageUrl: item.image_url,
          tickets: []
        };
      }
      
      cartByCompetition[item.competition_id].tickets.push(item.ticket_number);
    });
    
    // Convert to array
    const cartItems = Object.values(cartByCompetition);
    
    // Calculate totals
    const totalItems = cartResult.rows.length;
    const totalAmount = cartItems.reduce((sum, comp) => {
      return sum + (comp.ticketPrice * comp.tickets.length);
    }, 0);
    
    res.json({
      cartId,
      items: cartItems,
      totalItems,
      totalAmount
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

// Remove items from cart
app.delete('/api/cart/items', async (req, res) => {
  try {
    const { competitionId, ticketNumbers } = req.body;
    
    if (!competitionId) {
      return res.status(400).json({ message: "Competition ID is required" });
    }
    
    // Generate cart ID based on auth status
    const cartId = req.isAuthenticated() ? `user_${req.user.id}` : `anon_${req.sessionID}`;
    
    if (Array.isArray(ticketNumbers) && ticketNumbers.length > 0) {
      // Remove specific ticket numbers
      await db.query(`
        DELETE FROM cart_items 
        WHERE cart_id = $1 AND competition_id = $2 AND ticket_number = ANY($3::int[])
      `, [cartId, competitionId, ticketNumbers]);
    } else {
      // Remove all tickets for this competition
      await db.query(`
        DELETE FROM cart_items 
        WHERE cart_id = $1 AND competition_id = $2
      `, [cartId, competitionId]);
    }
    
    res.json({ message: "Items removed from cart" });
  } catch (error) {
    console.error('Error removing items from cart:', error);
    res.status(500).json({ message: "Error removing items from cart" });
  }
});

// Process payment with Stripe
app.post('/api/checkout', isAuthenticated, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    // Generate cart ID
    const cartId = `user_${req.user.id}`;
    
    // Get all active items in the cart
    const cartQuery = `
      SELECT ci.competition_id, ci.ticket_number, c.title, c.ticket_price
      FROM cart_items ci
      JOIN competitions c ON ci.competition_id = c.id
      WHERE ci.cart_id = $1 AND ci.created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY ci.created_at DESC
    `;
    
    const cartResult = await db.query(cartQuery, [cartId]);
    
    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    
    // Group by competition for display
    const cartByCompetition = {};
    let totalAmount = 0;
    
    cartResult.rows.forEach(item => {
      if (!cartByCompetition[item.competition_id]) {
        cartByCompetition[item.competition_id] = {
          id: item.competition_id,
          title: item.title,
          ticketPrice: item.ticket_price,
          tickets: []
        };
      }
      
      cartByCompetition[item.competition_id].tickets.push(item.ticket_number);
      totalAmount += item.ticket_price;
    });
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // convert to cents
      currency: 'gbp',
      metadata: {
        userId: req.user.id,
        cartId: cartId,
        cartItemCount: cartResult.rows.length
      }
    });
    
    // Store payment intent details with cart items
    for (const item of cartResult.rows) {
      await db.query(`
        UPDATE cart_items 
        SET payment_intent_id = $1, payment_status = 'pending' 
        WHERE cart_id = $2 AND competition_id = $3 AND ticket_number = $4
      `, [paymentIntent.id, cartId, item.competition_id, item.ticket_number]);
    }
    
    // Return client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      cartItems: Object.values(cartByCompetition)
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: "Error processing payment" });
  }
});

// Webhook for Stripe payment confirmation
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  
  try {
    // Verify the signature
    const signature = req.headers['stripe-signature'];
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      // Fallback for testing when signature verification is not available
      event = req.body;
    } else {
      // Parse and verify the webhook
      event = stripe.webhooks.constructEvent(
        req.body, 
        signature, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Get cart items associated with this payment
      const cartItems = await db.query(`
        SELECT cart_id, competition_id, ticket_number
        FROM cart_items
        WHERE payment_intent_id = $1 AND payment_status = 'pending'
      `, [paymentIntent.id]);
      
      // Update all items to purchased
      for (const item of cartItems.rows) {
        // Insert into purchased_tickets
        await db.query(`
          INSERT INTO purchased_tickets 
          (user_id, competition_id, ticket_number, payment_intent_id, purchase_date)
          VALUES ($1, $2, $3, $4, NOW())
        `, [
          paymentIntent.metadata.userId,
          item.competition_id,
          item.ticket_number,
          paymentIntent.id
        ]);
        
        // Update competition ticket count
        await db.query(`
          UPDATE competitions
          SET tickets_sold = COALESCE(tickets_sold, 0) + 1
          WHERE id = $1
        `, [item.competition_id]);
        
        // Remove from cart_items
        await db.query(`
          DELETE FROM cart_items
          WHERE cart_id = $1 AND competition_id = $2 AND ticket_number = $3
        `, [item.cart_id, item.competition_id, item.ticket_number]);
      }
      
      console.log(`✅ Payment succeeded: ${paymentIntent.id} - ${cartItems.rows.length} tickets purchased`);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      // Update cart items to remove payment_intent_id
      await db.query(`
        UPDATE cart_items
        SET payment_intent_id = NULL, payment_status = NULL
        WHERE payment_intent_id = $1
      `, [paymentIntent.id]);
      
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ message: "Webhook Error", error: error.message });
  }
});

// Get purchased tickets for the current user
app.get('/api/my-tickets', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const ticketsQuery = `
      SELECT 
        pt.competition_id, 
        pt.ticket_number,
        pt.payment_intent_id,
        pt.purchase_date,
        c.title,
        c.description,
        c.image_url,
        c.prize_value,
        c.status,
        c.draw_date
      FROM purchased_tickets pt
      JOIN competitions c ON pt.competition_id = c.id
      WHERE pt.user_id = $1
      ORDER BY pt.purchase_date DESC
    `;
    
    const result = await db.query(ticketsQuery, [userId]);
    
    // Group by competition
    const ticketsByCompetition = {};
    
    result.rows.forEach(ticket => {
      if (!ticketsByCompetition[ticket.competition_id]) {
        ticketsByCompetition[ticket.competition_id] = {
          id: ticket.competition_id,
          title: ticket.title,
          description: ticket.description,
          imageUrl: ticket.image_url,
          prizeValue: ticket.prize_value,
          status: ticket.status,
          drawDate: ticket.draw_date,
          tickets: []
        };
      }
      
      ticketsByCompetition[ticket.competition_id].tickets.push({
        number: ticket.ticket_number,
        purchaseDate: ticket.purchase_date,
        paymentIntentId: ticket.payment_intent_id
      });
    });
    
    res.json(Object.values(ticketsByCompetition));
  } catch (error) {
    console.error('Error fetching purchased tickets:', error);
    res.status(500).json({ message: "Error fetching purchased tickets" });
  }
});

// Admin endpoint to lookup a winner for a competition
app.get('/api/admin/competitions/:competitionId/winner', isAdmin, async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Check if the competition exists
    const compResult = await db.query('SELECT * FROM competitions WHERE id = $1', [competitionId]);
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    const competition = compResult.rows[0];
    
    // Get all purchased tickets for this competition
    const ticketsQuery = `
      SELECT 
        pt.ticket_number,
        pt.user_id,
        pt.purchase_date,
        u.username,
        u.email
      FROM purchased_tickets pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.competition_id = $1
      ORDER BY pt.ticket_number
    `;
    
    const result = await db.query(ticketsQuery, [competitionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tickets have been purchased for this competition" });
    }
    
    // Return the competition and ticket details
    res.json({
      competition,
      tickets: result.rows,
      totalTickets: competition.total_tickets,
      ticketsSold: result.rows.length,
      percentageSold: Math.round((result.rows.length / Number(competition.total_tickets)) * 100)
    });
  } catch (error) {
    console.error('Error looking up winner:', error);
    res.status(500).json({ message: "Error looking up winner" });
  }
});

// Admin endpoint to lookup a specific ticket
app.get('/api/admin/competitions/:competitionId/ticket/:ticketNumber', isAdmin, async (req, res) => {
  try {
    const { competitionId, ticketNumber } = req.params;
    
    // Check if the competition exists
    const compResult = await db.query('SELECT * FROM competitions WHERE id = $1', [competitionId]);
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Check if the ticket is purchased
    const ticketQuery = `
      SELECT 
        pt.ticket_number,
        pt.user_id,
        pt.purchase_date,
        pt.payment_intent_id,
        u.username,
        u.email
      FROM purchased_tickets pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.competition_id = $1 AND pt.ticket_number = $2
    `;
    
    const result = await db.query(ticketQuery, [competitionId, ticketNumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found or not purchased" });
    }
    
    // Return the ticket details
    res.json({
      competition: compResult.rows[0],
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error looking up ticket:', error);
    res.status(500).json({ message: "Error looking up ticket" });
  }
});

// Global winner lookup across all competitions
app.get('/api/admin/global-winner-lookup/:ticketNumber', isAdmin, async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    // Find all competitions where this ticket number was purchased
    const ticketQuery = `
      SELECT 
        pt.competition_id,
        pt.ticket_number,
        pt.user_id,
        pt.purchase_date,
        pt.payment_intent_id,
        u.username,
        u.email,
        c.title,
        c.status,
        c.draw_date
      FROM purchased_tickets pt
      JOIN users u ON pt.user_id = u.id
      JOIN competitions c ON pt.competition_id = c.id
      WHERE pt.ticket_number = $1
      ORDER BY pt.purchase_date DESC
    `;
    
    const result = await db.query(ticketQuery, [ticketNumber]);
    
    if (result.rows.length === 0) {
      return res.json({ found: false, message: "Ticket not found in any competition" });
    }
    
    // Return all matches
    res.json({
      found: true,
      matches: result.rows
    });
  } catch (error) {
    console.error('Error in global ticket lookup:', error);
    res.status(500).json({ message: "Error looking up ticket" });
  }
});

// Site configuration endpoints
// Get a site configuration value
app.get('/api/site-config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await db.query('SELECT * FROM site_config WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Configuration not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching site config (${req.params.key}):`, error);
    res.status(500).json({ message: "Error fetching site configuration" });
  }
});

// Set a site configuration value (admin only)
app.post('/api/admin/site-config', isAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ message: "Key and value are required" });
    }
    
    // Check if the key already exists
    const checkResult = await db.query('SELECT id FROM site_config WHERE key = $1', [key]);
    
    if (checkResult.rows.length > 0) {
      // Update existing value
      const result = await db.query(
        'UPDATE site_config SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
        [value, key]
      );
      
      return res.json(result.rows[0]);
    } else {
      // Insert new value
      const result = await db.query(
        'INSERT INTO site_config (key, value) VALUES ($1, $2) RETURNING *',
        [key, value]
      );
      
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error setting site configuration:', error);
    res.status(500).json({ message: "Error setting site configuration" });
  }
});

// Serve static files from the 'dist' directory
// This will serve the SPA's built files
app.use(express.static(path.join(projectRoot, 'dist')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

// For all other requests, serve the index.html file
// This enables client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});