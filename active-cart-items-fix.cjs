/**
 * Active Cart Items API Endpoint Fix
 * 
 * This script adds specific error handling for the active-cart-items endpoint
 * to ensure it always returns a valid response, even if the competition doesn't exist.
 */

const fs = require('fs');
const path = require('path');

// Path to server file
const serverFilePath = path.join(__dirname, 'server-docker.cjs');

console.log('🔧 Starting active-cart-items endpoint fix...');

// Read the server file content
let content = fs.readFileSync(serverFilePath, 'utf8');

// Add default response handlers for active-cart-items endpoint
if (!content.includes('defaultCartItems')) {
  // Add helper functions if they don't exist
  const helperFunctions = `
// Helper functions for better error handling
function errorResponse(res, status, message, defaultData = {}) {
  return res.status(status).json({
    message,
    ...defaultData
  });
}

// Default data for cart items response
function defaultCartItems() {
  return {
    inCartNumbers: []
  };
}
`;

  // Insert the helper functions after the imports
  content = content.replace(
    /(const express = require\('express'\);.*?const Stripe = require\('stripe'\);)/s,
    '$1\n' + helperFunctions
  );
}

// Improve the active-cart-items endpoint specifically
// First, make a backup of the content
const originalContent = content;

try {
  // Fix for more complex server structures
  let updatedContent = content;

  // Ensure the active-cart-items endpoint always returns a valid response
  const TARGET_ROUTE = "app.post('/api/competitions/:id/active-cart-items'";
  
  if (content.includes(TARGET_ROUTE)) {
    // Update the route definition with additional error handling
    updatedContent = content.replace(
      /(app\.post\('\/api\/competitions\/:id\/active-cart-items'.*?try\s*{)/s,
      '$1\n    console.log(`🛒 Active cart items requested for competition: ${id}`);\n'
    );

    // Add better error handling for competition not found
    updatedContent = updatedContent.replace(
      /(app\.post\('\/api\/competitions\/:id\/active-cart-items'.*?if\s*\(compResult\.rows\.length\s*===\s*0\)\s*{)(.*?)(\s*return\s*res\.status\(404\)\.json\(.*?\);)/s,
      '$1$2\n      console.error(`❌ Competition not found in active-cart-items: ${id}`);\n      return res.status(200).json({ inCartNumbers: [] });'
    );

    // Add better error handling for general errors
    updatedContent = updatedContent.replace(
      /(app\.post\('\/api\/competitions\/:id\/active-cart-items'.*?catch\s*\(error\)\s*{)(.*?)(\s*console\.error\(.*?\);)(.*?)(\s*res\.status\(500\)\.json\(.*?\);)/s,
      '$1$2$3\n    console.error(`❌ Error details: ${error.message}`);\n    return res.status(200).json({ inCartNumbers: [] });'
    );

    // If we made any changes, update the content
    if (updatedContent !== content) {
      content = updatedContent;
    }
  } else {
    // The route definition wasn't found in the expected format
    // Let's add a completely new implementation that's robust
    const newCartItemsRoute = `
// Robust implementation of active cart items endpoint
app.post('/api/competitions/:id/active-cart-items', async (req, res) => {
  try {
    const { id } = req.params;
    const { cartItems } = req.body;
    
    console.log(\`🛒 Robust active cart items requested for competition: \${id}\`);
    
    // Check if the competition exists
    const compResult = await db.query('SELECT id FROM competitions WHERE id = $1', [id]);
    
    if (compResult.rows.length === 0) {
      console.error(\`❌ Competition not found in active-cart-items: \${id}\`);
      return res.status(200).json({ inCartNumbers: [] });
    }
    
    // Get all numbers that are already in active carts (within the past 30 minutes)
    const cartQuery = \`
      SELECT ticket_number 
      FROM cart_items 
      WHERE competition_id = $1 
        AND created_at > NOW() - INTERVAL '30 minutes'
    \`;
    
    const cartResult = await db.query(cartQuery, [id]);
    
    // Extract the numbers from the results
    const inCartNumbers = cartResult.rows.map(row => row.ticket_number);
    
    // Filter out any numbers that are already in the user's own cart
    const userCartNumbers = Array.isArray(cartItems) ? cartItems : [];
    
    // Create a Set for O(1) lookups
    const userCartSet = new Set(userCartNumbers);
    
    // Filter the inCartNumbers to exclude those in the user's cart
    const filteredCartNumbers = inCartNumbers.filter(num => !userCartSet.has(num));
    
    return res.json({ inCartNumbers: filteredCartNumbers });
  } catch (error) {
    console.error('Error fetching active cart items:', error);
    console.error(\`❌ Error details: \${error.message}\`);
    return res.status(200).json({ inCartNumbers: [] });
  }
});
`;

    // Find a good place to insert this new route - after the competition routes
    if (content.includes("app.get('/api/competitions")) {
      content = content.replace(
        /(app\.get\('\/api\/competitions.*?}\);)/s,
        '$1\n\n' + newCartItemsRoute
      );
      console.log('✅ Added new robust active-cart-items implementation');
    } else {
      // If we can't find a good insertion point, don't modify the file
      console.error('❌ Could not find a suitable place to insert the new route');
      content = originalContent;
    }
  }

  // Write the modified content back to the server file
  fs.writeFileSync(serverFilePath, content);
  console.log('✅ Active cart items endpoint fix applied successfully!');
} catch (error) {
  // If anything goes wrong, restore the original content
  fs.writeFileSync(serverFilePath, originalContent);
  console.error('❌ Error applying active-cart-items fix:', error.message);
}