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

import crypto from 'crypto';

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function main() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('Error: Password argument is required');
    console.log('\nUsage:');
    console.log('  node hash-password.js <password>');
    console.log('\nExample:');
    console.log('  node hash-password.js MySecurePassword!123');
    process.exit(1);
  }
  
  try {
    const hashedPassword = await hashPassword(password);
    console.log('\nPassword Hash:');
    console.log(hashedPassword);
    console.log('\nInstructions:');
    console.log('1. Add this hash as the ADMIN_PASSWORD_HASH environment variable in your production environment.');
    console.log('2. Do not share this hash with anyone.');
    console.log('3. Store it securely in your production environment secrets.');
  } catch (error) {
    console.error('Error generating password hash:', error);
    process.exit(1);
  }
}

main().catch(console.error);