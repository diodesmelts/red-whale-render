/**
 * Production Fixes for Docker Environment
 * 
 * This script contains standalone functions for fixing production issues
 * that can be directly imported into server-docker.cjs without dependencies.
 */

// ===== ERROR HANDLING IMPROVEMENTS =====

/**
 * Add proper error handling to API responses for competitions
 * @param {object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {object} [defaultData={}] - Default data to include in the response
 * @returns {object} - Response object
 */
function errorResponse(res, status, message, defaultData = {}) {
  return res.status(status).json({
    message,
    ...defaultData
  });
}

/**
 * Create default ticket stats data for error responses
 * @returns {object} - Default ticket stats data
 */
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

/**
 * Create default active cart items data for error responses
 * @returns {object} - Default active cart items data
 */
function defaultCartItems() {
  return {
    inCartNumbers: []
  };
}

// ===== PRODUCTION LOGGING =====

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

/**
 * Set up production logging to reduce verbose output
 */
function setupProductionLogging() {
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
}

// ===== API MONITORING =====

/**
 * Create structured API error log
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body
 * @param {number} startTime - Request start time
 * @returns {object} - Error log object
 */
function createApiErrorLog(req, res, statusCode, body, startTime) {
  const responseTime = Date.now() - startTime;
  
  return {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    responseTime,
    userAgent: req.headers['user-agent'],
    requestBody: req.method !== 'GET' ? req.body : undefined,
    responseBody: body,
    error: body.error || body.message || null,
    // Add user info if available (anonymized)
    user: req.user ? {
      id: req.user.id,
      isAdmin: req.user.isAdmin,
      authenticated: true
    } : {
      authenticated: false
    }
  };
}

/**
 * Add API monitoring middleware to the Express app
 * @param {object} app - Express app
 */
function addApiMonitoring(app) {
  app.use((req, res, next) => {
    // Only intercept API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    // Add request timestamp
    req.startTime = Date.now();
    
    // Track original status
    let statusCode = 200;
    
    // Override status method
    const originalStatus = res.status;
    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    // Create a response interceptor
    const originalJson = res.json;
    res.json = function(body) {
      // Only log errors (4xx and 5xx responses)
      if (statusCode >= 400) {
        const errorLog = createApiErrorLog(req, res, statusCode, body, req.startTime);
        
        // Log to console
        console.error(`❌ API Error: ${statusCode} ${req.method} ${req.path} - ${Date.now() - req.startTime}ms`, 
          process.env.NODE_ENV === 'production' 
            ? { error: errorLog.error } // Minimal logging in production
            : errorLog // Full details in development
        );
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  });
}

// Export all functions
module.exports = {
  errorResponse,
  defaultTicketStats,
  defaultCartItems,
  setupProductionLogging,
  addApiMonitoring
};