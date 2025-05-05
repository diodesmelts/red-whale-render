/**
 * Special authentication handler for admin users
 * 
 * This patch adds a special authentication path for admin users
 * that uses environment variables instead of database credentials.
 */

const fs = require('fs');
const path = require('path');

// Path to server-docker.cjs
const serverDockerPath = path.join(process.cwd(), 'server-docker.cjs');

// Get the content of server-docker.cjs
const serverDockerContent = fs.readFileSync(serverDockerPath, 'utf8');

// Find the authentication strategy code
const localStrategyPattern = /passport\.use\(new LocalStrategy\(async \(username, password, done\) => \{(.+?)\}\)\);/s;
const localStrategyMatch = serverDockerContent.match(localStrategyPattern);

if (!localStrategyMatch) {
  console.error('❌ Could not find LocalStrategy in server-docker.cjs');
  process.exit(1);
}

// Create the modified strategy with admin environment variable check
const originalStrategy = localStrategyMatch[0];
const modifiedStrategy = `passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    console.log(\`🔍 Authenticating user: \${username}\`);
    
    // Special handling for admin user using environment variables
    if (username === 'admin' || 
        (process.env.ADMIN_USERNAME && username === process.env.ADMIN_USERNAME)) {
      
      // Check against environment variable password first
      if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
        console.log('✅ Admin authenticated via environment variables');
        
        // Check what columns exist in the users table
        const columnsQuery = \`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users'
          AND column_name IN ('is_banned', 'stripe_customer_id');
        \`;
        
        const columnsCheck = await pool.query(columnsQuery);
        const existingColumns = columnsCheck.rows.map(row => row.column_name);
        
        const isBannedColumnExists = existingColumns.includes('is_banned');
        const stripeCustomerIdColumnExists = existingColumns.includes('stripe_customer_id');
        
        // Get the admin user from database or create minimal profile if needed
        const { rows } = await pool.query(\`
          SELECT id, username, email, password, display_name as "displayName", 
            mascot, is_admin as "isAdmin", notification_settings as "notificationSettings", 
            created_at as "createdAt"
            ${isBannedColumnExists ? ', is_banned as "isBanned"' : ''}
            ${stripeCustomerIdColumnExists ? ', stripe_customer_id as "stripeCustomerId"' : ''}
          FROM users WHERE is_admin = TRUE AND (username = $1 
            ${process.env.ADMIN_USERNAME ? 'OR username = $2' : ''})
          LIMIT 1
        \`, process.env.ADMIN_USERNAME ? [username, process.env.ADMIN_USERNAME] : [username]);
        
        if (rows.length > 0) {
          // Use existing admin user
          let user = rows[0];
          
          // Set default values for missing columns
          if (!isBannedColumnExists || user.isBanned === undefined) {
            user.isBanned = false;
          }
          
          if (!stripeCustomerIdColumnExists || user.stripeCustomerId === undefined) {
            user.stripeCustomerId = null;
          }
          
          return done(null, user);
        } else {
          // If admin user doesn't exist in database, create a minimal profile
          console.log('⚠️ Admin user not found in database, using minimal profile');
          const minimalAdmin = {
            id: -1, // Special ID to indicate this is a virtual admin
            username: username,
            email: 'admin@mobycomps.co.uk',
            displayName: 'Admin',
            mascot: 'whale',
            isAdmin: true,
            isBanned: false,
            stripeCustomerId: null,
            notificationSettings: { email: true, inApp: true },
            createdAt: new Date()
          };
          return done(null, minimalAdmin);
        }
      }
    }
    
    // Continue with regular database authentication for non-admin users
    // or if admin environment variables didn't match
    ${localStrategyMatch[1]}
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return done(error);
  }
}));`;

// Replace the strategy in the content
const updatedServerDockerContent = serverDockerContent.replace(originalStrategy, modifiedStrategy);

// Write the updated content back to the file
fs.writeFileSync(serverDockerPath, updatedServerDockerContent, 'utf8');

console.log('✅ Admin authentication fix applied to server-docker.cjs');
console.log('');
console.log('This patch adds a special authentication path that allows');
console.log('admin login using ADMIN_USERNAME and ADMIN_PASSWORD environment');
console.log('variables, bypassing the database password check for admin users.');
console.log('');
console.log('Please restart your server for the changes to take effect.');