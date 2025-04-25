// Server startup script for Docker deployment
// This runs inside the Docker container

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const connectPg = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

// For password comparison
const scryptAsync = promisify(scrypt);

// Set up database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create Express app
const app = express();

// Detailed request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'https://bluewhalecompetitions.co.uk'];

console.log('Allowed CORS origins:', allowedOrigins);
console.log('Environment:', process.env.NODE_ENV);

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
    
    if (user.isBanned) {
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
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  console.log(`✅ User is authenticated: { id: ${req.user.id}, username: '${req.user.username}' }`);
  console.log('Sending user data to client:', req.user);
  res.json(req.user);
});

// Basic API routes
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!pool ? 'connected' : 'not connected'
  };
  res.json(health);
});

// Site configuration routes
app.get('/api/site-config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      'SELECT * FROM site_config WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching site config:', err);
    res.status(500).json({ message: 'Failed to fetch configuration' });
  }
});

// Get all competitions
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

// Admin routes - CRUD operations for competitions
// Create competition endpoint
app.post('/api/admin/competitions', isAdmin, async (req, res) => {
  try {
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

// Delete competition endpoint
app.delete('/api/admin/competitions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Admin delete request for competition ID: ${id}`);
    
    // First delete all entries for this competition
    await pool.query('DELETE FROM entries WHERE competition_id = $1', [id]);
    
    // Then delete any winners
    await pool.query('DELETE FROM winners WHERE competition_id = $1', [id]);
    
    // Finally delete the competition
    const result = await pool.query('DELETE FROM competitions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Competition ID ${id} not found for deletion`);
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    console.log(`✅ Successfully deleted competition ID: ${id}`);
    res.status(200).json({ success: true, message: 'Competition deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting competition:', err);
    res.status(500).json({ message: 'Failed to delete competition', error: err.message });
  }
});

// Admin routes - User management
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, display_name as "displayName", 
       mascot, is_admin as "isAdmin", is_banned as "isBanned", 
       notification_settings as "notificationSettings", created_at as "createdAt"
       FROM users ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Reset competitions endpoint for admin
app.post('/api/admin/reset-competitions', isAdmin, async (req, res) => {
  try {
    console.log('🧹 Starting competition reset process...');
    
    // Comprehensive approach: try several methods to ensure successful reset
    
    // First approach: Delete entries, winners, then competitions
    try {
      console.log('🔄 Attempt 1: Using SQL transaction');
      await pool.query('BEGIN');
      
      // Clear entries table first (to avoid foreign key constraints)
      console.log('🗑️ Deleting entries...');
      await pool.query('DELETE FROM entries');
      console.log('✓ Entries deleted');
      
      // Then clear winners
      console.log('🗑️ Deleting winners...');
      await pool.query('DELETE FROM winners');
      console.log('✓ Winners deleted');
      
      // Finally clear competitions
      console.log('🗑️ Deleting competitions...');
      await pool.query('DELETE FROM competitions');
      console.log('✓ Competitions deleted');
      
      // Reset sequences
      await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
      
      await pool.query('COMMIT');
      console.log('✅ Transaction completed successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'All competitions have been successfully deleted.'
      });
      return;
    } catch (txError) {
      console.error('❌ Transaction method failed:', txError);
      // Try to rollback the transaction
      try {
        await pool.query('ROLLBACK');
        console.log('↩️ Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback also failed:', rollbackError);
      }
      
      // Continue to the next approach
    }
    
    // Second approach: Force deletion with cascade
    try {
      console.log('🔄 Attempt 2: Using CASCADE operations');
      
      // Temporarily disable foreign key constraints
      await pool.query('SET CONSTRAINTS ALL DEFERRED');
      
      // Delete competitions with force
      console.log('🗑️ Force deleting competitions with CASCADE...');
      await pool.query('TRUNCATE competitions, entries, winners CASCADE');
      console.log('✓ Forced deletion successful');
      
      // Reset sequences
      await pool.query('ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1');
      
      // Re-enable constraints
      await pool.query('SET CONSTRAINTS ALL IMMEDIATE');
      
      console.log('✅ CASCADE operation completed successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'All competitions have been successfully deleted with force approach.'
      });
      return;
    } catch (cascadeError) {
      console.error('❌ CASCADE operation failed:', cascadeError);
    }
    
    // If we reach here, all approaches failed
    console.error('❌ All reset approaches failed');
    res.status(500).json({ 
      success: false, 
      message: 'Multiple reset approaches failed. Database might be locked or corrupted.'
    });
  } catch (outerError) {
    console.error('❌ Catastrophic error in reset process:', outerError);
    res.status(500).json({ 
      success: false, 
      message: 'A severe error occurred during the reset process.',
      error: outerError.message
    });
  }
});

// Ban/unban user
app.patch('/api/admin/users/:id/ban', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET is_banned = $1 WHERE id = $2 
       RETURNING id, username, email, display_name as "displayName", 
       mascot, is_admin as "isAdmin", is_banned as "isBanned", 
       notification_settings as "notificationSettings", created_at as "createdAt"`,
      [isBanned, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user ban status:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'An unexpected error occurred' });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});