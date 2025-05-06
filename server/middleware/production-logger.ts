/**
 * Production Logging Middleware
 * 
 * This middleware reduces the verbosity of logs in production while
 * still allowing full logging in development. It can be added to the
 * existing application without requiring a full rebuild.
 */

import { Request, Response, NextFunction } from 'express';

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug
};

// Patterns of log messages to suppress in production
const suppressionPatterns = [
  /🛒 Requesting active cart items/,
  /📊 Request to get ticket statistics/,
  /🔍 Request to GET/,
  /🔍 Request to POST/,
  /🔄 CORS request/,
  /✅ User deserialized successfully/,
  /🔍 Deserializing user/,
  /hasSession:/,
  /sessionID:/,
  /hasSessionData:/
];

// Create a production logger that filters out routine logs
export function setupProductionLogger() {
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

// Express middleware to filter request logging
export function productionRequestLogger(req: Request, res: Response, next: NextFunction) {
  // Only log requests in production if they're not static assets or common API calls
  if (process.env.NODE_ENV === 'production') {
    const routePatterns = [
      /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
      /^\/api\/competitions\/\d+\/active-cart-items$/,
      /^\/api\/competitions\/\d+\/ticket-stats$/
    ];
    
    const isRoutineRequest = routePatterns.some(pattern => 
      pattern.test(req.path)
    );
    
    if (!isRoutineRequest) {
      console.log(`📝 ${req.method} ${req.path}`);
    }
  } else {
    // In development, log all requests
    console.log(`📝 ${req.method} ${req.path}`);
  }
  
  next();
}

export default {
  setupProductionLogger,
  productionRequestLogger
};