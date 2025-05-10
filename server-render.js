// This is a simplified server file specifically for Render deployment
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const connectPg = require('connect-pg-simple')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// For password comparison
const scryptAsync = promisify(scrypt);

// Setup database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Configure Cloudinary if keys are available
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured for image uploads');
} else {
  console.warn('Missing Cloudinary credentials - image uploads will not work');
}

// Setup file uploads
const upload = multer({ dest: 'uploads/' });

// Detailed request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS setup 
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'https://bluewhalecompetitions.co.uk', 'https://www.mobycomps.co.uk'];

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.endsWith('.replit.dev') || 
        origin.endsWith('.onrender.com') ||
        origin.includes('mobycomps.co.uk')) {
      console.log(`Origin ${origin} is allowed by CORS`);
      return callback(null, true);
    }
    
    console.log(`Origin ${origin} is NOT allowed by CORS`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session with PostgreSQL storage
const sessionOptions = {
  store: new connectPg({
    pool,
    tableName: 'session', // Default table name
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-secure-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

// For production, set the cookie domain if configured
if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
  sessionOptions.cookie.domain = process.env.COOKIE_DOMAIN;
  console.log(`Setting cookie domain to: ${process.env.COOKIE_DOMAIN}`);
}

// Trust first proxy if in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  console.log('Trusting first proxy');
}

app.use(session(sessionOptions));
console.log('Session middleware configured');

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
console.log('Passport initialized');

// User authentication helpers
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure Passport to use local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  console.log(`🔑 Login attempt for username: ${username}`);
  try {
    // Find user in database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return done(null, false, { message: 'Incorrect username or password' });
    }
    
    if (user.is_banned) {
      console.log(`🚫 Banned user attempted login: ${username}`);
      return done(null, false, { message: 'Account is banned. Contact support for assistance.' });
    }
    
    // Verify password
    const isValid = await comparePasswords(password, user.password);
    
    if (!isValid) {
      console.log(`❌ Invalid password for user: ${username}`);
      return done(null, false, { message: 'Incorrect username or password' });
    }
    
    // Don't return password in user object
    delete user.password;
    console.log(`✅ Login successful for: ${username}`);
    
    return done(null, user);
  } catch (err) {
    console.error('Login error:', err);
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  console.log(`🔒 Serializing user: ${user.username}, ID: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log(`🔍 Deserializing user from session ID: ${id}`);
  try {
    const result = await pool.query(
      'SELECT id, username, email, display_name as "displayName", mascot, stripe_customer_id as "stripeCustomerId", is_admin as "isAdmin", is_banned as "isBanned", notification_settings as "notificationSettings", created_at as "createdAt" FROM users WHERE id = $1',
      [id]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      console.log(`❌ User not found for session ID: ${id}`);
      return done(null, false);
    }
    
    console.log(`✅ User deserialized successfully: { id: ${user.id}, username: '${user.username}', isAdmin: ${user.isAdmin} }`);
    done(null, user);
  } catch (err) {
    console.error('Deserialize user error:', err);
    done(err);
  }
});

// Authentication middleware for protected routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Admin middleware
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
}

// Authentication routes
app.post('/api/login', (req, res, next) => {
  console.log('📥 Login request received', { username: req.body.username });
  
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('❌ Login failed: Invalid credentials');
      return res.status(401).json({ message: info.message || 'Invalid username or password' });
    }
    
    req.login(user, (err) => {
      if (err) {
        console.error('Session login error:', err);
        return next(err);
      }
      
      console.log(`✅ User logged in successfully: ${user.username}`);
      return res.status(200).json(user);
    });
  })(req, res, next);
});

app.post('/api/register', async (req, res, next) => {
  console.log('📥 Registration request received');
  
  try {
    // Check if username exists
    const usernameCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [req.body.username]
    );
    
    if (usernameCheck.rows.length > 0) {
      console.log(`❌ Registration failed: Username already exists: ${req.body.username}`);
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Check if email exists
    const emailCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [req.body.email]
    );
    
    if (emailCheck.rows.length > 0) {
      console.log(`❌ Registration failed: Email already exists: ${req.body.email}`);
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(req.body.password);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users 
       (username, email, password, display_name, mascot, is_admin, is_banned, notification_settings, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, username, email, display_name as "displayName", mascot, is_admin as "isAdmin", is_banned as "isBanned", notification_settings as "notificationSettings", created_at as "createdAt"`,
      [
        req.body.username,
        req.body.email,
        hashedPassword,
        req.body.displayName || null,
        req.body.mascot || 'whale',
        false, // not admin
        false, // not banned
        { email: true, inApp: true }, // default notification settings
        new Date()
      ]
    );
    
    const newUser = result.rows[0];
    console.log(`✅ User registered successfully: ${newUser.username}`);
    
    // Log in the new user
    req.login(newUser, (err) => {
      if (err) {
        console.error('Login error after registration:', err);
        return next(err);
      }
      
      res.status(201).json(newUser);
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed due to a server error' });
  }
});

app.post('/api/logout', (req, res) => {
  const username = req.user ? req.user.username : 'Unknown user';
  console.log(`📤 Logout request received for: ${username}`);
  
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    console.log(`✅ User logged out successfully: ${username}`);
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.get('/api/user', (req, res) => {
  console.log('🔒 Current user request received');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('❌ User not authenticated');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  console.log(`✅ User is authenticated: { id: ${req.user.id}, username: '${req.user.username}' }`);
  console.log('Sending user data to client:', req.user);
  res.json(req.user);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!pool ? 'connected' : 'not connected'
  };
  res.json(health);
});

// Competitions endpoints
app.get('/api/competitions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM competitions 
       WHERE is_live = true 
       ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).json({ message: 'Failed to fetch competitions' });
  }
});

// Get single competition by ID endpoint
app.get('/api/competitions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🔍 GET competition request for ID: ${id}`);
    
    const result = await pool.query(
      `SELECT * FROM competitions WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Competition not found: ID=${id}`);
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    console.log(`✅ Successfully retrieved competition: ID=${id}, Title="${result.rows[0].title}"`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ Error fetching competition ${req.params.id}:`, err);
    res.status(500).json({ 
      message: 'Failed to fetch competition details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Initialize ticket statuses endpoint
app.post('/api/admin/initialize-ticket-statuses', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { competitionId } = req.body;
    
    if (!competitionId) {
      return res.status(400).json({ message: 'Competition ID is required' });
    }
    
    console.log(`🔄 Initializing ticket statuses for competition: ${competitionId}`);
    
    // Get competition details to get total tickets
    const compResult = await pool.query(
      'SELECT total_tickets FROM competitions WHERE id = $1',
      [competitionId]
    );
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    const { total_tickets } = compResult.rows[0];
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Get existing ticket statuses for this competition
    const existingResult = await pool.query(
      'SELECT ticket_number FROM ticket_statuses WHERE competition_id = $1',
      [competitionId]
    );
    
    const existingTickets = new Set(existingResult.rows.map(row => row.ticket_number));
    console.log(`Found ${existingTickets.size} existing ticket statuses`);
    
    // Create array for batch insert of missing tickets
    const ticketsToInsert = [];
    
    for (let i = 1; i <= total_tickets; i++) {
      if (!existingTickets.has(i)) {
        ticketsToInsert.push([competitionId, i, 'available']);
      }
    }
    
    console.log(`Preparing to insert ${ticketsToInsert.length} new ticket statuses`);
    
    // If there are tickets to insert, do a batch insert
    if (ticketsToInsert.length > 0) {
      // Insert in batches of 1000 to avoid statement size limitations
      const BATCH_SIZE = 1000;
      
      for (let i = 0; i < ticketsToInsert.length; i += BATCH_SIZE) {
        const batch = ticketsToInsert.slice(i, i + BATCH_SIZE);
        
        let query = 'INSERT INTO ticket_statuses (competition_id, ticket_number, status) VALUES ';
        const values = [];
        let paramIndex = 1;
        
        batch.forEach((ticket, index) => {
          query += index === 0 ? '' : ', ';
          query += `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`;
          paramIndex += 3;
          values.push(...ticket);
        });
        
        await pool.query(query, values);
        console.log(`Inserted batch of ${batch.length} ticket statuses`);
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log(`✅ Successfully initialized ticket statuses for competition ${competitionId}`);
    res.json({ 
      message: 'Ticket statuses initialized successfully', 
      totalTickets: total_tickets,
      newTicketsInitialized: ticketsToInsert.length,
      existingTickets: existingTickets.size
    });
  } catch (err) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error('Error initializing ticket statuses:', err);
    res.status(500).json({ message: 'Failed to initialize ticket statuses' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/client')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Catch-all route to serve the frontend for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist/client', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist/client')}`);
});