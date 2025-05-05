// Server startup script for Docker deployment
// This runs inside the Docker container using CommonJS

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');

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

console.log('Allowed CORS origins:', allowedOrigins);
console.log('Environment:', process.env.NODE_ENV);

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.replit.dev') || origin.endsWith('.onrender.com')) {
      console.log(`Origin ${origin} is allowed by CORS`);
      return callback(null, true);
    }
    
    console.log(`Origin ${origin} is NOT allowed by CORS`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Add security headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Add some debugging information about the session
  if (req.session) {
    console.log('🔍 Request to ' + req.method + ' ' + req.originalUrl, {
      hasSession: true,
      sessionID: req.sessionID || 'no-session-id',
      hasSessionData: !!req.session.passport
    });
  } else {
    console.log('🔍 Request to ' + req.method + ' ' + req.originalUrl, {
      hasSession: false,
      sessionID: 'no-session-id',
      hasSessionData: false
    });
  }
  
  next();
});

// We'll set up the session later with the PgSessionStore

// Parse JSON requests
app.use(express.json());

// For multipart form data (file uploads)
const multer = require('multer');

// Configure multer for memory storage
const multerStorage = multer.memoryStorage();

// File filter function for uploads
const fileFilter = (req, file, cb) => {
  console.log('Multer fileFilter called with file:', { 
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
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

// Configure multer
const upload = multer({ 
  storage: multerStorage, 
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter
});

// Setup Cloudinary if credentials are available
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let cloudinary;
  
// Initialize Cloudinary if configured
if (isCloudinaryConfigured) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('Cloudinary configured for image uploads');
} else {
  console.log('Cloudinary not configured, using local storage for uploads');
}

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Connect to PostgreSQL for data
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Check database connection
const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        prize_value DECIMAL(10,2) NOT NULL,
        ticket_price DECIMAL(10,2) NOT NULL,
        max_tickets_per_user INTEGER NOT NULL,
        total_tickets INTEGER NOT NULL,
        tickets_sold INTEGER NOT NULL DEFAULT 0,
        brand VARCHAR(100),
        draw_date TIMESTAMP NOT NULL,
        is_live BOOLEAN NOT NULL DEFAULT TRUE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        push_to_hero_banner BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        competition_id INTEGER NOT NULL REFERENCES competitions(id),
        ticket_count INTEGER NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        stripe_payment_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Check if we have competitions, if not seed with some
    const { rows } = await client.query('SELECT COUNT(*) FROM competitions');
    if (parseInt(rows[0].count) === 0) {
      console.log('Seeding competitions table...');
      await client.query(`
        INSERT INTO competitions 
          (title, description, image_url, category, prize_value, ticket_price, max_tickets_per_user, total_tickets, tickets_sold, brand, draw_date, is_live, is_featured) 
        VALUES 
          ('Ninja Air Fryer', 'Win this amazing kitchen gadget!', '/images/air-fryer.jpg', 'Kitchen', 199.99, 2.99, 20, 1000, 450, 'Ninja', NOW() + INTERVAL '7 days', TRUE, TRUE),
          ('PlayStation 5', 'The latest gaming console from Sony with two controllers', '/images/ps5.jpg', 'Gaming', 599.99, 4.99, 15, 2000, 1200, 'Sony', NOW() + INTERVAL '14 days', TRUE, TRUE),
          ('Apple MacBook Pro', 'The powerful new MacBook Pro with M2 chip', '/images/macbook.jpg', 'Electronics', 1299.99, 9.99, 10, 1500, 750, 'Apple', NOW() + INTERVAL '21 days', TRUE, TRUE),
          ('Weekend in Paris', 'Romantic weekend for two in Paris with flights and hotel included', '/images/paris.jpg', 'Travel', 999.99, 5.99, 25, 2500, 1500, 'EuroTravel', NOW() + INTERVAL '30 days', TRUE, FALSE),
          ('£1000 Cash Prize', 'Win £1000 in cash to spend however you like!', '/images/cash.jpg', 'Cash', 1000.00, 1.99, 50, 5000, 2500, null, NOW() + INTERVAL '10 days', TRUE, TRUE)
      `);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Initialize the database
checkDbConnection().catch(console.error);

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.get('/api/competitions', async (req, res) => {
  try {
    // Get optional query parameters
    const { category, limit = 100, offset = 0, is_live, is_featured, sort_by = 'newest' } = req.query;
    
    // Build the query
    let query = 'SELECT * FROM competitions WHERE 1=1';
    const params = [];
    
    // Add filters
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    if (is_live !== undefined) {
      params.push(is_live === 'true');
      query += ` AND is_live = $${params.length}`;
    }
    
    if (is_featured !== undefined) {
      params.push(is_featured === 'true');
      query += ` AND is_featured = $${params.length}`;
    }
    
    // Add sorting
    if (sort_by === 'endingSoon') {
      query += ' ORDER BY draw_date ASC';
    } else if (sort_by === 'popular') {
      query += ' ORDER BY tickets_sold DESC';
    } else { // newest
      query += ' ORDER BY created_at DESC';
    }
    
    // Add pagination
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;
    
    // Execute the query
    const { rows } = await pool.query(query, params);
    
    // Transform the data to match our API format
    const competitions = rows.map(comp => ({
      id: comp.id,
      title: comp.title,
      description: comp.description,
      imageUrl: comp.image_url,
      category: comp.category,
      prizeValue: parseFloat(comp.prize_value),
      ticketPrice: parseFloat(comp.ticket_price),
      maxTicketsPerUser: comp.max_tickets_per_user,
      totalTickets: comp.total_tickets,
      ticketsSold: comp.tickets_sold,
      brand: comp.brand,
      drawDate: comp.draw_date.toISOString(),
      isLive: comp.is_live,
      isFeatured: comp.is_featured,
      createdAt: comp.created_at.toISOString()
      // Removed pushToHeroBanner field
    }));
    
    res.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get single competition by ID endpoint
app.get('/api/competitions/:id', async (req, res) => {
  try {
    // Add detailed logging for debugging
    const id = req.params.id;
    console.log(`🔍 Production GET competition request for ID: ${id}`);
    console.log(`📝 Request context:`, {
      id,
      userAgent: req.headers['user-agent'],
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      origin: req.headers.origin || 'no-origin',
      sessionID: req.sessionID || 'no-session'
    });
    
    const result = await pool.query(
      `SELECT * FROM competitions WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Competition not found: ID=${id}`);
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Transform the data to match our API format (same as in the list endpoint)
    const comp = result.rows[0];
    const competition = {
      id: comp.id,
      title: comp.title,
      description: comp.description,
      imageUrl: comp.image_url,
      category: comp.category,
      prizeValue: parseFloat(comp.prize_value),
      ticketPrice: parseFloat(comp.ticket_price),
      totalTickets: parseInt(comp.total_tickets),
      ticketsSold: parseInt(comp.tickets_sold || 0),
      maxTicketsPerUser: parseInt(comp.max_tickets_per_user),
      brand: comp.brand,
      drawDate: comp.draw_date.toISOString(),
      isLive: comp.is_live,
      isFeatured: comp.is_featured,
      createdAt: comp.created_at.toISOString()
      // Removed pushToHeroBanner field
    };
    
    console.log(`✅ Successfully retrieved competition: ID=${id}, Title="${comp.title}"`);
    res.json(competition);
  } catch (err) {
    console.error(`❌ Error fetching competition ${req.params.id}:`, err);
    res.status(500).json({ 
      message: 'Failed to fetch competition details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Authentication and user APIs
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const connectPgSimple = require('connect-pg-simple');

// Configure session store
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool,
  tableName: 'session', // Use the default table name
  createTableIfMissing: true
});

// Update session configuration
const isProduction = process.env.NODE_ENV === 'production';
const isRender = !!process.env.RENDER_SERVICE_ID;

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret',
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
    
    // Special handling for admin users - check environment variables first
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (username === adminUsername && adminPassword && password === adminPassword) {
      console.log('✅ Admin authenticated via environment variables');
      
      // Check what columns exist in the users table
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        AND column_name IN ('is_banned', 'stripe_customer_id');
      `;
      
      const columnsCheck = await pool.query(columnsQuery);
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      
      const isBannedColumnExists = existingColumns.includes('is_banned');
      const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
      
      // Get the admin user from database
      const { rows } = await pool.query(`
        SELECT id, username, email, password, display_name as "displayName", 
          mascot, is_admin as "isAdmin", notification_settings as "notificationSettings", 
          created_at as "createdAt"
          ${isBannedColumnExists ? ', is_banned as "isBanned"' : ''}
          ${stripeCustomerIdColumnExists ? ', stripe_customer_id as "stripeCustomerId"' : ''}
        FROM users WHERE username = $1 AND is_admin = TRUE
        LIMIT 1
      `, [username]);
      
      if (rows.length > 0) {
        // Admin exists in database, use that record
        let user = rows[0];
        
        // Set default values for missing columns
        if (!isBannedColumnExists || user.isBanned === undefined) {
          user.isBanned = false;
        }
        
        if (!stripeCustomerIdColumnExists || user.stripeCustomerId === undefined) {
          user.stripeCustomerId = null;
        }
        
        return done(null, user);
      } else {
        // If admin doesn't exist in database or password is changed, fallback to minimal profile
        console.log('⚠️ Using admin environment credentials directly (admin not in DB or password changed)');
        const adminUser = {
          id: 1,  // Use ID 1 for consistency
          username: adminUsername,
          email: 'admin@mobycomps.co.uk',
          displayName: 'Administrator',
          mascot: 'whale',
          isAdmin: true,
          isBanned: false,
          stripeCustomerId: null,
          notificationSettings: { email: true, inApp: true },
          createdAt: new Date()
        };
        return done(null, adminUser);
      }
    }
    
    // Continue with standard authentication for non-admin users
    // Check what columns exist in the users table
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('is_banned', 'stripe_customer_id');
    `;
    
    const columnsCheck = await pool.query(columnsQuery);
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    const isBannedColumnExists = existingColumns.includes('is_banned');
    const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
    
    console.log('Database columns check for login:', {
      isBannedExists: isBannedColumnExists,
      stripeCustomerIdExists: stripeCustomerIdColumnExists
    });
    
    // If columns don't exist, create them
    if (!isBannedColumnExists) {
      console.log('Adding missing is_banned column to users table');
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE
      `);
    }
    
    if (!stripeCustomerIdColumnExists) {
      console.log('Adding missing stripe_customer_id column to users table');
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)
      `);
    }
    
    // Build a query based on what columns exist
    let selectFields = [
      'id', 'username', 'email', 'password', 'display_name as "displayName"', 
      'mascot', 'is_admin as "isAdmin"', 
      'notification_settings as "notificationSettings"', 'created_at as "createdAt"'
    ];
    
    if (isBannedColumnExists) {
      selectFields.push('is_banned as "isBanned"');
    }
    
    if (stripeCustomerIdColumnExists) {
      selectFields.push('stripe_customer_id as "stripeCustomerId"');
    }
    
    // Query the database for the user with properly named fields
    const { rows } = await pool.query(`
      SELECT ${selectFields.join(', ')}
      FROM users WHERE username = $1
    `, [username]);
    
    const user = rows[0];
    if (!user) {
      console.log(`❌ Authentication failed: User ${username} not found`);
      return done(null, false, { message: "Invalid username or password" });
    }
    
    // Set default values for missing columns
    if (!isBannedColumnExists || user.isBanned === undefined) {
      user.isBanned = false;
    }
    
    if (!stripeCustomerIdColumnExists || user.stripeCustomerId === undefined) {
      user.stripeCustomerId = null;
    }
    
    // Check if user is banned
    if (user.isBanned) {
      console.log(`❌ Authentication failed: User ${username} is banned`);
      return done(null, false, { message: "Your account has been banned. Please contact support." });
    }
    
    // Compare passwords
    const passwordValid = await comparePasswords(password, user.password);
    if (!passwordValid) {
      console.log(`❌ Authentication failed: Invalid password for ${username}`);
      return done(null, false, { message: "Invalid username or password" });
    }
    
    console.log(`✅ Authentication successful for ${username} (isAdmin: ${user.isAdmin})`);
    return done(null, user);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Check what columns exist in the users table
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('is_banned', 'stripe_customer_id');
    `;
    
    const columnsCheck = await pool.query(columnsQuery);
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    const isBannedColumnExists = existingColumns.includes('is_banned');
    const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
    
    console.log('Database columns check:', {
      isBannedExists: isBannedColumnExists,
      stripeCustomerIdExists: stripeCustomerIdColumnExists
    });
    
    // Build a query based on what columns exist
    let selectFields = [
      'id', 'username', 'email', 'display_name as "displayName"', 
      'mascot', 'is_admin as "isAdmin"', 
      'notification_settings as "notificationSettings"', 'created_at as "createdAt"',
      'password'
    ];
    
    if (isBannedColumnExists) {
      selectFields.push('is_banned as "isBanned"');
    }
    
    if (stripeCustomerIdColumnExists) {
      selectFields.push('stripe_customer_id as "stripeCustomerId"');
    }
    
    const query = `
      SELECT ${selectFields.join(', ')}
      FROM users WHERE id = $1
    `;
    
    console.log('Using customized select query for user');
    
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return done(null, false);
    }
    
    const user = rows[0];
    
    // Add missing fields with default values
    if (!isBannedColumnExists) {
      user.isBanned = false;
    }
    
    if (!stripeCustomerIdColumnExists) {
      user.stripeCustomerId = null;
    }
    
    console.log('✅ User deserialized successfully:', { 
      id: user.id, 
      username: user.username, 
      isAdmin: user.isAdmin,
      stripeCustomerId: user.stripeCustomerId ? 'exists' : 'null'
    });
    
    done(null, user);
  } catch (error) {
    console.error('❌ Error deserializing user:', error);
    done(error);
  }
});

// Create users table if it doesn't exist
async function ensureUsersTable() {
  try {
    const client = await pool.connect();
    
    // Check if users table exists, create if it doesn't
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        mascot VARCHAR(100),
        notification_settings JSONB DEFAULT '{}',
        is_admin BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Check if we have an admin user, create if we don't
    const { rows } = await client.query(
      'SELECT COUNT(*) FROM users WHERE is_admin = TRUE'
    );
    
    if (parseInt(rows[0].count) === 0) {
      console.log('Creating admin user...');
      
      // Determine the password to use
      let adminPassword = 'Admin123!'; // Default fallback
      
      // Check if there's an environment variable with the admin password
      if (process.env.ADMIN_PASSWORD) {
        console.log('Using admin password from ADMIN_PASSWORD environment variable');
        adminPassword = process.env.ADMIN_PASSWORD;
      } else if (process.env.ADMIN_PASSWORD_HASH) {
        console.log('Using pre-hashed admin password from ADMIN_PASSWORD_HASH environment variable');
        // We'll insert this directly since it's already hashed
        await client.query(`
          INSERT INTO users (
            username, email, password, display_name, 
            mascot, is_admin
          ) VALUES (
            'admin', 'admin@bluewhalecompetitions.com', $1, 
            'Admin', 'whale', TRUE
          )
        `, [process.env.ADMIN_PASSWORD_HASH]);
        
        console.log('Admin user created with pre-hashed password');
        return; // Skip the password hashing below
      } else {
        console.log('Using default admin password (not secure for production)');
      }
      
      // Hash the password and create the user
      const hashedPassword = await hashPassword(adminPassword);
      await client.query(`
        INSERT INTO users (
          username, email, password, display_name, 
          mascot, is_admin
        ) VALUES (
          'admin', 'admin@bluewhalecompetitions.com', $1, 
          'Admin', 'whale', TRUE
        )
      `, [hashedPassword]);
      
      console.log('Admin user created with hashed password');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error setting up users table:', error);
    return false;
  }
}

// Initialize users table
ensureUsersTable().catch(console.error);

// Admin competition deletion endpoint
// Admin competition update endpoint (PATCH)
app.patch('/api/admin/competitions/:id', async (req, res) => {
  try {
    // Check admin authentication
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      console.log('❌ Unauthorized update attempt');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    console.log(`✏️ Admin update request for competition ID: ${id}`);
    console.log('📝 Update data:', req.body);
    
    // Validate that the competition exists
    const checkResult = await pool.query(
      `SELECT id FROM competitions WHERE id = $1`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ Competition not found for update: ID=${id}`);
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Build the SET clause for the SQL UPDATE statement
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Map from API field names to database column names
    const fieldMapping = {
      title: 'title',
      description: 'description',
      imageUrl: 'image_url',
      category: 'category',
      prizeValue: 'prize_value',
      ticketPrice: 'ticket_price',
      maxTicketsPerUser: 'max_tickets_per_user',
      totalTickets: 'total_tickets',
      drawDate: 'draw_date',
      isLive: 'is_live',
      isFeatured: 'is_featured',
      brand: 'brand'
      // Removed pushToHeroBanner field
    };
    
    // For each field in the request body, add it to the update if it exists
    Object.keys(fieldMapping).forEach(apiField => {
      if (req.body[apiField] !== undefined) {
        updateFields.push(`${fieldMapping[apiField]} = $${valueIndex}`);
        values.push(req.body[apiField]);
        valueIndex++;
      }
    });
    
    // If no fields were provided, return an error
    if (updateFields.length === 0) {
      console.log('❌ No valid fields provided for update');
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }
    
    // Add the competition ID as the last parameter
    values.push(id);
    
    // Build and execute the update query
    const updateQuery = `
      UPDATE competitions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    console.log('🔄 Executing update query:', updateQuery);
    console.log('🔢 Update values:', values);
    
    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      console.log(`❌ Update failed for competition: ID=${id}`);
      return res.status(500).json({ message: 'Update failed' });
    }
    
    // Transform the response to match API format
    const comp = result.rows[0];
    const updatedCompetition = {
      id: comp.id,
      title: comp.title,
      description: comp.description,
      imageUrl: comp.image_url,
      category: comp.category,
      prizeValue: comp.prize_value,
      ticketPrice: comp.ticket_price,
      maxTicketsPerUser: comp.max_tickets_per_user,
      totalTickets: comp.total_tickets,
      ticketsSold: comp.tickets_sold || 0,
      drawDate: comp.draw_date,
      isLive: comp.is_live,
      isFeatured: comp.is_featured,
      brand: comp.brand,
      createdAt: comp.created_at
      // Removed pushToHeroBanner field
    };
    
    console.log(`✅ Competition updated successfully: ID=${id}, Title="${updatedCompetition.title}"`);
    res.status(200).json(updatedCompetition);
  } catch (error) {
    console.error('❌ Error updating competition:', error);
    res.status(500).json({ message: 'Error updating competition', error: error.message });
  }
});

app.delete('/api/admin/competitions/:id', async (req, res) => {
  try {
    // Check admin authentication
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      console.log('❌ Unauthorized delete attempt');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    console.log(`🗑️ Admin delete request for competition ID: ${id}`);
    
    // Check which tables exist in the database
    console.log('🔍 Checking database schema...');
    const tablesQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('competitions', 'entries', 'winners');
    `;
    
    const { rows: tables } = await pool.query(tablesQuery);
    const tableNames = tables.map(t => t.tablename);
    
    console.log('📋 Available tables:', tableNames);
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // Only attempt to delete from tables that exist
      if (tableNames.includes('entries')) {
        console.log(`🗑️ Deleting entries for competition ID: ${id}`);
        await pool.query('DELETE FROM entries WHERE competition_id = $1', [id]);
      }
      
      if (tableNames.includes('winners')) {
        console.log(`🗑️ Deleting winners for competition ID: ${id}`);
        await pool.query('DELETE FROM winners WHERE competition_id = $1', [id]);
      }
      
      if (tableNames.includes('competitions')) {
        console.log(`🗑️ Deleting competition ID: ${id}`);
        const result = await pool.query('DELETE FROM competitions WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
          // Competition not found, but we'll commit the transaction anyway to clean any related data
          await pool.query('COMMIT');
          console.log(`❌ Competition ID ${id} not found for deletion`);
          return res.status(404).json({ message: 'Competition not found' });
        }
      } else {
        // If competitions table doesn't exist, there's nothing to delete
        await pool.query('COMMIT');
        console.log('⚠️ No competitions table found in database');
        return res.status(404).json({ message: 'Competitions table not found in database' });
      }
      
      // Commit the transaction if we get here
      await pool.query('COMMIT');
      console.log(`✅ Successfully deleted competition ID: ${id}`);
      return res.status(200).json({ success: true, message: 'Competition deleted successfully' });
    } catch (err) {
      // Rollback the transaction if anything fails
      console.error('❌ Error during deletion transaction:', err);
      await pool.query('ROLLBACK');
      
      // Try a direct approach just for competitions table
      try {
        if (tableNames.includes('competitions')) {
          console.log(`🔄 Attempting direct competition deletion for ID: ${id}`);
          await pool.query('DELETE FROM competitions WHERE id = $1', [id]);
          console.log(`✅ Direct deletion successful for competition ID: ${id}`);
          return res.status(200).json({ 
            success: true, 
            message: 'Competition deleted using direct method' 
          });
        }
      } catch (directErr) {
        console.error('❌ Direct deletion also failed:', directErr);
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete competition', 
        error: err.message 
      });
    }
  } catch (err) {
    console.error('❌ Critical error deleting competition:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete competition due to a server error', 
      error: err.message 
    });
  }
});

// Admin - Create new competition
app.post('/api/admin/competitions', async (req, res) => {
  try {
    // Check admin authentication
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      console.log('❌ Unauthorized competition creation attempt');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('📝 Attempting to create competition:', req.body);
    
    // Check if competitions table exists
    try {
      console.log('🔍 Checking database schema...');
      const tablesQuery = `
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'competitions';
      `;
      
      const { rows: tables } = await pool.query(tablesQuery);
      
      if (tables.length === 0) {
        console.error('❌ Competitions table does not exist');
        return res.status(500).json({ 
          message: 'Unable to create competition - database schema issue'
        });
      }
      
      // Validate required fields
      const { 
        title, description, imageUrl, ticketPrice, 
        totalTickets, maxTicketsPerUser, prizeValue,
        drawDate, category
      } = req.body;
      
      console.log('📋 Validating incoming data:', { 
        title, description, imageUrl, ticketPrice, 
        totalTickets, maxTicketsPerUser, prizeValue,
        drawDate, category
      });
      
      // Special handling for imageUrl - allow empty string to be replaced with a default image
      const processedImageUrl = !imageUrl || imageUrl === '' 
        ? 'https://bluewhalecompetitions.co.uk/assets/default-competition-image.jpg' 
        : imageUrl;
      
      if (!title || !description || !ticketPrice || !totalTickets || !drawDate || !category) {
        const missingFields = [];
        if (!title) missingFields.push('title');
        if (!description) missingFields.push('description');
        if (!ticketPrice) missingFields.push('ticketPrice');
        if (!totalTickets) missingFields.push('totalTickets');
        if (!drawDate) missingFields.push('drawDate');
        if (!category) missingFields.push('category');
        
        console.error('❌ Missing required fields:', missingFields);
        
        return res.status(400).json({ 
          message: 'Missing required fields',
          missingFields 
        });
      }
      
      // Create new competition with transaction
      await pool.query('BEGIN');
      
      // Check competition table schema to determine available columns
      console.log('🔍 Checking competition table schema for column structure...');
      const schemaQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'competitions'
        AND table_schema = 'public'
      `;
      
      const { rows: columns } = await pool.query(schemaQuery);
      const columnNames = columns.map(col => col.column_name);
      console.log('📋 Available columns in competitions table:', columnNames);
      
      // Determine if start_date and end_date columns exist
      const hasStartDate = columnNames.includes('start_date');
      const hasEndDate = columnNames.includes('end_date');
      
      // Build query dynamically based on available columns
      let insertColumns = [
        'title', 'description', 'image_url', 'ticket_price', 
        'total_tickets', 'max_tickets_per_user', 'prize_value',
        'category', 'brand', 'is_live', 'is_featured', 'draw_date'
      ];
      
      // Add optional columns if they exist
      if (hasStartDate) insertColumns.push('start_date');
      if (hasEndDate) insertColumns.push('end_date');
      
      // Build placeholder string ($1, $2, etc) based on number of columns
      const placeholders = insertColumns.map((_, idx) => `$${idx + 1}`).join(', ');
      
      // Build returning clause based on available columns
      let returningClauses = [
        'id', 'title', 'description', 'image_url as "imageUrl"', 
        'ticket_price as "ticketPrice"', 'total_tickets as "totalTickets"', 
        'max_tickets_per_user as "maxTicketsPerUser"', 'prize_value as "prizeValue"',
        'category', 'brand', 'is_live as "isLive"', 'is_featured as "isFeatured"',
        'draw_date as "drawDate"'
      ];
      
      // Add timestamps if they exist
      if (columnNames.includes('created_at')) returningClauses.push('created_at as "createdAt"');
      if (columnNames.includes('updated_at')) returningClauses.push('updated_at as "updatedAt"');
      
      // Add optional date columns if they exist
      if (hasStartDate) returningClauses.push('start_date as "startDate"');
      if (hasEndDate) returningClauses.push('end_date as "endDate"');
      
      const insertQuery = `
        INSERT INTO competitions (
          ${insertColumns.join(', ')}
        ) VALUES (
          ${placeholders}
        ) RETURNING 
          ${returningClauses.join(', ')}
      `;
      
      // Prepare values for dynamic columns
      const startDate = req.body.startDate || new Date();
      const endDate = req.body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Build values array based on columns
      let values = [
        title,
        description,
        processedImageUrl, // Use the processed URL that handles empty strings
        ticketPrice,
        totalTickets,
        maxTicketsPerUser || 10,
        prizeValue || 0,
        req.body.category || 'Other',
        req.body.brand || '',
        req.body.isLive || false,
        req.body.isFeatured || false,
        drawDate // Draw date is required
      ];
      
      // Add optional date columns if they exist in the schema
      if (hasStartDate) values.push(startDate);
      if (hasEndDate) values.push(endDate);
      
      console.log('📊 SQL insert parameters:', { 
        columnCount: insertColumns.length,
        valueCount: values.length,
        columns: insertColumns
      });
      
      const result = await pool.query(insertQuery, values);
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      const newCompetition = result.rows[0];
      console.log('✅ Competition created successfully:', { id: newCompetition.id, title: newCompetition.title });
      
      return res.status(201).json(newCompetition);
    } catch (error) {
      console.error('❌ Error checking schema or creating competition:', error);
      
      // Rollback any transaction in progress
      try {
        await pool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError);
      }
      
      return res.status(500).json({ 
        message: 'Failed to create competition',
        error: error.message
      });
    }
  } catch (err) {
    console.error('❌ Critical error creating competition:', err);
    return res.status(500).json({ 
      message: 'A server error occurred while creating the competition',
      error: err.message
    });
  }
});

// Reset competitions endpoint for admin
app.post('/api/admin/reset-competitions', async (req, res) => {
  try {
    // Check admin authentication
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      console.log('❌ Unauthorized reset attempt');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('🧹 Starting competition reset process...');
    
    // Check which tables exist in the database
    try {
      console.log('🔍 Checking database schema...');
      const tablesQuery = `
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('competitions', 'entries', 'winners');
      `;
      
      const { rows: tables } = await pool.query(tablesQuery);
      const tableNames = tables.map(t => t.tablename);
      
      console.log('📋 Available tables:', tableNames);
      
      // Only delete from competitions table if it exists
      if (tableNames.includes('competitions')) {
        console.log('🔄 Deleting from competitions table');
        
        // Start a transaction
        await pool.query('BEGIN');
        
        // Delete from entries if it exists
        if (tableNames.includes('entries')) {
          console.log('🗑️ Deleting entries...');
          await pool.query('DELETE FROM entries');
          console.log('✓ Entries deleted');
        }
        
        // Delete from winners if it exists
        if (tableNames.includes('winners')) {
          console.log('🗑️ Deleting winners...');
          await pool.query('DELETE FROM winners');
          console.log('✓ Winners deleted');
        }
        
        // Now safe to delete competitions
        console.log('🗑️ Deleting competitions...');
        await pool.query('DELETE FROM competitions');
        console.log('✓ Competitions deleted');
        
        // Reset sequences that might exist
        if (tableNames.includes('entries')) {
          await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
        }
        
        if (tableNames.includes('winners')) {
          await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1'); 
        }
        
        await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
        
        // Commit transaction
        await pool.query('COMMIT');
        console.log('✅ Reset completed successfully');
        
        return res.status(200).json({ 
          success: true, 
          message: 'All competitions have been successfully deleted.'
        });
      } 
      else {
        // Plan B: If no competitions table exists but the database is responding,
        // consider it a "success" since there's nothing to delete
        console.log('⚠️ No competitions table found in database');
        return res.status(200).json({ 
          success: true, 
          message: 'No competitions table found in database. Nothing to delete.'
        });
      }
    } catch (error) {
      console.error('❌ Error during database reset:', error);
      
      // Try an aggressive fallback - just delete from competitions if it exists
      try {
        console.log('🔄 Using fallback approach - direct DELETE');
        await pool.query('DELETE FROM competitions WHERE 1=1');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Competitions deleted using fallback approach.'
        });
      } catch (fallbackError) {
        console.error('❌ Fallback approach failed:', fallbackError);
        
        return res.status(500).json({ 
          success: false, 
          message: 'All reset approaches failed. Database might have a different schema than expected.'
        });
      }
    }
  } catch (outerError) {
    console.error('❌ Catastrophic error in reset process:', outerError);
    return res.status(500).json({ 
      success: false, 
      message: 'A severe error occurred during the reset process.',
      error: outerError.message
    });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request:', { 
      ...req.body, 
      password: req.body.password ? '[REDACTED]' : undefined 
    });
    
    // Validate required fields
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ 
        message: "Username, email, and password are required" 
      });
    }
    
    // Check if username already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [req.body.username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [req.body.email]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(req.body.password);
    
    // Insert new user
    const result = await pool.query(`
      INSERT INTO users (
        username, email, password, display_name,
        mascot, notification_settings, is_admin, is_banned
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE)
      RETURNING id, username, email, display_name as "displayName", mascot, 
        notification_settings as "notificationSettings", is_admin as "isAdmin", is_banned as "isBanned", created_at as "createdAt"
    `, [
      req.body.username,
      req.body.email,
      hashedPassword,
      req.body.displayName || req.body.username,
      req.body.mascot || 'whale',
      req.body.notificationSettings || '{}'
    ]);
    
    const newUser = result.rows[0];
    
    // Log the user in
    req.login(newUser, (err) => {
      if (err) {
        console.error('Login error after registration:', err);
        return res.status(500).json({ message: "Error logging in after registration" });
      }
      
      // Return user data (without password)
      return res.status(201).json(newUser);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint
app.post('/api/login', (req, res, next) => {
  console.log('Login attempt:', { username: req.body.username });
  
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('Authentication failed:', info?.message || 'Invalid credentials');
      return res.status(401).json({ 
        message: info?.message || "Invalid username or password" 
      });
    }
    
    // Make sure user has all required fields before logging in
    if (user.isBanned === undefined) {
      user.isBanned = false;
    }
    
    if (user.stripeCustomerId === undefined) {
      user.stripeCustomerId = null;
    }
    
    console.log('Authentication successful for user:', { 
      id: user.id, 
      username: user.username,
      fields: Object.keys(user)
    });
    
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Session creation error:', loginErr);
        return next(loginErr);
      }
      
      console.log('Login successful, session created');
      
      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  })(req, res, next);
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: "Error during logout" });
    }
    res.sendStatus(200);
  });
});

// Create payment intent endpoint
app.post("/api/create-payment-intent", async (req, res) => {
  console.log("💰 Payment intent request received");
  
  if (!req.isAuthenticated()) {
    console.log("❌ Unauthorized payment intent request");
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!stripe) {
    console.log("❌ Stripe is not configured");
    return res.status(500).json({ message: "Stripe is not configured" });
  }

  try {
    const { amount, cartItems } = req.body;
    
    console.log("💰 Payment intent request details:", { 
      amount, 
      cartItems,
      userId: req.user.id 
    });
    
    // Validate that amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      console.error(`❌ Invalid amount for payment: ${amount}`);
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    
    // Extract competition IDs from cart items
    let competitionId, ticketCount;
    if (cartItems && cartItems.length > 0) {
      // Use the first item for metadata (we'll store the full cart in a session)
      competitionId = cartItems[0].competitionId;
      ticketCount = cartItems[0].ticketCount;
      
      // Validate at least the first competition exists
      const competitionResult = await pool.query(
        'SELECT * FROM competitions WHERE id = $1',
        [competitionId]
      );
      
      if (competitionResult.rows.length === 0) {
        console.log(`❌ Competition ${competitionId} not found`);
        return res.status(404).json({ message: "Competition not found" });
      }
    } else {
      console.error('❌ No cart items provided');
      return res.status(400).json({ message: "No cart items provided" });
    }
    
    // Competition price is in GBP (pounds), but Stripe needs pence (integer)
    // Multiply by 100 to convert from pounds to pence
    const amountInPence = Math.round(amount * 100);
    
    console.log(`💰 Creating payment intent for £${amount} (${amountInPence} pence)`);
    
    try {
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPence, // Amount in pence (Stripe requires integer amount)
        currency: "gbp",
        metadata: {
          competitionId, // First competition ID (legacy support)
          ticketCount,   // First ticket count (legacy support)
          userId: req.user.id.toString(),
          cartItemsCount: cartItems.length.toString(),
          cartTotal: amount.toString()
        }
      });
      
      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (stripeError) {
      console.error("❌ Stripe API error creating payment intent:", stripeError);
      
      // Check for specific Stripe errors
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          message: "Payment system authentication error",
          details: "The payment system is experiencing authentication issues. Please contact support."
        });
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          message: "Invalid payment request",
          details: stripeError.message
        });
      } else {
        return res.status(500).json({ 
          message: "Payment processing error",
          details: stripeError.message || "There was a problem processing your payment."
        });
      }
    }
  } catch (error) {
    console.error("❌ General error creating payment intent:", error);
    res.status(500).json({ 
      message: "Server error processing payment",
      details: error.message 
    });
  }
});

// Create competition entry endpoint
app.post("/api/entries", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    // Check if we've received multiple entries (cart checkout) or a single entry
    const { competitionId, ticketCount, paymentStatus, stripePaymentId, cartItems } = req.body;
    
    // If we have cart items, process them as multiple entries
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      console.log('Processing multiple entries from cart:', cartItems.length);
      
      const entries = [];
      
      // Process each cart item as an entry
      for (const item of cartItems) {
        const itemCompId = item.competitionId;
        const itemTicketCount = item.ticketCount;
        
        // Validate the competition exists
        const competitionResult = await pool.query(
          'SELECT * FROM competitions WHERE id = $1',
          [itemCompId]
        );
        
        if (competitionResult.rows.length === 0) {
          console.error(`Competition ${itemCompId} not found for cart item`);
          continue; // Skip this item but continue processing others
        }
        
        // Insert the entry
        const result = await pool.query(`
          INSERT INTO entries (
            user_id, competition_id, ticket_count, payment_status, stripe_payment_id
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          req.user.id,
          itemCompId,
          itemTicketCount,
          paymentStatus,
          stripePaymentId || null
        ]);
        
        // Update the competition's tickets sold count
        await pool.query(`
          UPDATE competitions
          SET tickets_sold = tickets_sold + $1
          WHERE id = $2
        `, [itemTicketCount, itemCompId]);
        
        // Transform the entry data
        const entry = result.rows[0];
        entries.push({
          id: entry.id,
          userId: entry.user_id,
          competitionId: entry.competition_id,
          ticketCount: entry.ticket_count,
          paymentStatus: entry.payment_status,
          stripePaymentId: entry.stripe_payment_id,
          createdAt: entry.created_at.toISOString()
        });
      }
      
      console.log(`Successfully created ${entries.length} entries from cart`);
      res.status(201).json(entries);
      return;
    }
    
    // Legacy single entry code path
    // Validate required fields
    if (!competitionId || !ticketCount || !paymentStatus) {
      return res.status(400).json({ 
        message: "competitionId, ticketCount, and paymentStatus are required" 
      });
    }
    
    // Validate the competition exists
    const competitionResult = await pool.query(
      'SELECT * FROM competitions WHERE id = $1',
      [competitionId]
    );
    
    if (competitionResult.rows.length === 0) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Insert the entry
    const result = await pool.query(`
      INSERT INTO entries (
        user_id, competition_id, ticket_count, payment_status, stripe_payment_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      req.user.id,
      competitionId,
      ticketCount,
      paymentStatus,
      stripePaymentId || null
    ]);
    
    // Update the competition's tickets sold count
    await pool.query(`
      UPDATE competitions
      SET tickets_sold = tickets_sold + $1
      WHERE id = $2
    `, [ticketCount, competitionId]);
    
    // Transform the entry data
    const entry = result.rows[0];
    const entryResponse = {
      id: entry.id,
      userId: entry.user_id,
      competitionId: entry.competition_id,
      ticketCount: entry.ticket_count,
      paymentStatus: entry.payment_status,
      stripePaymentId: entry.stripe_payment_id,
      createdAt: entry.created_at.toISOString()
    };
    
    res.status(201).json(entryResponse);
  } catch (error) {
    console.error("Error creating entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get user entries endpoint
app.get("/api/entries", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const result = await pool.query(`
      SELECT e.*, c.title as competition_title, c.image_url
      FROM entries e
      JOIN competitions c ON e.competition_id = c.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `, [req.user.id]);
    
    // Transform the entries data
    const entries = result.rows.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      competitionId: entry.competition_id,
      competitionTitle: entry.competition_title,
      competitionImageUrl: entry.image_url,
      ticketCount: entry.ticket_count,
      paymentStatus: entry.payment_status,
      stripePaymentId: entry.stripe_payment_id,
      createdAt: entry.created_at.toISOString()
    }));
    
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: error.message });
  }
});

// Current user endpoint
app.get('/api/user', (req, res) => {
  console.log('🔒 Current user request received');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('❌ Unauthorized - user not authenticated');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('✅ User is authenticated:', { id: req.user.id, username: req.user.username });
  
  // Don't send the password back to the client
  const { password, ...userWithoutPassword } = req.user;
  
  // Make sure isAdmin is being properly sent to the client
  console.log('Sending user data to client:', { 
    id: userWithoutPassword.id, 
    username: userWithoutPassword.username, 
    isAdmin: userWithoutPassword.isAdmin 
  });
  
  res.json(userWithoutPassword);
});

// File upload endpoint
app.post('/api/upload', 
  // Authentication check
  (req, res, next) => {
    console.log('🔒 Upload auth check - isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
    if (req.isAuthenticated && req.isAuthenticated()) {
      next();
    } else {
      console.error('❌ Authentication failed for upload request');
      return res.status(401).json({ message: 'Unauthorized', details: 'Authentication required' });
    }
  },
  // Multer file handler
  (req, res, next) => {
    console.log('📁 Starting multer file processing');
    
    // Use multer single file upload with proper error handling
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
  // Process the uploaded file
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
        allConfigured: isCloudinaryConfigured
      };
      
      console.log('Cloudinary configuration status:', cloudinaryStatus);
      
      // Now upload the file using appropriate service
      let uploadResult;
      
      if (isCloudinaryConfigured) {
        // Upload to Cloudinary
        try {
          console.log('Uploading to Cloudinary...');
          
          // Use a Promise to handle the upload
          uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { 
                folder: 'bluewhale',
                resource_type: 'image',
                access_mode: 'public'
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else {
                  console.log('Cloudinary upload success');
                  resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                  });
                }
              }
            );
            
            uploadStream.write(req.file.buffer);
            uploadStream.end();
          });
          
          console.log('Cloudinary upload result:', uploadResult);
        } catch (error) {
          console.error('Cloudinary upload failed, falling back to local storage', error);
          // Fall back to local storage if Cloudinary fails
          uploadResult = uploadToLocalStorage(req.file.buffer, req.file.originalname);
        }
      } else {
        // Otherwise use local storage
        console.log('Using local storage for upload');
        uploadResult = uploadToLocalStorage(req.file.buffer, req.file.originalname);
      }
      
      // Send success response
      console.log('Upload successful, returning URL:', uploadResult.url);
      res.status(200).json({
        url: uploadResult.url,
        message: 'File uploaded successfully',
        service: isCloudinaryConfigured ? 'cloudinary' : 'local'
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({
        message: 'Server error during upload',
        details: error.message,
        stack: error.stack
      });
    }
  }
);

// Helper function to upload to local storage
function uploadToLocalStorage(file, originalFilename) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalFilename);
  const filename = `image-${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  
  console.log('Writing file to local storage:', filePath);
  fs.writeFileSync(filePath, file);
  
  return {
    url: `/uploads/${filename}`
  };
}

// Make sure to serve the uploads directory statically
app.use('/uploads', express.static('uploads'));

// Registration diagnostics endpoint
app.get('/api/register-diagnostics', (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    session: {
      exists: !!req.session,
      id: req.sessionID || 'no-session',
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    },
    server: {
      hostname: req.hostname,
      headers: req.headers
    }
  };
  
  res.json({
    status: 'success',
    message: 'Registration diagnostics',
    diagnostics
  });
});

// Authentication middleware for protected routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

// Admin middleware
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
}

// Admin routes
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    // Check what columns exist in the users table
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('is_banned', 'stripe_customer_id');
    `;
    
    const columnsCheck = await pool.query(columnsQuery);
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    const isBannedColumnExists = existingColumns.includes('is_banned');
    const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
    
    console.log('Database columns check for admin/users:', {
      isBannedExists: isBannedColumnExists,
      stripeCustomerIdExists: stripeCustomerIdColumnExists
    });
    
    // Build a query based on what columns exist
    let selectFields = [
      'id', 'username', 'email', 'display_name as "displayName"', 
      'mascot', 'is_admin as "isAdmin"', 
      'notification_settings as "notificationSettings"', 'created_at as "createdAt"'
    ];
    
    if (isBannedColumnExists) {
      selectFields.push('is_banned as "isBanned"');
    }
    
    if (stripeCustomerIdColumnExists) {
      selectFields.push('stripe_customer_id as "stripeCustomerId"');
    }
    
    const query = `
      SELECT ${selectFields.join(', ')}
      FROM users ORDER BY created_at DESC
    `;
    
    console.log('Using customized admin/users select query');
    
    const result = await pool.query(query);
    
    // Add missing fields with default values
    result.rows.forEach(user => {
      if (!isBannedColumnExists) {
        user.isBanned = false;
      }
      
      if (!stripeCustomerIdColumnExists) {
        user.stripeCustomerId = null;
      }
    });
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin route to get all entries
app.get('/api/admin/entries', isAdmin, async (req, res) => {
  try {
    console.log('Admin request: Fetching all entries');
    
    // Check if entries table exists and has all required columns
    try {
      // Check what columns exist in the entries table
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'entries';
      `;
      
      const columnsCheck = await pool.query(columnsQuery);
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      
      console.log('Entries table columns:', existingColumns);
      
      // Build query to get all entries with proper field mapping
      const query = `
        SELECT 
          e.id, 
          e.user_id as "userId", 
          e.competition_id as "competitionId", 
          e.ticket_count as "ticketCount", 
          e.payment_status as "paymentStatus", 
          e.stripe_payment_id as "stripePaymentId", 
          e.created_at as "createdAt",
          u.username as "username",
          c.title as "competitionTitle"
        FROM 
          entries e
        LEFT JOIN 
          users u ON e.user_id = u.id
        LEFT JOIN 
          competitions c ON e.competition_id = c.id
        ORDER BY 
          e.created_at DESC
      `;
      
      const result = await pool.query(query);
      console.log(`Found ${result.rows.length} entries`);
      
      res.json(result.rows);
      
    } catch (error) {
      console.error('Error checking entries table structure:', error);
      
      // If the table doesn't exist or has an unexpected structure, return an empty array
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ message: 'Failed to fetch entries' });
  }
});

// Admin endpoint to manage site configuration
app.get('/api/admin/site-config', isAdmin, async (req, res) => {
  try {
    console.log('Admin request: Fetching all site configuration');
    
    // Check if site_config table exists
    try {
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'site_config'
        );
      `;
      
      const tableCheck = await pool.query(checkTableQuery);
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        console.log('Creating site_config table as it does not exist');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS site_config (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) NOT NULL UNIQUE,
            value TEXT,
            description TEXT,
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
      }
      
      // Now fetch all site configuration
      const result = await pool.query(`
        SELECT 
          id, 
          key, 
          value, 
          description, 
          updated_at as "updatedAt"
        FROM 
          site_config 
        ORDER BY 
          key ASC
      `);
      
      console.log(`Found ${result.rows.length} site configuration entries`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error with site_config table:', error);
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching site configuration:', err);
    res.status(500).json({ message: 'Failed to fetch site configuration' });
  }
});

// Admin endpoint to update site configuration
app.post('/api/admin/site-config', isAdmin, async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key) {
      return res.status(400).json({ message: 'Key is required' });
    }
    
    console.log(`Admin action: Updating site config "${key}" with value: ${value}`);
    
    // Ensure the site_config table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Try to insert, on conflict update
    const query = `
      INSERT INTO site_config (key, value, description, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = $2, 
        description = $3, 
        updated_at = NOW()
      RETURNING id, key, value, description, updated_at as "updatedAt";
    `;
    
    const result = await pool.query(query, [key, value, description]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update site configuration');
    }
    
    console.log(`Site config "${key}" updated successfully`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating site configuration:', err);
    res.status(500).json({ message: 'Failed to update site configuration', error: err.message });
  }
});

// Public endpoint to fetch specific site configuration
app.get('/api/site-config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ message: 'Key is required' });
    }
    
    console.log(`Fetching site config for key: ${key}`);
    
    // Check if site_config table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'site_config'
      );
    `;
    
    const tableCheck = await pool.query(checkTableQuery);
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('site_config table does not exist, returning empty result');
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    // Query the site config
    const result = await pool.query(`
      SELECT 
        id, 
        key, 
        value, 
        description, 
        updated_at as "updatedAt"
      FROM 
        site_config 
      WHERE 
        key = $1
    `, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching site config for key ${req.params.key}:`, err);
    res.status(500).json({ message: 'Failed to fetch site configuration' });
  }
});

// Ban/unban user
app.patch('/api/admin/users/:id/ban', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    console.log(`Admin action: ${isBanned ? 'Banning' : 'Unbanning'} user ID ${id}`);
    
    // Check what columns exist in the users table
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('is_banned', 'stripe_customer_id');
    `;
    
    const columnsCheck = await pool.query(columnsQuery);
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    const isBannedColumnExists = existingColumns.includes('is_banned');
    const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
    
    console.log('Database columns check for ban/unban:', {
      isBannedExists: isBannedColumnExists,
      stripeCustomerIdExists: stripeCustomerIdColumnExists
    });
    
    // If the is_banned column doesn't exist, we need to add it first
    if (!isBannedColumnExists) {
      console.log('⚠️ is_banned column does not exist in the database - adding it');
      
      // Add the column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_banned BOOLEAN DEFAULT FALSE
      `);
      
      console.log('✅ is_banned column added to users table');
    }
    
    // If the stripe_customer_id column doesn't exist, we need to add it too
    if (!stripeCustomerIdColumnExists) {
      console.log('⚠️ stripe_customer_id column does not exist in the database - adding it');
      
      // Add the column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN stripe_customer_id VARCHAR(255)
      `);
      
      console.log('✅ stripe_customer_id column added to users table');
    }
    
    // Build a query based on what columns exist
    let selectFields = [
      'id', 'username', 'email', 'display_name as "displayName"', 
      'mascot', 'is_admin as "isAdmin"', 
      'notification_settings as "notificationSettings"', 'created_at as "createdAt"',
      'is_banned as "isBanned"'
    ];
    
    if (stripeCustomerIdColumnExists) {
      selectFields.push('stripe_customer_id as "stripeCustomerId"');
    }
    
    // Now we can update the user
    const result = await pool.query(`
      UPDATE users SET is_banned = $1 WHERE id = $2 
      RETURNING ${selectFields.join(', ')}
    `, [isBanned, id]);
    
    if (result.rows.length === 0) {
      console.log(`User not found: ${id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add missing fields with default values if needed
    const user = result.rows[0];
    
    if (!stripeCustomerIdColumnExists) {
      user.stripeCustomerId = null;
    }
    
    console.log(`User ${user.username} successfully ${isBanned ? 'banned' : 'unbanned'}`);
    res.json(user);
  } catch (err) {
    console.error('Error updating user ban status:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Build the frontend
console.log('Copying Vite-built frontend assets in Docker...');

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Serve the Vite built frontend for all client routes (catch-all route for SPA)
app.get('*', (req, res, next) => {
  // Skip API routes and other non-frontend routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path === '/favicon.ico') {
    return next();
  }
  
  console.log(`🌐 Serving SPA for client route: ${req.path}`);
  // Serve the index.html for all client-side routes in the SPA
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Just keeping the route history for reference
app.get('/old-landing', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blue Whale Competitions</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        .bg-blue-gradient {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        }
        .bg-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .countdown-box {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 4px 10px;
          font-weight: 600;
          color: #1e3a8a;
          font-size: 12px;
          display: inline-block;
        }
        .category-badge {
          border-radius: 20px;
          padding: 2px 8px;
          font-size: 12px;
          display: inline-block;
        }
      </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
      <header class="bg-blue-gradient text-white py-6 shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <i class="fas fa-whale text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold">Blue Whale Competitions</h1>
                <p class="text-sm text-blue-200">Win amazing prizes with just a few clicks</p>
              </div>
            </div>
            <div class="hidden md:flex space-x-6">
              <a href="#" class="text-white hover:text-blue-200 transition duration-200">Home</a>
              <a href="#" class="text-white hover:text-blue-200 transition duration-200">Competitions</a>
              <a href="#" class="text-white hover:text-blue-200 transition duration-200">Winners</a>
              <a href="#" class="text-white hover:text-blue-200 transition duration-200">How to Play</a>
              <a href="#" class="text-white hover:text-blue-200 transition duration-200">Contact</a>
            </div>
            <div>
              <button class="px-4 py-2 rounded bg-white text-blue-700 font-medium hover:bg-blue-50 transition duration-200">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>
        
      <main class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row gap-6 mb-8">
          <div class="bg-white p-6 rounded-lg shadow-md flex-grow">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Platform Status</h2>
              <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Online</span>
            </div>
            <div class="space-y-2">
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <p class="text-gray-700">API Server running</p>
              </div>
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <p class="text-gray-700">Competitions endpoint available</p>
              </div>
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <p class="text-gray-700">Database connected</p>
              </div>
            </div>
            <div class="mt-4 flex space-x-4">
              <a href="/api/health" class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <i class="fas fa-heartbeat mr-1"></i> API Health
              </a>
              <a href="/api/competitions" class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <i class="fas fa-trophy mr-1"></i> View Competitions
              </a>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md flex-grow">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">About Blue Whale</h2>
            <p class="text-gray-700 mb-4 leading-relaxed">
              Blue Whale Competitions is a platform that gives users the chance to win incredible prizes 
              by entering competitions across various categories including technology, fashion, home goods, and more.
            </p>
            <p class="text-gray-700 leading-relaxed">
              Simply browse our competitions, purchase tickets, and you could be our next winner!
            </p>
            <div class="mt-4 flex space-x-3">
              <a href="#" class="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                <i class="fas fa-question-circle mr-1"></i> Learn more
              </a>
              <a href="#" class="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                <i class="fas fa-envelope mr-1"></i> Contact us
              </a>
            </div>
          </div>
        </div>
          
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Featured Competitions</h2>
            <a href="#" class="text-blue-600 hover:text-blue-800 flex items-center">
              View all <i class="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
          <div id="competitions-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-8 text-center">
              <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p class="text-gray-500 mt-4">Loading competitions...</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-search text-blue-600 text-2xl"></i>
              </div>
              <h3 class="font-medium text-gray-800 mb-2">1. Browse Competitions</h3>
              <p class="text-gray-600 text-sm">Explore our range of exciting competitions and find the prizes you'd love to win.</p>
            </div>
            <div class="text-center">
              <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ticket-alt text-blue-600 text-2xl"></i>
              </div>
              <h3 class="font-medium text-gray-800 mb-2">2. Buy Tickets</h3>
              <p class="text-gray-600 text-sm">Purchase tickets for your chosen competitions. The more tickets, the higher your chances!</p>
            </div>
            <div class="text-center">
              <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-trophy text-blue-600 text-2xl"></i>
              </div>
              <h3 class="font-medium text-gray-800 mb-2">3. Win Prizes</h3>
              <p class="text-gray-600 text-sm">Winners are randomly selected after the draw date. Will you be our next lucky winner?</p>
            </div>
          </div>
        </div>
      </main>
        
      <footer class="bg-gray-800 text-white pt-12 pb-8">
        <div class="container mx-auto px-4">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center space-x-2 mb-4">
                <i class="fas fa-whale text-3xl"></i>
                <h3 class="font-bold text-xl">Blue Whale</h3>
              </div>
              <p class="text-gray-400 mb-4">
                Your premier destination for discovering, entering, and winning online competitions.
              </p>
              <div class="flex space-x-4">
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <i class="fab fa-facebook"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <i class="fab fa-twitter"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">
                  <i class="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-4">Quick Links</h3>
              <ul class="space-y-2">
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">All Competitions</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Winners</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">How to Play</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-4">Categories</h3>
              <ul class="space-y-2">
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Electronics</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Fashion</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Home & Garden</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Travel & Experiences</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Cash Prizes</a></li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-4">Contact Us</h3>
              <ul class="space-y-2">
                <li class="flex items-start">
                  <i class="fas fa-envelope text-blue-400 mt-1 mr-2"></i>
                  <span class="text-gray-400">support@bluewhale.com</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-phone text-blue-400 mt-1 mr-2"></i>
                  <span class="text-gray-400">+44 (0)123 456 7890</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-map-marker-alt text-blue-400 mt-1 mr-2"></i>
                  <span class="text-gray-400">123 Competition Street, London, UK</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div class="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; ${new Date().getFullYear()} Blue Whale Competitions. All rights reserved.
            </div>
            <div class="flex space-x-6">
              <a href="#" class="text-gray-400 hover:text-white text-sm">Terms & Conditions</a>
              <a href="#" class="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" class="text-gray-400 hover:text-white text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      
      <script>
        // Helper function to format date
        function formatDate(dateString) {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          return new Date(dateString).toLocaleDateString(undefined, options);
        }
        
        // Helper function to format currency
        function formatCurrency(amount) {
          return new Intl.NumberFormat('en-GB', { 
            style: 'currency', 
            currency: 'GBP',
            minimumFractionDigits: 2 
          }).format(amount);
        }
        
        // Function to calculate time remaining until a date
        function getTimeRemaining(endDate) {
          const total = Date.parse(endDate) - Date.parse(new Date().toString());
          const seconds = Math.floor((total / 1000) % 60);
          const minutes = Math.floor((total / 1000 / 60) % 60);
          const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
          const days = Math.floor(total / (1000 * 60 * 60 * 24));
          
          return {
            total,
            days,
            hours,
            minutes,
            seconds
          };
        }
        
        // Helper function to get color based on category
        function getCategoryColor(category) {
          const colors = {
            'Kitchen': 'bg-yellow-100 text-yellow-800',
            'Gaming': 'bg-purple-100 text-purple-800',
            'Electronics': 'bg-blue-100 text-blue-800',
            'Fashion': 'bg-pink-100 text-pink-800',
            'Travel': 'bg-green-100 text-green-800',
            'Cash': 'bg-emerald-100 text-emerald-800',
            'Home': 'bg-orange-100 text-orange-800',
            'Sports': 'bg-red-100 text-red-800'
          };
          
          return colors[category] || 'bg-gray-100 text-gray-800';
        }

        // Fetch competitions
        fetch('/api/competitions')
          .then(response => response.json())
          .then(data => {
            const competitionsList = document.getElementById('competitions-list');
            competitionsList.innerHTML = '';
            
            if (data.length === 0) {
              competitionsList.innerHTML = '<div class="col-span-full text-center"><p class="text-gray-500">No competitions available right now.</p></div>';
              return;
            }
            
            data.forEach(competition => {
              const timeRemaining = getTimeRemaining(competition.drawDate);
              const categoryColor = getCategoryColor(competition.category);
              
              const card = document.createElement('div');
              card.className = 'bg-white rounded-lg shadow-md overflow-hidden transition duration-300 bg-card-hover border border-gray-200';
              
              card.innerHTML = \`
                <div class="relative">
                  <img src="/images/\${competition.imageUrl?.split('/').pop() || 'placeholder.jpg'}" 
                       alt="\${competition.title}" 
                       class="w-full h-48 object-cover" 
                       onerror="this.src='https://via.placeholder.com/400x300/3b82f6/FFFFFF?text=\${encodeURIComponent(competition.title)}'">
                  <div class="absolute top-3 right-3 countdown-box">
                    <i class="far fa-clock mr-1"></i> \${timeRemaining.days}d \${timeRemaining.hours}h remaining
                  </div>
                </div>
                <div class="p-5">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-lg text-gray-800">\${competition.title}</h3>
                    <span class="category-badge \${categoryColor}">\${competition.category}</span>
                  </div>
                  <p class="text-gray-600 text-sm mb-3">\${competition.description.substring(0, 100)}...</p>
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="text-gray-500 text-xs mb-1">Prize Value</p>
                      <p class="font-bold text-blue-600">\${formatCurrency(competition.prizeValue)}</p>
                    </div>
                    <div>
                      <p class="text-gray-500 text-xs mb-1">Ticket Price</p>
                      <p class="font-medium">\${formatCurrency(competition.ticketPrice)}</p>
                    </div>
                    <div>
                      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition duration-200">
                        Enter Now
                      </button>
                    </div>
                  </div>
                  <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                      <span class="font-medium">\${competition.ticketsSold}</span> of \${competition.totalTickets} tickets sold
                    </div>
                    <div class="text-xs text-gray-500">
                      Draw: \${formatDate(competition.drawDate)}
                    </div>
                  </div>
                </div>
              \`;
              competitionsList.appendChild(card);
            });
          })
          .catch(error => {
            console.error('Error fetching competitions:', error);
            document.getElementById('competitions-list').innerHTML = 
              '<div class="col-span-full"><div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center"><i class="fas fa-exclamation-triangle mr-2"></i>Failed to load competitions. Please try again later.</div></div>';
          });
      </script>
    </body>
    </html>
  `);
});

// Serve the SPA for any non-API routes (client-side routing)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Send the index.html for all other routes for client-side routing
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});