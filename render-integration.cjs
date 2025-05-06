/**
 * Render Integration Script
 * 
 * This script coordinates all the necessary fixes for the Render production environment
 * in a single file that can be executed during the deployment process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Render integration process...');

// Execute each fix script in sequence
const fixScripts = [
  'production-direct-fix.cjs',
  'render-endpoint-fixes.cjs',
  'active-cart-items-fix.cjs'
];

try {
  // Make sure server-docker.cjs exists
  if (!fs.existsSync('server-docker.cjs')) {
    console.error('❌ server-docker.cjs not found! Aborting integration.');
    process.exit(1);
  }
  
  console.log('✅ Found server-docker.cjs');
  
  // Execute each fix script
  for (const script of fixScripts) {
    if (fs.existsSync(script)) {
      console.log(`🔧 Executing ${script}...`);
      require(`./${script}`);
      console.log(`✅ ${script} completed successfully`);
    } else {
      console.warn(`⚠️ ${script} not found, skipping...`);
    }
  }
  
  // Add a final verification to ensure the endpoints are properly set up
  const serverContent = fs.readFileSync('server-docker.cjs', 'utf8');
  
  const activeCartItemsEndpoint = serverContent.includes('/api/competitions/:id/active-cart-items');
  const ticketStatsEndpoint = serverContent.includes('/api/competitions/:id/ticket-stats');
  
  console.log('🔍 Verification results:');
  console.log(`- Active cart items endpoint: ${activeCartItemsEndpoint ? '✅ Present' : '❌ Missing'}`);
  console.log(`- Ticket stats endpoint: ${ticketStatsEndpoint ? '✅ Present' : '❌ Missing'}`);
  
  if (!activeCartItemsEndpoint || !ticketStatsEndpoint) {
    console.warn('⚠️ Some endpoints may be missing. Check server-docker.cjs manually.');
  } else {
    console.log('✅ All required endpoints are present in server-docker.cjs');
  }
  
  console.log('🎉 Render integration process completed successfully!');
} catch (error) {
  console.error('❌ Error during integration process:', error);
  process.exit(1);
}