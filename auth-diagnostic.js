/**
 * Authentication Diagnostic Script for Render/Production Environment
 * 
 * This script can be used to diagnose authentication issues in the production environment.
 * It logs useful information about the authentication configuration and attempts to validate
 * admin credentials against the current database.
 */

import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

// Password comparison function (same as in server-docker.cjs)
async function comparePasswords(supplied, stored) {
  return new Promise((resolve, reject) => {
    const [hashed, salt] = stored.split('.');
    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(
        Buffer.from(hashed, 'hex'),
        derivedKey
      ));
    });
  });
}

// Hash password function (same as in server-docker.cjs)
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function diagnoseAuth() {
  console.log('============ AUTH DIAGNOSTIC REPORT ============');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    RENDER_SERVICE_ID: process.env.RENDER_SERVICE_ID || 'not set',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'set (hidden)' : 'not set', 
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'set (hidden)' : 'not set',
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? 'set (hidden)' : 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set (hidden)' : 'not set'
  });

  try {
    // Connect to the database
    console.log('\nAttempting database connection...');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    console.log('✅ Database connection successful');

    // Check if users table exists
    console.log('\nChecking if users table exists...');
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    if (tables.length === 0) {
      console.log('❌ Users table does not exist');
      await client.end();
      return;
    }
    console.log('✅ Users table exists');

    // Check if admin user exists
    console.log('\nChecking for admin user...');
    const { rows: adminUsers } = await client.query(`
      SELECT id, username, password, is_admin
      FROM users 
      WHERE is_admin = TRUE
    `);

    if (adminUsers.length === 0) {
      console.log('❌ No admin user found in the database');
      
      // Create an admin user if requested
      if (process.env.CREATE_ADMIN === 'true') {
        console.log('\nCreating admin user...');
        
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        const hashedPassword = await hashPassword(adminPassword);
        
        await client.query(`
          INSERT INTO users (
            username, email, password, display_name, 
            mascot, is_admin
          ) VALUES (
            'admin', 'admin@mobycomps.co.uk', $1, 
            'Admin', 'whale', TRUE
          )
        `, [hashedPassword]);
        
        console.log('✅ Admin user created');
      }
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s)`);
      
      // Test admin login if ADMIN_PASSWORD is set
      if (process.env.ADMIN_PASSWORD) {
        console.log('\nTesting admin login with ADMIN_PASSWORD...');
        const adminUser = adminUsers[0];
        const passwordValid = await comparePasswords(process.env.ADMIN_PASSWORD, adminUser.password);
        
        if (passwordValid) {
          console.log('✅ Admin password valid');
        } else {
          console.log('❌ Admin password invalid');
          
          // Print the admin password hash for reference
          console.log('\nExisting Admin Password Hash:', adminUser.password);
          
          // Generate a new hash for the admin password
          const newHashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);
          console.log(`\nNew hash for "${process.env.ADMIN_PASSWORD}":`, newHashedPassword);
          
          if (process.env.UPDATE_ADMIN_PASSWORD === 'true') {
            console.log('\nUpdating admin password...');
            await client.query(`
              UPDATE users
              SET password = $1
              WHERE id = $2
            `, [newHashedPassword, adminUser.id]);
            console.log('✅ Admin password updated');
          }
        }
      }
    }

    // Close the database connection
    await client.end();
    console.log('\n✅ Diagnostic complete');
    
  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error);
  }
  
  console.log('=============================================');
}

// Run the diagnostic
diagnoseAuth().catch(console.error);