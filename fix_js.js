const fs = require('fs');

// Read the file
try {
  const filePath = 'cc2_deobfuscated_basic.js';
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`Read file: ${filePath} (${content.length} bytes)`);
  
  // Specific fixes for known shader code issues from the linter errors
  console.log('Fixing shader code string literals...');
  
  // Fix 1: Fix unterminated string literals in various shader parts
  content = content
    // Fix begin_vertex shader code
    .replace(/begin_vertex:"vec3 transformed = vec3\( position \);(\s*)/g, 'begin_vertex:"vec3 transformed = vec3( position );"$1')
    
    // Fix beginnormal_vertex shader code
    .replace(/beginnormal_vertex:(`vec3 objectNormal = vec3\( normal \);)(\s*)/g, 'beginnormal_vertex:$1`$2')
    
    // Fix bsdfs shader code
    .replace(/bsdfs:(`vec3 BRDF_Lambert\( const in vec3 diffuseColor \) \{)(\s*)/g, 'bsdfs:$1`$2');
  
  // Fix 2: General pattern fixes for shader code strings
  const shaderParts = [
    'begin_vertex', 'beginnormal_vertex', 'bsdfs', 'envmap_vertex', 'envmap_fragment',
    'color_vertex', 'color_fragment', 'uv_vertex', 'uv_fragment', 'uv2_vertex', 'uv2_fragment',
    'worldpos_vertex', 'lights_phong_fragment', 'lights_lambert_fragment'
  ];
  
  shaderParts.forEach(part => {
    const regex = new RegExp(`${part}:(["'\`])(.*?)\\n`, 'g');
    content = content.replace(regex, (match, quote, code) => {
      if (!match.endsWith(quote)) {
        return `${part}:${quote}${code}${quote}\n`;
      }
      return match;
    });
  });
  
  // Fix 3: Format the code to ensure proper JavaScript syntax
  console.log('Formatting code...');
  content = content
    // Fix missing semicolons
    .replace(/}\s*(?=\w|function|class|var|let|const)/g, '};\n')
    
    // Fix dangling commas
    .replace(/,\s*\}/g, '\n}')
    
    // Ensure proper spacing between functions
    .replace(/}(class|function)/g, '}\n\n$1')
    
    // Fix inconsistent spacing around operators
    .replace(/([=+\-*/%])\s*([^=\s])/g, '$1 $2')
    
    // Fix spaces after commas in function params
    .replace(/,([^\s])/g, ', $1');
  
  // Remove any dead code branches (empty if/else blocks)
  console.log('Removing dead code branches...');
  content = content
    .replace(/if\s*\(\s*false\s*\)\s*\{\s*\}/g, '')
    .replace(/else\s*\{\s*\}/g, '')
    .replace(/\/\/\s*@ts-ignore.*\n/g, '');
  
  // Write the fixed content to a new file
  const outputPath = 'cc2_fixed.js';
  fs.writeFileSync(outputPath, content);
  console.log(`Fixed file written to ${outputPath} (${content.length} bytes)`);
  
  // Create a log file with summary of changes
  const logContent = `
Fix Summary:
- Fixed unterminated string literals in shader code
- Properly closed string literals
- Formatted code for better readability
- Removed dead code branches
- Fixed spacing around operators and in function params

Original file size: ${fs.statSync(filePath).size} bytes
Fixed file size: ${fs.statSync(outputPath).size} bytes
  `;
  
  fs.writeFileSync('fix_log.txt', logContent);
  console.log('Log file written to fix_log.txt');
} catch (error) {
  console.error('Error:', error);
} 