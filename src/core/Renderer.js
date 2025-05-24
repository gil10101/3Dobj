/**
 * Core 3D Renderer - Handles all rendering logic
 * Separates rendering concerns from UI and provides a clean API
 */

class Renderer {
  constructor(options = {}) {
    this.options = {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      ...options
    };
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentObject = null;
    this.lights = [];
    
    this.state = {
      autoRotate: true,
      wireframe: true,
      initialized: false
    };
    
    this.eventCallbacks = new Map();
    
    this.init();
  }
  
  /**
   * Initialize the 3D environment
   */
  init() {
    try {
      this.createScene();
      this.createCamera();
      this.createRenderer();
      this.createLights();
      this.state.initialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Create THREE.js scene
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
  }
  
  /**
   * Create camera with responsive aspect ratio
   */
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.z = 5;
  }
  
  /**
   * Create WebGL renderer with error fallback
   */
  createRenderer() {
    try {
      console.log('Creating WebGL renderer...');
      this.renderer = new THREE.WebGLRenderer(this.options);
      console.log('WebGL renderer created successfully');
    } catch (error) {
      console.warn('WebGL not available, using canvas fallback');
      this.renderer = new THREE.CanvasRenderer();
    }
    
    console.log('Setting renderer size to:', window.innerWidth, 'x', window.innerHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log('Renderer DOM element:', this.renderer.domElement);
    console.log('Renderer DOM element tag:', this.renderer.domElement.tagName);
    console.log('Renderer DOM element dimensions:', {
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      style: this.renderer.domElement.style.cssText
    });
  }
  
  /**
   * Create lighting setup
   */
  createLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }
  
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer ? this.renderer.domElement : null;
  }
  
  /**
   * Add controls to the renderer
   */
  addControls(controlsClass = THREE.OrbitControls) {
    if (this.controls) {
      this.controls.dispose();
    }
    
    this.controls = new controlsClass(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    
    return this.controls;
  }
  
  /**
   * Add a 3D object to the scene
   */
  addObject(geometry, material, options = {}) {
    this.removeCurrentObject();
    
    const mesh = new THREE.Mesh(geometry, material);
    
    if (options.position) {
      mesh.position.copy(options.position);
    }
    
    if (options.rotation) {
      mesh.rotation.copy(options.rotation);
    }
    
    if (options.scale) {
      mesh.scale.copy(options.scale);
    }
    
    if (options.castShadow) {
      mesh.castShadow = true;
    }
    
    if (options.receiveShadow) {
      mesh.receiveShadow = true;
    }
    
    this.scene.add(mesh);
    this.currentObject = mesh;
    this.emit('objectAdded', mesh);
    
    return mesh;
  }
  
  /**
   * Remove current object from scene
   */
  removeCurrentObject() {
    if (this.currentObject) {
      this.scene.remove(this.currentObject);
      
      // Clean up geometry and material
      if (this.currentObject.geometry) {
        this.currentObject.geometry.dispose();
      }
      if (this.currentObject.material) {
        if (Array.isArray(this.currentObject.material)) {
          this.currentObject.material.forEach(material => material.dispose());
        } else {
          this.currentObject.material.dispose();
        }
      }
      
      this.emit('objectRemoved', this.currentObject);
      this.currentObject = null;
    }
  }
  
  /**
   * Update auto-rotation state
   */
  setAutoRotate(enabled) {
    this.state.autoRotate = enabled;
    this.emit('autoRotateChanged', enabled);
  }
  
  /**
   * Toggle wireframe mode
   */
  setWireframe(enabled) {
    this.state.wireframe = enabled;
    
    if (this.currentObject && this.currentObject.material) {
      this.currentObject.material.wireframe = enabled;
    }
    
    this.emit('wireframeChanged', enabled);
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.emit('resize', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
  
  /**
   * Render a single frame
   */
  render() {
    if (!this.state.initialized) return;
    
    // Auto-rotate current object
    if (this.currentObject && this.state.autoRotate) {
      this.currentObject.rotation.x += 0.01;
      this.currentObject.rotation.y += 0.01;
    }
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Start the render loop
   */
  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }
  
  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.removeCurrentObject();
    
    if (this.controls) {
      this.controls.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    
    this.eventCallbacks.clear();
    this.state.initialized = false;
    
    this.emit('disposed');
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
} else if (typeof window !== 'undefined') {
  window.Renderer = Renderer;
} 