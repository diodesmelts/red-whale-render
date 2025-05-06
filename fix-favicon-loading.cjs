/**
 * Favicon Loading and Excessive Logging Fix for Production
 * 
 * This script addresses two critical issues in the production environment:
 * 1. The browser favicon showing a permanent loading state
 * 2. Excessive logging filling up server logs
 * 
 * Usage:
 * - Add to Dockerfile: RUN node fix-favicon-loading.cjs
 * - Include in render.yaml build steps
 * - Or run manually: node fix-favicon-loading.cjs
 */

const fs = require('fs');
const path = require('path');

// Find and update client-side code to fix favicon loading issue
function fixFaviconLoadingIssue() {
  console.log('Fixing favicon loading issue...');
  
  // Paths to check for App.tsx or index.html
  const possiblePaths = [
    path.join(__dirname, 'client', 'src', 'App.tsx'),
    path.join(__dirname, 'client', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'dist', 'client', 'index.html')
  ];
  
  let modified = false;
  
  // Try to find and update the favicon reference in any of these files
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Checking file: ${filePath}`);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Different patterns to search for based on file type
      if (filePath.endsWith('.html')) {
        // Check if there's a favicon link tag that might be causing issues
        if (content.includes('<link rel="icon"') || content.includes('<link rel="shortcut icon"')) {
          // Replace dynamic favicon with a static one
          content = content.replace(
            /<link rel="(shortcut icon|icon)"[^>]*>/,
            '<link rel="icon" href="/favicon.ico" type="image/x-icon">'
          );
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated favicon in ${filePath}`);
          modified = true;
        }
      } else if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        // Check for React Helmet or similar that might be setting the favicon
        if (content.includes('favicon') && (content.includes('<Helmet') || content.includes('<Head'))) {
          // Make the change appropriately for React code
          content = content.replace(
            /<link[^>]*favicon[^>]*>/,
            '<link rel="icon" href="/favicon.ico" type="image/x-icon" />'
          );
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated favicon in ${filePath}`);
          modified = true;
        }
      }
    }
  }
  
  if (!modified) {
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
    
    // Write to multiple possible locations to ensure it's found
    const faviconPaths = [
      path.join(__dirname, 'public', 'favicon.ico'),
      path.join(__dirname, 'client', 'public', 'favicon.ico'),
      path.join(__dirname, 'dist', 'client', 'favicon.ico')
    ];
    
    for (const faviconPath of faviconPaths) {
      try {
        // Ensure directory exists
        const dir = path.dirname(faviconPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(faviconPath, faviconBinary);
        console.log(`Created static favicon at: ${faviconPath}`);
      } catch (error) {
        console.log(`Could not write favicon to ${faviconPath}: ${error.message}`);
      }
    }
  }
}

// Reduce excessive logging in routes.ts and other server files
function reduceExcessiveLogging() {
  console.log('Reducing excessive logging...');
  
  // Paths to check for server code that might have excessive logging
  const serverFilePaths = [
    path.join(__dirname, 'server', 'routes.ts'),
    path.join(__dirname, 'server', 'admin-routes.ts'),
    path.join(__dirname, 'dist', 'server', 'routes.js'),
    path.join(__dirname, 'dist', 'server', 'admin-routes.js')
  ];
  
  for (const filePath of serverFilePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Checking logging in: ${filePath}`);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalSize = content.length;
      
      // Regular console.log statements related to standard operations
      const standardLogPatterns = [
        /console\.log\([`'"]🛒 Requesting active cart items[^)]*\);/g,
        /console\.log\([`'"]📊 Request to get ticket statistics[^)]*\);/g,
        /console\.log\([`'"]🔍 Request to GET[^)]*\);/g,
        /console\.log\([`'"]🔍 Request to POST[^)]*\);/g,
        /console\.log\([`'"]🔄 CORS request[^)]*\);/g,
        /console\.log\([`'"]✅ User deserialized successfully[^)]*\);/g,
        /console\.log\([`'"]🔍 Deserializing user[^)]*\);/g
      ];
      
      // Only log in production if it's a warning, error, or critical info
      for (const pattern of standardLogPatterns) {
        content = content.replace(pattern, 
          `if (process.env.NODE_ENV !== 'production') { $& }`
        );
      }
      
      // Write back if changes were made
      if (content.length !== originalSize) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Reduced logging in ${filePath}: ${originalSize - content.length} bytes saved`);
      }
    }
  }
  
  // Check for any custom logging middlewares
  const indexPaths = [
    path.join(__dirname, 'server', 'index.ts'),
    path.join(__dirname, 'dist', 'server', 'index.js')
  ];
  
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Checking logging middleware in: ${indexPath}`);
      let content = fs.readFileSync(indexPath, 'utf8');
      
      // If morgan or similar logging middleware is used, make it conditional
      if (content.includes('morgan') || content.includes('app.use') && content.includes('logger')) {
        content = content.replace(
          /(app\.use\([^)]*morgan[^)]*\))/g,
          `if (process.env.NODE_ENV !== 'production') { $1 }`
        );
        
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log(`Updated logging middleware in ${indexPath}`);
      }
    }
  }
}

// Execute the fixes
fixFaviconLoadingIssue();
reduceExcessiveLogging();

console.log('Favicon and logging fixes applied successfully!');
console.log('Remember to rebuild and restart the application for changes to take effect.');