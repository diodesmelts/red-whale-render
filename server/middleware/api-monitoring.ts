/**
 * API Monitoring Middleware
 * 
 * This middleware provides structured tracking of API errors in production to help
 * diagnose issues when they occur. It logs error details in a structured format
 * for easier parsing and analysis.
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Store original response methods
const originalMethods = {
  json: Response.prototype.json,
  send: Response.prototype.send,
  status: Response.prototype.status
};

// Track request start time
export function apiMonitoring(req: Request, res: Response, next: NextFunction) {
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
  res.status = function(code: number) {
    statusCode = code;
    return originalStatus.call(this, code);
  };
  
  // Create a response interceptor
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - (req.startTime || 0);
    
    // Only log errors (4xx and 5xx responses)
    if (statusCode >= 400) {
      // Log the error in a structured format
      const errorLog = {
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
      
      // Log to console in production
      console.error(`❌ API Error: ${statusCode} ${req.method} ${req.path} - ${responseTime}ms`, 
        process.env.NODE_ENV === 'production' 
          ? { error: errorLog.error } // Minimal logging in production
          : errorLog // Full details in development
      );
      
      // In production, also log to a file for persistence and later analysis
      if (process.env.NODE_ENV === 'production') {
        try {
          const logsDir = path.join(process.cwd(), 'logs');
          
          // Ensure logs directory exists
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
          }
          
          // Write to file with date-based filename
          const date = new Date();
          const filename = `api-errors-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
          
          // Append to the file
          fs.appendFileSync(
            path.join(logsDir, filename),
            JSON.stringify(errorLog) + '\n'
          );
        } catch (fileError) {
          console.error('Error writing to API error log file:', fileError);
        }
      }
    } else if (process.env.NODE_ENV !== 'production' && responseTime > 1000) {
      // For successful requests, log slow responses in development
      console.warn(`⚠️ Slow API response: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
}

// Add request timing and ID to express Request type
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

export default apiMonitoring;