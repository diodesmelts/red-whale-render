import crypto from 'crypto';
import { promisify } from 'util';

const { scrypt, randomBytes } = crypto;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

hashPassword('Admin123!').then(hashed => console.log(hashed));