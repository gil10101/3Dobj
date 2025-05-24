/**
 * Main Entry Point - 3D Viewer Application
 * Coordinates all modules and provides a clean API
 */

// Import core modules (for Node.js environment)
let Renderer, GeometryFactory, ViewerController;

if (typeof require !== 'undefined') {
  try {
    Renderer = require('./core/Renderer');
    GeometryFactory = require('./core/GeometryFactory');
    ViewerController = require('./ui/ViewerController');
  } catch (error) {
    console.warn('Module imports failed, using browser globals:', error.message);
  }
}

/**
 * Main 3D Viewer Application Class
 */
class Viewer3D {
  constructor(options = {}) {
    this.options = {
      containerId: 'viewer-container',
      autoInit: true,
      enableControls: true,
      enableKeyboard: true,
      showUI: true,
      theme: 'dark',
      ...options
    };
    
    this.controller = null;
    this.state = {
      initialized: false,
      error: null
    };
    
    this.eventListeners = new Map();
    
    if (this.options.autoInit) {
      this.init();
    }
  }
  
  /**
   * Initialize the 3D viewer
   */
  async init() {
    try {
      // Check dependencies
      await this.checkDependencies();
      
      // Create controller
      this.controller = new (ViewerController || window.ViewerController)(
        this.options.containerId,
        {
          enableControls: this.options.enableControls,
          enableKeyboard: this.options.enableKeyboard,
          showInfo: this.options.showUI,
          showControls: this.options.showUI,
          autoStart: true
        }
      );
      
      // Setup event forwarding
      this.setupEventForwarding();
      
      this.state.initialized = true;
      this.emit('initialized');
      
      return this;
      
    } catch (error) {
      this.state.error = error;
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Check if all dependencies are available
   */
  async checkDependencies() {
    const dependencies = [
      { name: 'THREE', global: 'THREE' },
      { name: 'Renderer', global: 'Renderer', module: Renderer },
      { name: 'GeometryFactory', global: 'GeometryFactory', module: GeometryFactory },
      { name: 'ViewerController', global: 'ViewerController', module: ViewerController }
    ];
    
    const missing = [];
    
    dependencies.forEach(dep => {
      const available = dep.module || 
                       (typeof window !== 'undefined' && window[dep.global]) ||
                       (typeof global !== 'undefined' && global[dep.global]);
      
      if (!available) {
        missing.push(dep.name);
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing dependencies: ${missing.join(', ')}`);
    }
  }
  
  /**
   * Setup event forwarding from controller
   */
  setupEventForwarding() {
    if (!this.controller) return;
    
    const eventsToForward = [
      'shapeChanged',
      'rotationToggled', 
      'wireframeToggled',
      'error'
    ];
    
    eventsToForward.forEach(eventName => {
      this.controller.on(eventName, (data) => {
        this.emit(eventName, data);
      });
    });
  }
  
  /**
   * Show a specific 3D shape
   */
  showShape(shapeName) {
    if (!this.controller) {
      throw new Error('Viewer not initialized');
    }
    
    return this.controller.showShape(shapeName);
  }
  
  /**
   * Toggle auto-rotation
   */
  toggleRotation() {
    if (!this.controller) {
      throw new Error('Viewer not initialized');
    }
    
    return this.controller.toggleRotation();
  }
  
  /**
   * Toggle wireframe mode
   */
  toggleWireframe() {
    if (!this.controller) {
      throw new Error('Viewer not initialized');
    }
    
    return this.controller.toggleWireframe();
  }
  
  /**
   * Get current viewer state
   */
  getState() {
    const baseState = { ...this.state };
    
    if (this.controller) {
      baseState.controller = this.controller.getState();
    }
    
    return baseState;
  }
  
  /**
   * Set viewer options
   */
  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Apply theme if changed
    if (newOptions.theme) {
      this.applyTheme(newOptions.theme);
    }
    
    this.emit('optionsChanged', this.options);
  }
  
  /**
   * Apply theme to the viewer
   */
  applyTheme(theme) {
    const container = document.getElementById(this.options.containerId);
    if (!container) return;
    
    // Remove existing theme classes
    container.classList.remove('theme-dark', 'theme-light');
    
    // Add new theme class
    container.classList.add(`theme-${theme}`);
    
    this.emit('themeChanged', theme);
  }
  
  /**
   * Take a screenshot of the current view
   */
  takeScreenshot(format = 'image/png') {
    if (!this.controller || !this.controller.renderer) {
      throw new Error('Renderer not available');
    }
    
    const canvas = this.controller.renderer.getDomElement();
    if (!canvas) {
      throw new Error('Canvas not available');
    }
    
    return canvas.toDataURL(format);
  }
  
  /**
   * Export current scene data
   */
  exportScene() {
    if (!this.controller) {
      throw new Error('Viewer not initialized');
    }
    
    const state = this.getState();
    const sceneData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      state: state,
      options: this.options
    };
    
    return sceneData;
  }
  
  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    return this;
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
    return this;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.controller) {
      this.controller.dispose();
      this.controller = null;
    }
    
    this.eventListeners.clear();
    this.state.initialized = false;
    
    this.emit('disposed');
  }
}

/**
 * Factory function for creating viewer instances
 */
function createViewer(containerId, options = {}) {
  return new Viewer3D({
    containerId,
    ...options
  });
}

/**
 * Utility functions
 */
const Utils = {
  /**
   * Check if WebGL is supported
   */
  isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
               (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Get system capabilities
   */
  getCapabilities() {
    return {
      webgl: this.isWebGLSupported(),
      webgl2: !!(window.WebGL2RenderingContext),
      devicePixelRatio: window.devicePixelRatio || 1,
      maxTextureSize: this.getMaxTextureSize(),
      vendor: this.getWebGLVendor()
    };
  },
  
  /**
   * Get maximum texture size
   */
  getMaxTextureSize() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0;
    } catch (e) {
      return 0;
    }
  },
  
  /**
   * Get WebGL vendor information
   */
  getWebGLVendor() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'unknown';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return debugInfo ? {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      } : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Viewer3D,
    createViewer,
    Utils
  };
} else if (typeof window !== 'undefined') {
  window.Viewer3D = Viewer3D;
  window.createViewer = createViewer;
  window.ViewerUtils = Utils;
} 