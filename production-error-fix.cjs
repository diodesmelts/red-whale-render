/**
 * Production Error Handling Fix for Docker Environment
 * 
 * This script adds specialized error handling to address issues with competition
 * endpoints in the Docker/production environment.
 * 
 * Usage:
 * - Add to Dockerfile: RUN node production-error-fix.cjs
 * - Include in render.yaml build steps
 * - Or run manually: node production-error-fix.cjs
 */

const fs = require('fs');
const path = require('path');

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
  console.error('Could not locate routes file. Aborting.');
  process.exit(1);
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
    console.log('Successfully updated ticket stats error handling.');
  } else {
    console.log('Could not locate ticket stats error handler pattern. Skipping.');
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
    
    console.log('Successfully updated active cart items error handling.');
  } else {
    console.log('Could not locate active cart items handler pattern. Skipping.');
  }
  
  return content;
}

// Apply the error handling fixes
content = addTicketStatsErrorHandling(content);
content = addActiveCartItemsErrorHandling(content);

// Write the updated content back to the file
fs.writeFileSync(routesFilePath, content, 'utf8');
console.log(`Successfully updated routes file at: ${routesFilePath}`);

console.log('Production error handling fixes applied successfully!');
console.log('Remember to restart the server for changes to take effect.');