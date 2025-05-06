/**
 * Production Middleware Installation Script
 * 
 * This script adds the production logger middleware to your server/index.ts file
 * to reduce excessive logging in production without requiring a full rebuild.
 */

const fs = require('fs');
const path = require('path');

// Paths to check for server entry file
const serverFilePaths = [
  path.join(__dirname, 'server', 'index.ts'),
  path.join(__dirname, 'server', 'index.js'),
  path.join(__dirname, 'dist', 'server', 'index.js')
];

// Find and update the server file
let modified = false;
for (const filePath of serverFilePaths) {
  if (fs.existsSync(filePath)) {
    console.log(`Found server entry file at: ${filePath}`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the middleware is already imported
    if (content.includes('production-logger') || content.includes('productionLogger')) {
      console.log('Production logger middleware is already installed.');
      continue;
    }
    
    // Add the import statement for the middleware
    const isTypeScript = filePath.endsWith('.ts');
    const importStatement = isTypeScript
      ? "import productionLogger from './middleware/production-logger';"
      : "const productionLogger = require('./middleware/production-logger').default;";
    
    // Insert the import after other imports
    const importRegex = /import.*?;|require\(.*?\)/g;
    const lastImportMatch = [...content.matchAll(importRegex)].pop();
    
    if (lastImportMatch) {
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
    
    // Add the middleware setup before the app.use statements
    const appUseRegex = /app\.use\(/;
    const appUseMatch = content.match(appUseRegex);
    
    if (appUseMatch) {
      const insertPosition = appUseMatch.index;
      content = content.slice(0, insertPosition) + 
        '// Setup production logging to reduce log verbosity\n' +
        'productionLogger.setupProductionLogger();\n\n' +
        '// Add request logging middleware\n' +
        'app.use(productionLogger.productionRequestLogger);\n\n' +
        content.slice(insertPosition);
    } else {
      console.log('Could not find app.use() in the server file to add middleware.');
      continue;
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath} with production logger middleware.`);
    modified = true;
  }
}

if (!modified) {
  console.log('Could not locate server entry file. No changes were made.');
  process.exit(1);
}

console.log('Production middleware installation complete!');
console.log('Restart the server for the changes to take effect.');