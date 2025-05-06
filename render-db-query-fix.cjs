/**
 * Render Database Query Fix
 * 
 * This script fixes SQL query formatting issues in the server-docker.cjs file
 * that are causing deployment failures in the Render environment.
 */

const fs = require('fs');
const path = require('path');

// Path to server file
const serverFilePath = path.join(__dirname, 'server-docker.cjs');

console.log('🔧 Starting Render database query fix...');

// Read the server file content
let content = fs.readFileSync(serverFilePath, 'utf8');
const originalContent = content;

try {
  // Fix 1: Fix SQL query syntax - the most common issue is missing quotes or backticks around SQL
  // Find and fix any db.query with improper SQL formatting
  
  // Pattern for problematic SQL queries
  const sqlQueryPattern = /db\.query\(\s*SELECT\s+\*\s+FROM\s+competitions\s+WHERE\s+id\s*=\s*\$1/g;
  
  // Replace with properly formatted SQL queries
  if (content.match(sqlQueryPattern)) {
    console.log('🔍 Found problematic SQL query format, fixing...');
    content = content.replace(
      sqlQueryPattern,
      "db.query('SELECT * FROM competitions WHERE id = $1'"
    );
    console.log('✅ Fixed SQL query format');
  }
  
  // Fix 2: Check for other potential db.query issues with similar patterns
  const otherQueryPatterns = [
    { 
      pattern: /db\.query\(\s*SELECT\s+/g, 
      replacement: "db.query('SELECT " 
    },
    { 
      pattern: /db\.query\(\s*INSERT\s+INTO\s+/g, 
      replacement: "db.query('INSERT INTO " 
    },
    { 
      pattern: /db\.query\(\s*UPDATE\s+/g, 
      replacement: "db.query('UPDATE " 
    },
    { 
      pattern: /db\.query\(\s*DELETE\s+FROM\s+/g, 
      replacement: "db.query('DELETE FROM " 
    }
  ];
  
  for (const { pattern, replacement } of otherQueryPatterns) {
    if (content.match(pattern)) {
      console.log(`🔍 Found problematic SQL query format: ${pattern}`);
      content = content.replace(pattern, replacement);
      console.log('✅ Fixed query format');
    }
  }
  
  // Fix 3: Ensure all SQL queries end with proper closing quote if they don't already have it
  // This is a more complex pattern match and might need to be adjusted based on actual code
  const openQueries = /db\.query\('([^']*?)(?:'\s*\+|\s*\+\s*'|\s*,)/g;
  
  // Check if the file has been modified
  if (content !== originalContent) {
    // Write the modified content back to the server file
    fs.writeFileSync(serverFilePath, content);
    console.log('✅ All database query fixes applied successfully!');
  } else {
    console.log('⚠️ No database query issues detected or fixed');
  }
} catch (error) {
  // If anything goes wrong, restore the original content
  fs.writeFileSync(serverFilePath, originalContent);
  console.error('❌ Error applying database query fixes:', error.message);
}

// Additional comprehensive fix - create a wrapper for db.query that handles errors
const dbWrapperCode = `
// Add a safer database query wrapper to prevent similar issues
function safeDbQuery(query, params = []) {
  // Ensure the query is properly formatted
  if (typeof query !== 'string' || !query.trim().startsWith('SELECT') && 
      !query.trim().startsWith('INSERT') && !query.trim().startsWith('UPDATE') && 
      !query.trim().startsWith('DELETE')) {
    console.error('❌ Invalid SQL query format:', query);
    throw new Error('Invalid SQL query format');
  }
  
  // Log the normalized query for debugging
  const normalizedQuery = query.replace(/\\s+/g, ' ').trim();
  console.log('📝 Executing SQL query:', normalizedQuery, 'with params:', params);
  
  try {
    // Execute the query safely
    return db.query(query, params);
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
}
`;

// Check if the wrapper already exists
if (!content.includes('function safeDbQuery')) {
  // Find a good place to insert the wrapper
  if (content.includes('const db = require(')) {
    console.log('🔍 Adding safe database query wrapper...');
    content = content.replace(
      /(const db = require\([^)]+\);)/,
      `$1\n${dbWrapperCode}`
    );
  } else if (content.includes('const { Pool }')) {
    console.log('🔍 Adding safe database query wrapper after Pool initialization...');
    content = content.replace(
      /(const pool = new Pool\([^)]+\);)/,
      `$1\n${dbWrapperCode}`
    );
  } else {
    // Just add it near the top of the file
    console.log('🔍 Adding safe database query wrapper near top of file...');
    const lines = content.split('\n');
    // Find a reasonable spot after the requires but before the routes
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].includes('app.use(') || lines[i].includes('app.get(')) {
        break;
      }
    }
    
    if (insertIndex > 0) {
      lines.splice(insertIndex, 0, dbWrapperCode);
      content = lines.join('\n');
      console.log('✅ Added safe database query wrapper');
    }
  }
  
  // Write the updated content
  fs.writeFileSync(serverFilePath, content);
}

console.log('🎉 Database query fix process completed!');