const fs = require('fs');

console.log('Verifying JavaScript syntax in fixed file...');

try {
  const content = fs.readFileSync('cc2_fixed.js', 'utf8');
  
  // First attempt: Check for specific shader code syntax issues
  console.log('Looking for shader code issues...');
  const shaderCodeRegex = /(begin_vertex|beginnormal_vertex|bsdfs|envmap_vertex|envmap_fragment):("|'|`)(.*?)("|'|`)/g;
  let match;
  while ((match = shaderCodeRegex.exec(content)) !== null) {
    const [full, shaderPart, openQuote, code, closeQuote] = match;
    if (openQuote !== closeQuote) {
      console.error(`Mismatched quotes in shader part ${shaderPart}: starts with ${openQuote}, ends with ${closeQuote}`);
    }
  }
  
  // Second attempt: Use Function constructor to check syntax without executing code
  // This is safer than vm.Script because it won't execute the code
  console.log('Checking for syntax errors...');
  
  // Split the file into smaller chunks to isolate errors
  const lines = content.split('\n');
  const chunkSize = 100;
  let errorFound = false;
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n');
    try {
      // Using Function constructor to check syntax without executing
      new Function(chunk);
    } catch (syntaxError) {
      errorFound = true;
      // Adjust line number to absolute position in file
      const errorLine = syntaxError.lineNumber ? syntaxError.lineNumber + i : 'unknown';
      console.error(`\nSyntax error at around line ${errorLine}:`);
      console.error(`Error: ${syntaxError.message}`);
      
      // Show the problematic code
      const startLine = Math.max(0, errorLine - i - 3);
      const endLine = Math.min(chunk.split('\n').length, errorLine - i + 3);
      console.log('\nError context:');
      
      const chunkLines = chunk.split('\n');
      for (let j = startLine; j < endLine; j++) {
        const lineNumber = i + j + 1;
        const prefix = j === errorLine - i - 1 ? '>>> ' : '    ';
        console.log(`${prefix}${lineNumber}: ${chunkLines[j]}`);
      }
      
      // Just show the first error to avoid overwhelming output
      break;
    }
  }
  
  if (!errorFound) {
    console.log('No syntax errors detected!');
  }
  
} catch (error) {
  console.error('Error reading or processing file:', error);
} 