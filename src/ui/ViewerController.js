/**
 * Viewer Controller - Manages UI interactions and coordinates with renderer
 * Separates UI logic from rendering logic
 */

class ViewerController {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    this.options = {
      enableControls: true,
      enableResize: true,
      enableKeyboard: true,
      showInfo: true,
      showControls: true,
      autoStart: true,
      ...options
    };
    
    this.renderer = null;
    this.geometryFactory = null;
    this.ui = {
      infoPanel: null,
      controlPanel: null,
      buttons: {}
    };
    
    this.state = {
      currentShape: 'cube',
      autoRotate: true,
      wireframe: true,
      initialized: false
    };
    
    this.eventHandlers = new Map();
    
    if (this.options.autoStart) {
      this.init();
    }
  }
  
  /**
   * Initialize the viewer
   */
  async init() {
    try {
      await this.checkDependencies();
      this.createRenderer();
      this.createGeometryFactory();
      this.createUI();
      this.setupEventListeners();
      this.loadInitialShape();
      this.state.initialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize viewer:', error);
      this.showError('Failed to initialize 3D viewer', error);
    }
  }
  
  /**
   * Check if required dependencies are available
   */
  async checkDependencies() {
    console.log('Checking dependencies...');
    
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js library is required but not found. Please ensure THREE.js is loaded before initializing the viewer.');
    }
    
    console.log('THREE.js found, version:', THREE.REVISION || 'unknown');
    
    // Check for OrbitControls with retry mechanism
    let orbitControlsRetries = 0;
    const maxRetries = 5;
    
    while (typeof THREE.OrbitControls === 'undefined' && orbitControlsRetries < maxRetries) {
      console.log(`OrbitControls not found, waiting... (attempt ${orbitControlsRetries + 1}/${maxRetries})`);
      
      // Wait for OrbitControls promise if it exists
      if (typeof window !== 'undefined' && window.orbitControlsPromise) {
        try {
          await window.orbitControlsPromise;
          break;
        } catch (error) {
          console.warn('OrbitControls promise failed:', error);
        }
      }
      
      // Additional wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      orbitControlsRetries++;
    }
    
    // Final check for OrbitControls
    if (typeof THREE.OrbitControls === 'undefined') {
      console.error('THREE.OrbitControls is not available after retries');
      
      // Create a minimal fallback if all else fails
      console.log('Creating minimal OrbitControls fallback...');
      THREE.OrbitControls = class MinimalOrbitControls {
        constructor(camera, domElement) {
          this.object = camera;
          this.domElement = domElement;
          this.enabled = true;
          this.enableDamping = true;
          this.dampingFactor = 0.05;
          this.enableZoom = true;
          this.enableRotate = true;
          this.enablePan = true;
          this.target = new THREE.Vector3();
          
          console.warn('Using minimal OrbitControls fallback - limited functionality');
        }
        
        update() {
          return false;
        }
        
        dispose() {
          // Minimal cleanup
        }
      };
    }
    
    console.log('OrbitControls available:', typeof THREE.OrbitControls !== 'undefined');
    
    // Check for Renderer class
    if (typeof Renderer === 'undefined') {
      // Try to load the Renderer module
      if (typeof window !== 'undefined' && window.Renderer) {
        window.Renderer = window.Renderer;
      } else {
        throw new Error('Renderer class is required but not found. Please ensure Renderer.js is loaded.');
      }
    }
    
    console.log('Renderer class available:', typeof Renderer !== 'undefined');
    
    // Check for GeometryFactory class
    if (typeof GeometryFactory === 'undefined') {
      if (typeof window !== 'undefined' && window.GeometryFactory) {
        window.GeometryFactory = window.GeometryFactory;
      } else {
        throw new Error('GeometryFactory class is required but not found. Please ensure GeometryFactory.js is loaded.');
      }
    }
    
    console.log('GeometryFactory class available:', typeof GeometryFactory !== 'undefined');
    console.log('All dependencies checked successfully');
  }
  
  /**
   * Create the renderer instance
   */
  createRenderer() {
    console.log('ViewerController: Creating renderer...');
    this.renderer = new Renderer({
      antialias: true,
      alpha: false
    });
    
    // Add renderer to container
    const canvas = this.renderer.getDomElement();
    console.log('ViewerController: Got canvas from renderer:', canvas);
    console.log('ViewerController: Container element:', this.container);
    
    if (canvas) {
      console.log('ViewerController: Appending canvas to container...');
      this.container.appendChild(canvas);
      console.log('ViewerController: Canvas appended. Container children count:', this.container.children.length);
      console.log('ViewerController: Canvas in DOM:', document.contains(canvas));
    } else {
      console.error('ViewerController: No canvas element received from renderer!');
    }
    
    // Setup renderer event listeners
    this.renderer.on('initialized', () => {
      console.log('ViewerController: Renderer initialized event received');
      if (this.options.enableControls) {
        console.log('ViewerController: Adding controls...');
        this.renderer.addControls();
      }
      if (this.options.autoStart) {
        console.log('ViewerController: Starting render loop...');
        this.renderer.startRenderLoop();
      }
    });
    
    this.renderer.on('error', (error) => {
      console.error('ViewerController: Renderer error:', error);
      this.showError('Renderer error', error);
    });
  }
  
  /**
   * Create the geometry factory
   */
  createGeometryFactory() {
    this.geometryFactory = new GeometryFactory();
  }
  
  /**
   * Create UI elements
   */
  createUI() {
    if (this.options.showInfo) {
      this.createInfoPanel();
    }
    
    if (this.options.showControls) {
      this.createControlPanel();
    }
  }
  
  /**
   * Create info panel
   */
  createInfoPanel() {
    this.ui.infoPanel = document.createElement('div');
    this.ui.infoPanel.id = 'viewer-info';
    this.ui.infoPanel.className = 'viewer-panel info-panel';
    this.ui.infoPanel.innerHTML = `
      <h3>3D Object Viewer</h3>
      <p>Click and drag to rotate</p>
      <div id="shape-info">Cube</div>
    `;
    
    this.container.appendChild(this.ui.infoPanel);
  }
  
  /**
   * Create control panel with buttons
   */
  createControlPanel() {
    this.ui.controlPanel = document.createElement('div');
    this.ui.controlPanel.id = 'viewer-controls';
    this.ui.controlPanel.className = 'viewer-panel control-panel';
    
    const controls = [
      { id: 'cube', text: 'Show Cube', shape: 'cube' },
      { id: 'sphere', text: 'Show Sphere', shape: 'sphere' },
      { id: 'torus', text: 'Show Torus', shape: 'torus' },
      { id: 'cylinder', text: 'Show Cylinder', shape: 'cylinder' },
      { id: 'cone', text: 'Show Cone', shape: 'cone' }
    ];
    
    const toggles = [
      { id: 'toggle-rotate', text: 'Stop Rotation', action: 'toggleRotation' },
      { id: 'toggle-wireframe', text: 'Show Solid', action: 'toggleWireframe' }
    ];
    
    // Create shape buttons
    const shapeGroup = document.createElement('div');
    shapeGroup.className = 'button-group';
    
    controls.forEach(control => {
      const button = this.createButton(control.id, control.text);
      button.addEventListener('click', () => this.showShape(control.shape));
      this.ui.buttons[control.id] = button;
      shapeGroup.appendChild(button);
    });
    
    // Create toggle buttons
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'button-group';
    
    toggles.forEach(toggle => {
      const button = this.createButton(toggle.id, toggle.text);
      button.addEventListener('click', () => this[toggle.action]());
      this.ui.buttons[toggle.id] = button;
      toggleGroup.appendChild(button);
    });
    
    this.ui.controlPanel.appendChild(shapeGroup);
    this.ui.controlPanel.appendChild(toggleGroup);
    this.container.appendChild(this.ui.controlPanel);
  }
  
  /**
   * Create a button element
   */
  createButton(id, text) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = text;
    button.className = 'viewer-button';
    return button;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.options.enableResize) {
      this.setupResizeHandler();
    }
    
    if (this.options.enableKeyboard) {
      this.setupKeyboardHandlers();
    }
    
    // Error handling
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('viewer')) {
        this.showError('JavaScript error', event.error);
      }
    });
  }
  
  /**
   * Setup window resize handling
   */
  setupResizeHandler() {
    const resizeHandler = () => {
      if (this.renderer) {
        this.renderer.handleResize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    this.eventHandlers.set('resize', resizeHandler);
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardHandlers() {
    const keyHandler = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return; // Don't interfere with form inputs
      }
      
      switch (event.key.toLowerCase()) {
        case '1':
          this.showShape('cube');
          break;
        case '2':
          this.showShape('sphere');
          break;
        case '3':
          this.showShape('torus');
          break;
        case '4':
          this.showShape('cylinder');
          break;
        case '5':
          this.showShape('cone');
          break;
        case 'r':
          this.toggleRotation();
          break;
        case 'w':
          this.toggleWireframe();
          break;
        case 'f':
          this.toggleFullscreen();
          break;
      }
    };
    
    document.addEventListener('keydown', keyHandler);
    this.eventHandlers.set('keydown', keyHandler);
  }
  
  /**
   * Load initial shape
   */
  loadInitialShape() {
    this.showShape(this.state.currentShape);
  }
  
  /**
   * Show a specific shape
   */
  showShape(shapeName) {
    try {
      if (!this.renderer || !this.geometryFactory) {
        throw new Error('Renderer or GeometryFactory not initialized');
      }
      
      const presets = this.geometryFactory.getShapePresets();
      const preset = presets[shapeName];
      
      if (!preset) {
        throw new Error(`Unknown preset shape: ${shapeName}`);
      }
      
      const geometryOptions = { ...preset.geometry };
      const materialOptions = { ...preset.material, wireframe: this.state.wireframe };
      
      // Create geometry and material separately
      const geometry = this.geometryFactory.createMesh(shapeName, geometryOptions, {}).geometry;
      const material = this.geometryFactory.createMaterial(materialOptions);
      
      // Use renderer's addObject method for proper management
      this.renderer.addObject(geometry, material, {
        castShadow: true,
        receiveShadow: true
      });
      
      this.state.currentShape = shapeName;
      this.updateUI(shapeName);
      this.emit('shapeChanged', { shape: shapeName, mesh: this.renderer.currentObject });
      
    } catch (error) {
      console.error(`Failed to show ${shapeName}:`, error);
      this.showError(`Failed to load ${shapeName}`, error);
    }
  }
  
  /**
   * Toggle auto-rotation
   */
  toggleRotation() {
    this.state.autoRotate = !this.state.autoRotate;
    
    if (this.renderer) {
      this.renderer.setAutoRotate(this.state.autoRotate);
    }
    
    // Update button text
    const button = this.ui.buttons['toggle-rotate'];
    if (button) {
      button.textContent = this.state.autoRotate ? 'Stop Rotation' : 'Start Rotation';
    }
    
    this.emit('rotationToggled', this.state.autoRotate);
  }
  
  /**
   * Toggle wireframe mode
   */
  toggleWireframe() {
    this.state.wireframe = !this.state.wireframe;
    
    if (this.renderer) {
      this.renderer.setWireframe(this.state.wireframe);
    }
    
    // Update button text
    const button = this.ui.buttons['toggle-wireframe'];
    if (button) {
      button.textContent = this.state.wireframe ? 'Show Solid' : 'Show Wireframe';
    }
    
    this.emit('wireframeToggled', this.state.wireframe);
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  /**
   * Update UI elements
   */
  updateUI(shapeName) {
    // Update info panel
    const shapeInfo = document.getElementById('shape-info');
    if (shapeInfo) {
      shapeInfo.textContent = shapeName.charAt(0).toUpperCase() + shapeName.slice(1);
    }
    
    // Update button states
    Object.entries(this.ui.buttons).forEach(([id, button]) => {
      if (id === shapeName) {
        button.classList.add('active');
      } else if (['cube', 'sphere', 'torus', 'cylinder', 'cone'].includes(id)) {
        button.classList.remove('active');
      }
    });
  }
  
  /**
   * Show error message to user
   */
  showError(message, error) {
    console.error(message, error);
    
    // Create or update error display
    let errorDiv = document.getElementById('viewer-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'viewer-error';
      errorDiv.className = 'viewer-panel error-panel';
      this.container.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
      <h4>Error</h4>
      <p>${message}</p>
      <button onclick="document.getElementById('viewer-error').style.display='none'">Close</button>
    `;
    
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv && errorDiv.style.display !== 'none') {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }
  
  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }
  
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners
    this.eventHandlers.forEach((handlers, event) => {
      if (event === 'resize') {
        window.removeEventListener('resize', handlers);
      } else if (event === 'keydown') {
        document.removeEventListener('keydown', handlers);
      }
    });
    
    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear geometry cache
    if (this.geometryFactory) {
      this.geometryFactory.clearCache();
    }
    
    // Remove UI elements
    Object.values(this.ui).forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    this.eventHandlers.clear();
    this.state.initialized = false;
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewerController;
} else if (typeof window !== 'undefined') {
  window.ViewerController = ViewerController;
} 