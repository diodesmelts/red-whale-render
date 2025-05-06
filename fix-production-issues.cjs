/**
 * Comprehensive Production Issues Fix Script
 * 
 * This script addresses multiple issues in the production environment:
 * 1. Competition overview page errors
 * 2. Favicon loading issues
 * 3. Excessive logging
 * 
 * Run this directly on your production server to apply all fixes.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🛠️ Starting comprehensive production fixes...');

// ===== PART 1: API ERROR HANDLING FIXES =====

function fixApiErrorHandling() {
  console.log('\n📝 FIXING API ERROR HANDLING');
  
  // Paths to check for routes file (supporting both development and production structures)
  const routesPaths = [
    path.join(__dirname, 'server', 'routes.ts'),
    path.join(__dirname, 'dist', 'server', 'routes.js'),
    path.join(__dirname, 'routes.js')
  ];

  // Determine which routes file to modify
  let routesFilePath = null;
  let isTypeScript = false;

  for (const path of routesPaths) {
    if (fs.existsSync(path)) {
      routesFilePath = path;
      isTypeScript = path.endsWith('.ts');
      console.log(`Found routes file at: ${path}`);
      break;
    }
  }

  if (!routesFilePath) {
    console.error('Could not locate routes file. Skipping API error handling fixes.');
    return false;
  }

  // Read the routes file content
  let content = fs.readFileSync(routesFilePath, 'utf8');

  // Function to add error handling to the ticket stats endpoint
  function addTicketStatsErrorHandling(content) {
    console.log('Adding error handling to ticket stats endpoint...');
    
    // Pattern to match the ticket stats endpoint error handler
    const ticketStatsErrorPattern = /catch\s*\(\s*error[^{]*{[^}]*console\.error\([^;]*;[^}]*res\.status\(500\)\.json\([^}]*}\s*\)/s;
    
    // The enhanced error handling code to insert
    const enhancedErrorHandling = `catch (error) {
      console.error(\`❌ Error fetching ticket statistics for competition \${req.params.id}:\`, error);
      res.status(500).json({ 
        message: error.message || 'Error calculating ticket statistics',
        // Add default values for essential properties to prevent UI errors
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
      })`;

    // Check if the pattern exists in the content
    if (ticketStatsErrorPattern.test(content)) {
      // Replace the existing error handling with the enhanced version
      content = content.replace(ticketStatsErrorPattern, enhancedErrorHandling);
      console.log('  ✅ Successfully updated ticket stats error handling.');
    } else {
      console.log('  ⚠️ Could not locate ticket stats error handler pattern. Skipping.');
    }
    
    return content;
  }

  // Function to add error handling to the active cart items endpoint
  function addActiveCartItemsErrorHandling(content) {
    console.log('Adding error handling to active cart items endpoint...');
    
    // Pattern to match the active cart items endpoint with the competition check
    const activeCartItemsPattern = /app\.post\(\s*["']\/api\/competitions\/:id\/active-cart-items["'][^{]*{[^}]*competitionId\s*=\s*parseInt\([^)]*\)[^}]*}/s;
    
    // Check if the pattern exists and has a simple form we can safely update
    if (activeCartItemsPattern.test(content)) {
      // Add competition existence check
      content = content.replace(
        /const\s+competitionId\s*=\s*parseInt\(req\.params\.id\);[^]*?try\s*{/s,
        `const competitionId = parseInt(req.params.id);
      if (isNaN(competitionId)) {
        console.log(\`⚠️ Invalid competition ID for active cart items: \${req.params.id}\`);
        return res.status(400).json({ 
          message: 'Invalid competition ID',
          inCartNumbers: [] // Always provide valid response format
        });
      }

      try {
        // Check if competition exists
        const competition = await dataStorage.getCompetition(competitionId);
        if (!competition) {
          console.log(\`⚠️ Competition not found for active cart items: \${competitionId}\`);
          return res.status(404).json({ 
            message: 'Competition not found',
            inCartNumbers: [] // Always provide valid response format
          });
        }`
      );
      
      // Update the error handling in the catch block
      content = content.replace(
        /catch\s*\(error\)\s*{[^}]*?console\.error\([^;]*;[^}]*?res\.status\(500\)\.json\([^}]*}/s,
        `catch (error) {
        console.error(\`❌ Error processing cart items for competition \${req.params.id}:\`, error);
        res.status(500).json({ 
          message: 'Error processing cart items',
          inCartNumbers: [] // Always provide valid response format
        });
      }`
      );
      
      console.log('  ✅ Successfully updated active cart items error handling.');
    } else {
      console.log('  ⚠️ Could not locate active cart items handler pattern. Skipping.');
    }
    
    return content;
  }

  // Apply the error handling fixes
  content = addTicketStatsErrorHandling(content);
  content = addActiveCartItemsErrorHandling(content);

  // Write the updated content back to the file
  fs.writeFileSync(routesFilePath, content, 'utf8');
  console.log(`  ✅ Successfully updated routes file at: ${routesFilePath}`);
  
  return true;
}

// ===== PART 2: FAVICON LOADING FIX =====

function fixFaviconLoadingIssue() {
  console.log('\n🌐 FIXING FAVICON LOADING ISSUE');
  
  // Create a static favicon.ico file as a fallback solution
  console.log('Creating static favicon.ico file as a fallback solution');
  
  // Base64 encoded minimal favicon (a simple blue square)
  const faviconBase64 = `
    AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAABMLAAATCwAAAAAA
    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmkMxmZpDMzGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM
    /2aQzP9mkMzMZpDMZgAAAAAAAAAAAAAAAAAAAAAAAAAAZpDMzGaQzP9mkMz/ZpDM/2aQzP9mkMz/
    ZpDM/2aQzP9mkMz/ZpDM/2aQzMwAAAAAAAAAAAAAAAAAAAAAAAAAAGaQzP9mkMz/ZpDM/2aQzP9m
    kMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/AAAAAAAAAAAAAAAAAAAAAAAAAABmkMz/ZpDM/2aQ
    zP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/wAAAAAAAAAAAAAAAAAAAAAAAAAAZpDM
    /2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP8AAAAAAAAAAAAAAAAAAAAA
    AAAAAGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/AAAAAAAAAAAA
    AAAAAAAAAAAAAAAAZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP8A
    AAAAAAAAAAAAAAAAAAAAAAAAAGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQ
    zP9mkMz/AAAAAAAAAAAAAAAAAAAAAAAAAABmkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM
    /2aQzP9mkMz/ZpDM/wAAAAAAAAAAAAAAAAAAAAAAAAAAZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/
    ZpDM/2aQzP9mkMz/ZpDM/2aQzP8AAAAAAAAAAAAAAAAAAAAAAAAAAGaQzMxmkMz/ZpDM/2aQzP9m
    kMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMzMAAAAAAAAAAAAAAAAAAAAAAAAAABmkMxmZpDMzGaQ
    zP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMzMZpDMZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    AAAAAAAA
  `;
  
  // Decode and write favicon
  const faviconBinary = Buffer.from(faviconBase64.replace(/\s/g, ''), 'base64');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Write to multiple possible locations to ensure it's found
  const faviconPaths = [
    path.join(__dirname, 'public', 'favicon.ico'),
    path.join(__dirname, 'client', 'public', 'favicon.ico'),
    path.join(__dirname, 'dist', 'client', 'favicon.ico'),
    path.join(__dirname, 'uploads', 'favicon.ico')
  ];
  
  let faviconCreated = false;
  
  for (const faviconPath of faviconPaths) {
    try {
      // Ensure directory exists
      const dir = path.dirname(faviconPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(faviconPath, faviconBinary);
      console.log(`  ✅ Created static favicon at: ${faviconPath}`);
      faviconCreated = true;
    } catch (error) {
      console.log(`  ⚠️ Could not write favicon to ${faviconPath}: ${error.message}`);
    }
  }
  
  return faviconCreated;
}

// ===== PART 3: PRODUCTION LOGGING MIDDLEWARE =====

function setupProductionLoggingMiddleware() {
  console.log('\n📊 SETTING UP PRODUCTION LOGGING MIDDLEWARE');
  
  // Create the middleware directory if it doesn't exist
  const middlewareDir = path.join(__dirname, 'server', 'middleware');
  if (!fs.existsSync(middlewareDir)) {
    try {
      fs.mkdirSync(middlewareDir, { recursive: true });
      console.log('  ✅ Created middleware directory');
    } catch (error) {
      console.error(`  ❌ Failed to create middleware directory: ${error.message}`);
      return false;
    }
  }
  
  // Content for the production logger middleware
  const productionLoggerContent = `/**
 * Production Logging Middleware
 * 
 * This middleware reduces the verbosity of logs in production while
 * still allowing full logging in development.
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
      /\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
      /^\\/api\\/competitions\\/\\d+\\/active-cart-items$/,
      /^\\/api\\/competitions\\/\\d+\\/ticket-stats$/
    ];
    
    const isRoutineRequest = routePatterns.some(pattern => 
      pattern.test(req.path)
    );
    
    if (!isRoutineRequest) {
      console.log(\`📝 \${req.method} \${req.path}\`);
    }
  } else {
    // In development, log all requests
    console.log(\`📝 \${req.method} \${req.path}\`);
  }
  
  next();
}

export default {
  setupProductionLogger,
  productionRequestLogger
};`;
  
  // JavaScript version (for compiled server)
  const productionLoggerContentJS = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionRequestLogger = exports.setupProductionLogger = void 0;
/**
 * Production Logging Middleware
 * 
 * This middleware reduces the verbosity of logs in production while
 * still allowing full logging in development.
 */
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
function setupProductionLogger() {
    // Only modify logging in production
    if (process.env.NODE_ENV === 'production') {
        console.log('🔇 Setting up production logging - reducing log verbosity');
        // Override console.log to filter out noisy messages
        console.log = function (...args) {
            // Convert arguments to string for pattern testing
            const logString = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            // Check if this log message should be suppressed
            const shouldSuppress = suppressionPatterns.some(pattern => pattern.test(logString));
            // Only output if not suppressed
            if (!shouldSuppress) {
                originalConsole.log(...args);
            }
        };
        // Apply similar filtering to console.info and console.debug
        console.info = function (...args) {
            const logString = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            const shouldSuppress = suppressionPatterns.some(pattern => pattern.test(logString));
            if (!shouldSuppress) {
                originalConsole.info(...args);
            }
        };
        console.debug = function (...args) {
            // Suppress all debug logs in production
            return;
        };
        console.log('🔇 Production logging configured - routine logs suppressed');
    }
}
exports.setupProductionLogger = setupProductionLogger;
// Express middleware to filter request logging
function productionRequestLogger(req, res, next) {
    // Only log requests in production if they're not static assets or common API calls
    if (process.env.NODE_ENV === 'production') {
        const routePatterns = [
            /\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
            /^\\/api\\/competitions\\/\\d+\\/active-cart-items$/,
            /^\\/api\\/competitions\\/\\d+\\/ticket-stats$/
        ];
        const isRoutineRequest = routePatterns.some(pattern => pattern.test(req.path));
        if (!isRoutineRequest) {
            console.log(\`📝 \${req.method} \${req.path}\`);
        }
    }
    else {
        // In development, log all requests
        console.log(\`📝 \${req.method} \${req.path}\`);
    }
    next();
}
exports.productionRequestLogger = productionRequestLogger;
exports.default = {
    setupProductionLogger,
    productionRequestLogger
};`;
  
  // Write the TypeScript version of the middleware
  const tsPath = path.join(middlewareDir, 'production-logger.ts');
  try {
    fs.writeFileSync(tsPath, productionLoggerContent, 'utf8');
    console.log(`  ✅ Created TypeScript middleware at: ${tsPath}`);
  } catch (error) {
    console.error(`  ❌ Failed to create TypeScript middleware: ${error.message}`);
  }
  
  // Also write the JavaScript version for already compiled environments
  const distMiddlewareDir = path.join(__dirname, 'dist', 'server', 'middleware');
  if (!fs.existsSync(distMiddlewareDir)) {
    try {
      fs.mkdirSync(distMiddlewareDir, { recursive: true });
    } catch (error) {
      console.log(`  ⚠️ Could not create dist middleware directory: ${error.message}`);
    }
  }
  
  const jsPath = path.join(distMiddlewareDir, 'production-logger.js');
  try {
    fs.writeFileSync(jsPath, productionLoggerContentJS, 'utf8');
    console.log(`  ✅ Created JavaScript middleware at: ${jsPath}`);
  } catch (error) {
    console.log(`  ⚠️ Could not create JavaScript middleware: ${error.message}`);
  }
  
  // Now try to add the middleware to the server entrypoint

  // Paths to check for server entry file
  const serverFilePaths = [
    path.join(__dirname, 'server', 'index.ts'),
    path.join(__dirname, 'server', 'index.js'),
    path.join(__dirname, 'dist', 'server', 'index.js'),
    path.join(__dirname, 'server-docker.js'),
    path.join(__dirname, 'server-docker.cjs')
  ];

  // Find and update the server file
  let modified = false;
  for (const filePath of serverFilePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`  Found server entry file at: ${filePath}`);
      
      // Read the file content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the middleware is already imported
      if (content.includes('production-logger') || content.includes('productionLogger')) {
        console.log('  Production logger middleware is already installed in this file.');
        continue;
      }
      
      try {
        // Add the import statement for the middleware
        const isTypeScript = filePath.endsWith('.ts');
        const importStatement = isTypeScript
          ? "import productionLogger from './middleware/production-logger';"
          : "const productionLogger = require('./middleware/production-logger').default;";
        
        // Insert the import after other imports
        const importSection = content.indexOf('import ') >= 0 || content.indexOf('require(') >= 0;
        if (importSection) {
          const importRegex = /import.*?;|require\(.*?\)/g;
          const importMatches = [...content.matchAll(importRegex)];
          
          if (importMatches.length > 0) {
            const lastImportMatch = importMatches[importMatches.length - 1];
            const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
            
            content = content.slice(0, insertPosition) + 
              '\n\n// Production logger middleware\n' + 
              importStatement + 
              '\n' + 
              content.slice(insertPosition);
          } else {
            // If no imports found, add at the beginning
            content = 
              '// Production logger middleware\n' +
              importStatement +
              '\n\n' +
              content;
          }
        } else {
          // If no imports found, add at the beginning
          content = 
            '// Production logger middleware\n' +
            importStatement +
            '\n\n' +
            content;
        }
        
        // Add the middleware setup near the beginning of the server setup
        let setupAdded = false;
        
        // Try to find express setup
        const expressSetupIndex = content.indexOf('express()');
        if (expressSetupIndex > 0) {
          const nextSemicolon = content.indexOf(';', expressSetupIndex);
          if (nextSemicolon > 0) {
            content = content.slice(0, nextSemicolon + 1) + 
              '\n\n// Setup production logging to reduce log verbosity\n' +
              'productionLogger.setupProductionLogger();\n' +
              content.slice(nextSemicolon + 1);
            setupAdded = true;
          }
        }
        
        // Try to find app.use statement
        if (!setupAdded) {
          const appUseIndex = content.indexOf('app.use(');
          if (appUseIndex > 0) {
            content = content.slice(0, appUseIndex) + 
              '// Setup production logging to reduce log verbosity\n' +
              'productionLogger.setupProductionLogger();\n\n' +
              '// Add request logging middleware\n' +
              'app.use(productionLogger.productionRequestLogger);\n\n' +
              content.slice(appUseIndex);
            setupAdded = true;
          }
        }
        
        if (setupAdded) {
          // Write the updated content back to the file
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`  ✅ Updated ${filePath} with production logger middleware.`);
          modified = true;
        } else {
          console.log(`  ⚠️ Could not locate suitable position to add middleware in ${filePath}.`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating ${filePath}: ${error.message}`);
      }
    }
  }
  
  if (!modified) {
    console.log('  ⚠️ Could not automatically add middleware to server. You will need to manually import and use the middleware.');
    return false;
  }
  
  return true;
}

// ===== EXECUTE ALL FIXES =====

const fixesApplied = {
  apiErrorHandling: fixApiErrorHandling(),
  faviconLoading: fixFaviconLoadingIssue(),
  loggingMiddleware: setupProductionLoggingMiddleware()
};

// Summary of applied fixes
console.log('\n===========================================');
console.log('📋 PRODUCTION FIXES SUMMARY');
console.log('===========================================');
console.log(`API Error Handling: ${fixesApplied.apiErrorHandling ? '✅ Applied' : '❌ Failed'}`);
console.log(`Favicon Loading: ${fixesApplied.faviconLoading ? '✅ Applied' : '❌ Failed'}`);
console.log(`Logging Middleware: ${fixesApplied.loggingMiddleware ? '✅ Applied' : '❌ Failed'}`);
console.log('===========================================');

if (Object.values(fixesApplied).some(fix => fix)) {
  console.log('\n✅ Some fixes were applied successfully!');
  console.log('⚠️ Please restart your application for the changes to take effect.');
  console.log('👉 For deployment, update your render.yaml or Dockerfile to run this script during build:');
  console.log('   - Add: RUN node fix-production-issues.cjs');
} else {
  console.log('\n❌ No fixes could be applied automatically.');
  console.log('Please check the logs above and consider manual implementation of the fixes.');
}

console.log('\n🚀 Fix process completed!');