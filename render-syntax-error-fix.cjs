/**
 * Render Syntax Error Fix
 * 
 * This script fixes a critical syntax error found in the server-docker.cjs file
 * that was causing deployment failures in the Render environment.
 */

const fs = require('fs');
const path = require('path');

// Path to server file
const serverFilePath = path.join(__dirname, 'server-docker.cjs');

console.log('🚨 Starting critical syntax error fix...');

// Read the server file content
let content = fs.readFileSync(serverFilePath, 'utf8');
const originalContent = content;

try {
  // Search for the syntax error: mismatched quotes in SQL query
  const brokenQuery = "await db.query('SELECT * FROM competitions WHERE id = app.get('/api/competitions',";
  
  if (content.includes(brokenQuery)) {
    console.log('🔍 Found critical syntax error in SQL query, fixing...');
    
    // Replace with the correct SQL query
    content = content.replace(
      brokenQuery,
      "await db.query('SELECT * FROM competitions WHERE id = $1'"
    );
    
    console.log('✅ Fixed critical syntax error');
    
    // Write the fixed content back to the server file
    fs.writeFileSync(serverFilePath, content);
    console.log('💾 Saved fixed server file');
  } else {
    console.log('🔍 Could not find the exact syntax error pattern.');
    
    // Try a more general approach to find and fix SQL queries with potential syntax issues
    const potentialErrorLines = [
      { 
        pattern: /db\.query\('SELECT \* FROM competitions WHERE id = .*?app\.get\('\/api\/competitions',/g,
        replacement: "db.query('SELECT * FROM competitions WHERE id = $1'"
      },
      {
        pattern: /db\.query\('SELECT \* FROM .*?id = .*?app\.get\(/g,
        replacement: "db.query('SELECT * FROM competitions WHERE id = $1'"
      }
    ];
    
    let fixedAny = false;
    
    for (const { pattern, replacement } of potentialErrorLines) {
      if (content.match(pattern)) {
        console.log(`🔍 Found potential syntax error using pattern: ${pattern}`);
        content = content.replace(pattern, replacement);
        fixedAny = true;
      }
    }
    
    // Look for any db.query with broken quoting patterns
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('db.query(') && line.includes("app.get('/api/competitions")) {
        console.log(`🔍 Found suspicious db.query on line ${i + 1}`);
        lines[i] = "      const competition = await db.query('SELECT * FROM competitions WHERE id = $1', [competitionId]);";
        fixedAny = true;
      }
    }
    
    if (fixedAny) {
      content = lines.join('\n');
      fs.writeFileSync(serverFilePath, content);
      console.log('✅ Fixed potential syntax errors with SQL queries');
    } else {
      // If we still haven't found it, just do a direct replacement of line 425
      console.log('⚠️ Using fallback approach: replacing line 425 directly');
      
      // Read the file line by line
      const allLines = content.split('\n');
      
      // Find the right line near 425
      let targetLine = -1;
      for (let i = 420; i < 430 && i < allLines.length; i++) {
        if (allLines[i].includes('db.query') && allLines[i].includes('competitions') && allLines[i].includes('WHERE id')) {
          targetLine = i;
          break;
        }
      }
      
      if (targetLine !== -1) {
        console.log(`🔍 Found target SQL query on line ${targetLine + 1}`);
        allLines[targetLine] = "      const competition = await db.query('SELECT * FROM competitions WHERE id = $1', [competitionId]);";
        content = allLines.join('\n');
        fs.writeFileSync(serverFilePath, content);
        console.log('✅ Fixed syntax error by direct line replacement');
      } else {
        console.warn('⚠️ Could not find the syntax error, attempting full regex-based search...');
        
        // Try a regex to find any broken SQL query with interpolation issues
        const brokenSqlRegex = /db\.query\(\s*'[^']*'\s*\+|db\.query\(\s*'[^']*app\.get\(/g;
        if (content.match(brokenSqlRegex)) {
          content = content.replace(
            brokenSqlRegex,
            "db.query('SELECT * FROM competitions WHERE id = $1'"
          );
          fs.writeFileSync(serverFilePath, content);
          console.log('✅ Fixed syntax error with regex-based approach');
        } else {
          console.error('❌ Could not locate the syntax error with any method');
          throw new Error('Could not fix syntax error');
        }
      }
    }
  }
  
  console.log('🎉 Syntax error fix completed successfully!');
} catch (error) {
  // If anything goes wrong, restore the original content
  fs.writeFileSync(serverFilePath, originalContent);
  console.error('❌ Error fixing syntax error:', error.message);
  throw error;
}