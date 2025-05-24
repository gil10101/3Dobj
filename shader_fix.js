const fs = require('fs');

try {
  console.log('Starting specialized shader code fix...');
  
  // Read the original deobfuscated file
  const filePath = 'cc2_deobfuscated_basic.js';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First, let's find the problematic areas in the code
  const problemLines = [
    { line: 4819, issue: 'Unterminated string literal', pattern: /begin_vertex:"vec3 transformed = vec3\( position \);/ },
    { line: 4820, issue: "Expected comma", pattern: /beginnormal_vertex:`vec3 objectNormal = vec3\( normal \);/ },
    { line: 4825, issue: "Expected colon", pattern: /bsdfs:`vec3 BRDF_Lambert\( const in vec3 diffuseColor \) {/ }
  ];
  
  console.log('Fixing specific shader issues...');
  
  // Proper fix function for shader string literals
  function properlyQuotedString(str, quoteChar) {
    // Make sure the string is properly quoted with the specified character
    const cleaned = str.replace(/^\s+|\s+$/g, ''); // Trim whitespace
    if (cleaned.startsWith(quoteChar) && cleaned.endsWith(quoteChar)) {
      return cleaned; // Already properly quoted
    }
    if (cleaned.startsWith(quoteChar)) {
      return cleaned + quoteChar; // Add closing quote
    }
    if (cleaned.endsWith(quoteChar)) {
      return quoteChar + cleaned; // Add opening quote
    }
    return quoteChar + cleaned + quoteChar; // Add both quotes
  }
  
  // Extract all shader code sections
  const shaderSections = [
    { name: 'begin_vertex', pattern: /begin_vertex:"[^"]*/ },
    { name: 'beginnormal_vertex', pattern: /beginnormal_vertex:`[^`]*/ },
    { name: 'bsdfs', pattern: /bsdfs:`[^`]*/ },
    { name: 'envmap_vertex', pattern: /envmap_vertex:[`"][^`"]*/ },
    { name: 'envmap_fragment', pattern: /envmap_fragment:[`"][^`"]*/ },
    { name: 'lights_phong_fragment', pattern: /lights_phong_fragment:[`"][^`"]*/ },
    { name: 'lights_lambert_fragment', pattern: /lights_lambert_fragment:[`"][^`"]*/ }
  ];
  
  // Fix each shader section
  for (const section of shaderSections) {
    const match = content.match(section.pattern);
    if (match) {
      console.log(`Found ${section.name} shader section`);
      const sectionText = match[0];
      
      // Determine quote character used
      const quoteChar = sectionText.includes('`') ? '`' : '"';
      
      // Fix quote termination
      const fixedText = sectionText + quoteChar;
      
      // Replace the broken section with the fixed one
      content = content.replace(sectionText, fixedText);
    }
  }
  
  // Create a more complete shader fix by finding all shader object definitions
  const shaderObjectPattern = /(\w+):\s*{([^}]*)}/g;
  let match;
  
  while ((match = shaderObjectPattern.exec(content)) !== null) {
    const [fullMatch, objectName, properties] = match;
    
    // Check if this is a shader-related object
    if (objectName.includes('shader') || 
        properties.includes('vertex') || 
        properties.includes('fragment')) {
      
      console.log(`Found potential shader object: ${objectName}`);
      
      // Fix property string literals
      let fixedProperties = properties;
      const propertyPattern = /(\w+):\s*(["`'])(.*?)(["`'])?/g;
      let propMatch;
      
      while ((propMatch = propertyPattern.exec(properties)) !== null) {
        const [fullPropMatch, propName, openQuote, propValue, closeQuote] = propMatch;
        
        // If close quote is missing, fix it
        if (!closeQuote) {
          const fixedPropText = `${propName}:${openQuote}${propValue}${openQuote}`;
          fixedProperties = fixedProperties.replace(fullPropMatch, fixedPropText);
        }
      }
      
      // Replace the object definition with the fixed one
      const fixedObjectText = `${objectName}:{${fixedProperties}}`;
      content = content.replace(fullMatch, fixedObjectText);
    }
  }
  
  // Write the fixed content to a new file
  const outputPath = 'cc2_shader_fixed.js';
  fs.writeFileSync(outputPath, content);
  console.log(`Fixed file written to ${outputPath}`);
  
} catch (error) {
  console.error('Error:', error);
} 