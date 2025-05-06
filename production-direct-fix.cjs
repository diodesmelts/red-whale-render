/**
 * Production Direct Fix
 * 
 * This script applies fixes directly to the server-docker.cjs file
 * without relying on complex build-time modifications that 
 * might cause initialization errors.
 */

const fs = require('fs');
const path = require('path');

// Path to server file
const serverFilePath = path.join(__dirname, 'server-docker.cjs');
const backupPath = path.join(__dirname, 'server-docker.backup.cjs');

console.log('🔧 Starting direct production fixes...');

// Make sure the server file exists
if (!fs.existsSync(serverFilePath)) {
  console.error(`❌ Error: Server file not found at ${serverFilePath}`);
  process.exit(1);
}

// Create a backup of the original file
fs.copyFileSync(serverFilePath, backupPath);
console.log(`✅ Backup created at ${backupPath}`);

// Read the server file content
let content = fs.readFileSync(serverFilePath, 'utf8');

// ----- 1. Add production logging helpers at the top -----
// These functions need to be defined before they're used
const loggingHelpers = `
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
`;

// Insert the logging helpers right after the imports but before any code
content = content.replace(
  /(const express = require\('express'\);.*?const Stripe = require\('stripe'\);)/s,
  '$1\n' + loggingHelpers
);

// ---- 2. Improve error handling for critical endpoints -----

// Fix ticket stats endpoint
content = content.replace(
  /(app\.get\('\/api\/competitions\/:id\/ticket-stats'.*?if \(compResult\.rows\.length === 0\) {)(.*?)(\s*return res\.status\(404\)\.json\({ message: "Competition not found" }\);)/s,
  '$1$2\n      console.error(`❌ Competition not found for ticket stats: ${id}`);\n      return errorResponse(res, 404, "Competition not found", defaultTicketStats());'
);

content = content.replace(
  /(app\.get\('\/api\/competitions\/:id\/ticket-stats'.*?catch \(error\) {)(.*?)(\s*console\.error\('Error calculating ticket statistics:'.*)(\s*res\.status\(500\)\.json\({ message: "Error calculating ticket statistics" }\);)/s,
  '$1$2$3\n    return errorResponse(res, 500, error.message || "Error calculating ticket statistics", defaultTicketStats());'
);

// Fix active cart items endpoint
content = content.replace(
  /(app\.post\('\/api\/competitions\/:id\/active-cart-items'.*?if \(compResult\.rows\.length === 0\) {)(.*?)(\s*return res\.status\(404\)\.json\({ message: "Competition not found" }\);)/s,
  '$1$2\n      console.error(`❌ Competition not found for active cart items: ${id}`);\n      return errorResponse(res, 404, "Competition not found", defaultCartItems());'
);

content = content.replace(
  /(app\.post\('\/api\/competitions\/:id\/active-cart-items'.*?catch \(error\) {)(.*?)(\s*console\.error\('Error fetching active cart items:'.*)(\s*res\.status\(500\)\.json\({ message: "Error processing cart items" }\);)/s,
  '$1$2$3\n    return errorResponse(res, 500, "Error processing cart items", defaultCartItems());'
);

// ---- 3. Add logs directory creation ----
content = content.replace(
  /(const app = express\(\);)/,
  '$1\n\n// Ensure logs directory exists\nconst logsDir = path.join(__dirname, \'logs\');\nif (!fs.existsSync(logsDir)) {\n  fs.mkdirSync(logsDir, { recursive: true });\n  console.log(`📁 Created logs directory at ${logsDir}`);\n}'
);

// Fix image uploads - ensure uploads dir exists
content = content.replace(
  /(const storage = multer\.diskStorage\({)/,
  '$1\n  destination: function (req, file, cb) {\n    // Ensure the uploads directory exists\n    const uploadsDir = path.join(__dirname, \'uploads\');\n    if (!fs.existsSync(uploadsDir)) {\n      fs.mkdirSync(uploadsDir, { recursive: true });\n    }\n    cb(null, uploadsDir);\n  },'
);

// Ensure NODE_ENV is properly recognized 
content = content.replace(
  /(const isProduction = process\.env\.NODE_ENV === 'production';)/,
  'const isProduction = process.env.NODE_ENV === \'production\';\nconsole.log(`🌐 Current NODE_ENV: ${process.env.NODE_ENV || \'not set\'} (isProduction=${isProduction})`);'
);

// Write the modified content back to the server file
fs.writeFileSync(serverFilePath, content);

console.log('✅ Direct production fixes applied successfully!');
console.log('🔄 Changes made:');
console.log('   - Added production logging to reduce log volume');
console.log('   - Improved error handling for critical endpoints');
console.log('   - Added directory creation for logs and uploads');
console.log('   - Enhanced error responses with consistent formatting');