#!/usr/bin/env node

/**
 * Build Script - Consolidates all fix logic and provides clean build process
 * Replaces the multiple redundant fix scripts with a single, organized solution
 */

const fs = require('fs');
const path = require('path');

class BuildManager {
  constructor() {
    this.config = {
      sourceFiles: [
        'cc2_deobfuscated_basic.js',
        'cc2.js'
      ],
      outputDir: 'dist',
      tempDir: 'temp',
      logFile: 'build.log'
    };
    
    this.stats = {
      filesProcessed: 0,
      errorsFixed: 0,
      bytesProcessed: 0,
      startTime: Date.now()
    };
    
    this.log = [];
  }
  
  /**
   * Main build process
   */
  async build() {
    try {
      this.logMessage('🚀 Starting build process...');
      
      // Create necessary directories
      this.createDirectories();
      
      // Process source files
      for (const sourceFile of this.config.sourceFiles) {
        if (fs.existsSync(sourceFile)) {
          await this.processFile(sourceFile);
        } else {
          this.logMessage(`⚠️  Source file not found: ${sourceFile}`);
        }
      }
      
      // Generate build report
      this.generateReport();
      
      this.logMessage('✅ Build completed successfully!');
      
    } catch (error) {
      this.logMessage(`❌ Build failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create necessary directories
   */
  createDirectories() {
    const dirs = [this.config.outputDir, this.config.tempDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logMessage(`📁 Created directory: ${dir}`);
      }
    });
  }
  
  /**
   * Process a single file
   */
  async processFile(filePath) {
    this.logMessage(`🔧 Processing file: ${filePath}`);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalSize = content.length;
      this.stats.bytesProcessed += originalSize;
      
      // Apply fixes
      content = this.fixShaderCode(content);
      content = this.fixSyntaxIssues(content);
      content = this.optimizeCode(content);
      content = this.addCompatibilityLayer(content);
      
      // Write processed file
      const outputPath = path.join(this.config.outputDir, `${path.basename(filePath, '.js')}_processed.js`);
      fs.writeFileSync(outputPath, content);
      
      this.stats.filesProcessed++;
      this.logMessage(`✅ Processed: ${filePath} -> ${outputPath} (${originalSize} -> ${content.length} bytes)`);
      
    } catch (error) {
      this.logMessage(`❌ Error processing ${filePath}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Fix shader code issues
   */
  fixShaderCode(content) {
    this.logMessage('  🔧 Fixing shader code...');
    let fixCount = 0;
    
    // Fix unterminated string literals in shader code
    const shaderSections = [
      { name: 'begin_vertex', pattern: /begin_vertex:"[^"]*(?!")/g },
      { name: 'beginnormal_vertex', pattern: /beginnormal_vertex:`[^`]*(?!`)/g },
      { name: 'bsdfs', pattern: /bsdfs:`[^`]*(?!`)/g },
      { name: 'envmap_vertex', pattern: /envmap_vertex:[`"][^`"]*(?![`"])/g },
      { name: 'envmap_fragment', pattern: /envmap_fragment:[`"][^`"]*(?![`"])/g },
      { name: 'lights_phong_fragment', pattern: /lights_phong_fragment:[`"][^`"]*(?![`"])/g },
      { name: 'lights_lambert_fragment', pattern: /lights_lambert_fragment:[`"][^`"]*(?![`"])/g }
    ];
    
    shaderSections.forEach(section => {
      content = content.replace(section.pattern, (match) => {
        const quoteChar = match.includes('`') ? '`' : '"';
        if (!match.endsWith(quoteChar)) {
          fixCount++;
          return match + quoteChar;
        }
        return match;
      });
    });
    
    this.stats.errorsFixed += fixCount;
    this.logMessage(`    Fixed ${fixCount} shader code issues`);
    
    return content;
  }
  
  /**
   * Fix general syntax issues
   */
  fixSyntaxIssues(content) {
    this.logMessage('  🔧 Fixing syntax issues...');
    let fixCount = 0;
    
    const fixes = [
      // Fix missing semicolons
      {
        pattern: /}(\s*[a-zA-Z$_]\w*)/g,
        replacement: '};\n$1',
        description: 'missing semicolons'
      },
      // Fix missing commas in object literals
      {
        pattern: /}\s*{/g,
        replacement: '}, {',
        description: 'missing commas'
      },
      // Fix spacing around operators
      {
        pattern: /([=+\-*/%<>!&|,])\s*([^\s=])/g,
        replacement: '$1 $2',
        description: 'operator spacing'
      },
      // Fix parameter formatting
      {
        pattern: /,([^\s])/g,
        replacement: ', $1',
        description: 'parameter spacing'
      }
    ];
    
    fixes.forEach(fix => {
      const beforeLength = content.length;
      content = content.replace(fix.pattern, fix.replacement);
      const afterLength = content.length;
      
      if (beforeLength !== afterLength) {
        fixCount++;
        this.logMessage(`    Fixed ${fix.description}`);
      }
    });
    
    this.stats.errorsFixed += fixCount;
    return content;
  }
  
  /**
   * Optimize code
   */
  optimizeCode(content) {
    this.logMessage('  🔧 Optimizing code...');
    
    // Remove dead code
    content = content
      // Remove empty if blocks
      .replace(/if\s*\([^)]*\)\s*{\s*}/g, '')
      // Remove empty else blocks
      .replace(/else\s*{\s*}/g, '')
      // Remove console.log statements (but keep errors)
      .replace(/console\.(log|debug|info)\([^)]*\);?/g, '')
      // Remove single-line comments (but keep license comments)
      .replace(/\/\/(?!LICENSE|@license).*$/gm, '')
      // Remove @ts-ignore comments
      .replace(/\/\/\s*@ts-ignore.*$/gm, '');
    
    this.logMessage('    Code optimization completed');
    return content;
  }
  
  /**
   * Add compatibility layer
   */
  addCompatibilityLayer(content) {
    this.logMessage('  🔧 Adding compatibility layer...');
    
    const compatibilityCode = `
// Compatibility layer for modular 3D viewer
(function() {
  'use strict';
  
  // Ensure global THREE object exists
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not found, some features may not work');
  }
  
  // Export main classes if they exist
  if (typeof Renderer !== 'undefined') {
    window.Renderer = Renderer;
  }
  
  if (typeof GeometryFactory !== 'undefined') {
    window.GeometryFactory = GeometryFactory;
  }
  
  if (typeof ViewerController !== 'undefined') {
    window.ViewerController = ViewerController;
  }
  
  // Basic error handling
  window.addEventListener('error', function(event) {
    console.error('3D Viewer Error:', event.error);
  });
  
})();
`;
    
    content += compatibilityCode;
    this.logMessage('    Compatibility layer added');
    
    return content;
  }
  
  /**
   * Generate build report
   */
  generateReport() {
    const duration = Date.now() - this.stats.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: this.stats,
      log: this.log
    };
    
    // Write detailed log
    fs.writeFileSync(this.config.logFile, JSON.stringify(report, null, 2));
    
    // Console summary
    console.log('\n📊 Build Summary:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Errors fixed: ${this.stats.errorsFixed}`);
    console.log(`   Bytes processed: ${this.stats.bytesProcessed.toLocaleString()}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Log file: ${this.config.logFile}`);
  }
  
  /**
   * Log a message
   */
  logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(message);
    this.log.push(logEntry);
  }
}

// CLI interface
if (require.main === module) {
  const buildManager = new BuildManager();
  
  buildManager.build()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

module.exports = BuildManager; 