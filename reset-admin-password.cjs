/**
 * Admin Password Reset Script
 * 
 * This script connects directly to the database and resets the admin
 * password to the value in the ADMIN_PASSWORD environment variable.
 * Use this on the production environment to fix login issues.
 * 
 * Run with:
 *   node reset-admin-password.js
 */

const pg = require('pg');
const crypto = require('crypto');

const { Client } = pg;

// Password hashing function (same as in server-docker.cjs)
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function resetAdminPassword() {
  console.log('============ ADMIN PASSWORD RESET ============');
  
  // Validate that we have the required environment variables
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable is not set');
    console.log('Please set this variable and run the script again.');
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    console.log('Please set this variable and run the script again.');
    process.exit(1);
  }
  
  console.log('Environment variables check: ✅');
  
  try {
    // Connect to the database
    console.log('\nConnecting to database...');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    console.log('Database connection: ✅');
    
    // Find the admin user
    console.log('\nLooking for admin user...');
    const { rows } = await client.query(
      'SELECT id, username FROM users WHERE is_admin = TRUE'
    );
    
    if (rows.length === 0) {
      console.log('❌ No admin user found. Creating one...');
      
      // Hash the password
      const hashedPassword = await hashPassword(adminPassword);
      
      // Create admin user
      const result = await client.query(`
        INSERT INTO users (
          username, email, password, display_name, 
          mascot, is_admin, notification_settings, created_at
        ) VALUES (
          'admin', 'admin@mobycomps.co.uk', $1, 
          'Admin', 'whale', TRUE, '{"email":true,"inApp":true}', NOW()
        ) RETURNING id, username
      `, [hashedPassword]);
      
      console.log(`✅ Admin user created successfully with ID ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log('   Password: [set from ADMIN_PASSWORD]');
    } else {
      console.log(`✅ Found admin user: ${rows[0].username} (ID: ${rows[0].id})`);
      
      // Hash the password
      const hashedPassword = await hashPassword(adminPassword);
      
      // Update the admin user's password
      await client.query(`
        UPDATE users 
        SET password = $1 
        WHERE id = $2
      `, [hashedPassword, rows[0].id]);
      
      console.log('✅ Admin password updated successfully');
    }
    
    // Close the database connection
    await client.end();
    console.log('\n✅ Password reset complete');
    console.log('\nYou can now log in with:');
    console.log('   Username: admin');
    console.log('   Password: [value from ADMIN_PASSWORD]');
    
  } catch (error) {
    console.error('\n❌ Error during password reset:', error);
  }
  
  console.log('=============================================');
}

// Run the script
resetAdminPassword().catch(console.error);