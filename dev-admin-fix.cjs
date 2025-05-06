/**
 * Script to update the admin user password in the database for development environment
 * This ensures the admin user can log in without relying on environment variables
 */
const { Pool } = require('pg');
const crypto = require('crypto');

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function fixAdminPassword() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking for admin user in database...');
    
    // Check if admin user exists
    const { rows } = await pool.query(
      `SELECT id, username, password, is_admin
      FROM users
      WHERE username = 'admin' AND is_admin = TRUE
      LIMIT 1`
    );
    
    const adminPassword = 'admin123';
    const hashedPassword = await hashPassword(adminPassword);
    
    if (rows.length === 0) {
      // Create admin user if it doesn't exist
      console.log('⚠️ Admin user not found, creating one...');
      
      await pool.query(`
        INSERT INTO users (
          username, email, password, display_name, 
          mascot, is_admin, notification_settings, created_at
        ) VALUES (
          'admin', 'admin@mobycomps.co.uk', $1, 
          'Administrator', 'whale', TRUE, '{"email":true,"inApp":true}', NOW()
        )
      `, [hashedPassword]);
      
      console.log('✅ Admin user created successfully!');
    } else {
      // Update admin user password
      console.log('🔄 Updating admin user password...');
      
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE id = $2
      `, [hashedPassword, rows[0].id]);
      
      console.log(`✅ Admin password updated successfully for user ID: ${rows[0].id}`);
    }
    
    console.log('\n✨ You should now be able to login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error occurred:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
fixAdminPassword().catch(console.error);