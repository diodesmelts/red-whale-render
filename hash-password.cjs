/**
 * Password Hashing Utility Script
 * 
 * This script is used to generate a hashed password for use in the
 * ADMIN_PASSWORD_HASH environment variable. The hashed password can
 * be used directly in the database or as an environment variable.
 * 
 * Usage: 
 *   node hash-password.js <password>
 * 
 * Example:
 *   node hash-password.js MySecurePassword!123
 */

const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

// Password hashing function (same as in server-docker.cjs)
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  // Get password from command line argument
  const password = process.argv[2];
  
  if (!password) {
    console.error('Usage: node hash-password.js <password>');
    console.error('Example: node hash-password.js MySecurePassword!123');
    process.exit(1);
  }
  
  try {
    const hashedPassword = await hashPassword(password);
    
    console.log('\n================= HASHED PASSWORD =================');
    console.log(`Original Password: ${password}`);
    console.log(`Hashed Password: ${hashedPassword}`);
    console.log('\nYou can use this hashed password in two ways:');
    console.log('\n1. Set it as ADMIN_PASSWORD_HASH environment variable:');
    console.log(`   ADMIN_PASSWORD_HASH="${hashedPassword}"`);
    console.log('\n2. Update it directly in the database:');
    console.log(`   UPDATE users SET password = '${hashedPassword}' WHERE username = 'admin';`);
    console.log('===================================================\n');
  } catch (error) {
    console.error('Error generating hashed password:', error);
  }
}

// Run the script
main().catch(console.error);