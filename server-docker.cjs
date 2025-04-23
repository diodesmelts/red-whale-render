// Server startup script for Docker deployment
// This runs inside the Docker container using CommonJS

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// We'll set up the session later with the PgSessionStore

// Parse JSON requests
app.use(express.json());

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
    }));
    
    res.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
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
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: 'lax',
    path: "/",
    httpOnly: true,
  },
  name: "bw.sid"
}));

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
    // Query the database for the user
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    const user = rows[0];
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
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    const user = rows[0];
    done(null, user);
  } catch (error) {
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Check if we have an admin user, create if we don't
    const { rows } = await client.query(
      'SELECT COUNT(*) FROM users WHERE is_admin = TRUE'
    );
    
    if (parseInt(rows[0].count) === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('Admin123!');
      await client.query(`
        INSERT INTO users (
          username, email, password, display_name, 
          mascot, is_admin
        ) VALUES (
          'admin', 'admin@bluewhalecompetitions.com', $1, 
          'Admin', 'whale', TRUE
        )
      `, [hashedPassword]);
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
        mascot, notification_settings, is_admin
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING id, username, email, display_name, mascot, 
        notification_settings, is_admin, created_at
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
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ 
        message: info?.message || "Invalid username or password" 
      });
    }
    
    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      
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

// Current user endpoint
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Don't send the password back to the client
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

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

// Build the frontend
console.log('Copying Vite-built frontend assets in Docker...');

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Serve the Vite built frontend for all client routes
app.get('/', (req, res) => {
  // Serve the index.html for the SPA
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