/**
 * Authentication Diagnostic Script for Render/Production Environment
 * 
 * This script can be used to diagnose authentication issues in the production environment.
 * It logs useful information about the authentication configuration and attempts to validate
 * admin credentials against the current database.
 * 
 * Run with:
 *   node auth-diagnostic.cjs
 */

const pg = require('pg');
const crypto = require('crypto');
const { Client } = pg;

// Password hashing/comparison functions (same as in server-docker.cjs)
async function comparePasswords(supplied, stored) {
  return new Promise((resolve, reject) => {
    const [hashed, salt] = stored.split('.');
    const hashedBuffer = Buffer.from(hashed, 'hex');
    
    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      
      try {
        // Use timingSafeEqual to prevent timing attacks
        const suppliedBuffer = Buffer.from(derivedKey);
        const result = crypto.timingSafeEqual(hashedBuffer, suppliedBuffer);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

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
  console.log('================== AUTH DIAGNOSTIC ==================');
  console.log(`Date/Time: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}`);
  console.log('\n----------- Environment Variables -----------');
  
  // Check DATABASE_URL
  if (process.env.DATABASE_URL) {
    // Mask most of the connection string for security reasons
    const maskedUrl = process.env.DATABASE_URL.replace(
      /^(postgres:\/\/[^:]+:)([^@]+)(@.+)$/,
      '$1****$3'
    );
    console.log(`DATABASE_URL: ${maskedUrl} (present)`);
  } else {
    console.log('DATABASE_URL: ❌ Missing');
  }
  
  // Check ADMIN_PASSWORD
  if (process.env.ADMIN_PASSWORD) {
    console.log(`ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD.charAt(0)}${'*'.repeat(process.env.ADMIN_PASSWORD.length - 2)}${process.env.ADMIN_PASSWORD.charAt(process.env.ADMIN_PASSWORD.length - 1)} (present)`);
  } else {
    console.log('ADMIN_PASSWORD: ❌ Missing');
  }
  
  // Check ADMIN_PASSWORD_HASH
  if (process.env.ADMIN_PASSWORD_HASH) {
    const maskedHash = `${process.env.ADMIN_PASSWORD_HASH.slice(0, 10)}...${process.env.ADMIN_PASSWORD_HASH.slice(-10)}`;
    console.log(`ADMIN_PASSWORD_HASH: ${maskedHash} (present)`);
  } else {
    console.log('ADMIN_PASSWORD_HASH: ❌ Missing');
  }
  
  // Check UPDATE_ADMIN_PASSWORD
  console.log(`UPDATE_ADMIN_PASSWORD: ${process.env.UPDATE_ADMIN_PASSWORD || 'false'}`);
  
  try {
    console.log('\n----------- Database Connection Test -----------');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ Cannot connect to database: DATABASE_URL is not set');
      return;
    }
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    console.log('✅ Successfully connected to database');
    
    console.log('\n----------- Database Schema Validation -----------');
    
    // Check users table
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ "users" table does not exist in the database');
      await client.end();
      return;
    }
    
    console.log('✅ "users" table exists');
    
    // Check users table columns
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log('Users table schema:');
    columnCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check for required columns
    const requiredColumns = ['id', 'username', 'password', 'is_admin'];
    const missingColumns = requiredColumns.filter(col => 
      !columnCheck.rows.some(dbCol => dbCol.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.error(`❌ Missing required columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ All required columns present');
    }
    
    console.log('\n----------- Admin User Check -----------');
    
    // Check for admin user
    const adminCheck = await client.query(`
      SELECT id, username, password, is_admin 
      FROM users 
      WHERE is_admin = TRUE;
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('❌ No admin user found in the database');
      
      // Should we create one?
      if (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH) {
        console.log('📝 Creating admin user...');
        
        let adminPassword;
        
        if (process.env.ADMIN_PASSWORD_HASH) {
          adminPassword = process.env.ADMIN_PASSWORD_HASH;
          console.log('Using pre-hashed admin password from ADMIN_PASSWORD_HASH');
        } else {
          adminPassword = await hashPassword(process.env.ADMIN_PASSWORD);
          console.log('Using hashed version of ADMIN_PASSWORD');
        }
        
        const result = await client.query(`
          INSERT INTO users (
            username, email, password, display_name, 
            mascot, is_admin, notification_settings, created_at
          ) VALUES (
            'admin', 'admin@mobycomps.co.uk', $1, 
            'Admin', 'whale', TRUE, '{"email":true,"inApp":true}', NOW()
          ) RETURNING id, username
        `, [adminPassword]);
        
        console.log(`✅ Admin user created successfully with ID ${result.rows[0].id}`);
      }
    } else {
      console.log(`✅ Found ${adminCheck.rows.length} admin user(s):`);
      adminCheck.rows.forEach(admin => {
        console.log(`  - ID: ${admin.id}, Username: ${admin.username}`);
      });
      
      if (process.env.ADMIN_PASSWORD && process.env.UPDATE_ADMIN_PASSWORD === 'true') {
        console.log('📝 UPDATE_ADMIN_PASSWORD is set to true, updating admin password...');
        
        const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);
        
        for (const admin of adminCheck.rows) {
          await client.query(`
            UPDATE users 
            SET password = $1 
            WHERE id = $2
          `, [hashedPassword, admin.id]);
          
          console.log(`✅ Updated password for admin user: ${admin.username} (ID: ${admin.id})`);
        }
      }
      
      // Test admin password if provided
      if (process.env.ADMIN_PASSWORD) {
        console.log('\n----------- Admin Password Validation -----------');
        
        let anyValid = false;
        
        for (const admin of adminCheck.rows) {
          const isValid = await comparePasswords(
            process.env.ADMIN_PASSWORD,
            admin.password
          );
          
          if (isValid) {
            console.log(`✅ Password is valid for admin user: ${admin.username} (ID: ${admin.id})`);
            anyValid = true;
          } else {
            console.log(`❌ Password is INVALID for admin user: ${admin.username} (ID: ${admin.id})`);
          }
        }
        
        if (!anyValid) {
          console.log('⚠️ The ADMIN_PASSWORD does not match any admin user in the database.');
          console.log('   Consider setting UPDATE_ADMIN_PASSWORD=true to update the admin password.');
        }
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  }
  
  console.log('\n===================================================');
}

// Run the script
diagnoseAuth().catch(console.error);