/**
 * Geometry Factory - Creates and manages 3D geometries
 * Separates geometry creation from rendering logic
 */

class GeometryFactory {
  constructor() {
    this.cache = new Map();
    this.defaultMaterialOptions = {
      metalness: 0.3,
      roughness: 0.4,
      wireframe: false
    };
  }
  
  /**
   * Create a cube geometry
   */
  createCube(options = {}) {
    const {
      width = 2,
      height = 2,
      depth = 2,
      widthSegments = 1,
      heightSegments = 1,
      depthSegments = 1
    } = options;
    
    const cacheKey = `cube_${width}_${height}_${depth}_${widthSegments}_${heightSegments}_${depthSegments}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }
    
    const geometry = new THREE.BoxGeometry(
      width, 
      height, 
      depth, 
      widthSegments, 
      heightSegments, 
      depthSegments
    );
    
    this.cache.set(cacheKey, geometry);
    return geometry.clone();
  }
  
  /**
   * Create a sphere geometry
   */
  createSphere(options = {}) {
    const {
      radius = 1.5,
      widthSegments = 32,
      heightSegments = 32,
      phiStart = 0,
      phiLength = Math.PI * 2,
      thetaStart = 0,
      thetaLength = Math.PI
    } = options;
    
    const cacheKey = `sphere_${radius}_${widthSegments}_${heightSegments}_${phiStart}_${phiLength}_${thetaStart}_${thetaLength}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }
    
    const geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
      phiStart,
      phiLength,
      thetaStart,
      thetaLength
    );
    
    this.cache.set(cacheKey, geometry);
    return geometry.clone();
  }
  
  /**
   * Create a torus geometry
   */
  createTorus(options = {}) {
    const {
      radius = 1,
      tube = 0.4,
      radialSegments = 16,
      tubularSegments = 100,
      arc = Math.PI * 2
    } = options;
    
    const cacheKey = `torus_${radius}_${tube}_${radialSegments}_${tubularSegments}_${arc}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }
    
    const geometry = new THREE.TorusGeometry(
      radius,
      tube,
      radialSegments,
      tubularSegments,
      arc
    );
    
    this.cache.set(cacheKey, geometry);
    return geometry.clone();
  }
  
  /**
   * Create a cylinder geometry
   */
  createCylinder(options = {}) {
    const {
      radiusTop = 1,
      radiusBottom = 1,
      height = 1,
      radialSegments = 32,
      heightSegments = 1,
      openEnded = false,
      thetaStart = 0,
      thetaLength = Math.PI * 2
    } = options;
    
    const cacheKey = `cylinder_${radiusTop}_${radiusBottom}_${height}_${radialSegments}_${heightSegments}_${openEnded}_${thetaStart}_${thetaLength}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }
    
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength
    );
    
    this.cache.set(cacheKey, geometry);
    return geometry.clone();
  }
  
  /**
   * Create a cone geometry
   */
  createCone(options = {}) {
    const {
      radius = 1,
      height = 1,
      radialSegments = 32,
      heightSegments = 1,
      openEnded = false,
      thetaStart = 0,
      thetaLength = Math.PI * 2
    } = options;
    
    return this.createCylinder({
      radiusTop: 0,
      radiusBottom: radius,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength
    });
  }
  
  /**
   * Create a plane geometry
   */
  createPlane(options = {}) {
    const {
      width = 1,
      height = 1,
      widthSegments = 1,
      heightSegments = 1
    } = options;
    
    const cacheKey = `plane_${width}_${height}_${widthSegments}_${heightSegments}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }
    
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      widthSegments,
      heightSegments
    );
    
    this.cache.set(cacheKey, geometry);
    return geometry.clone();
  }
  
  /**
   * Create a material with the given options
   */
  createMaterial(options = {}) {
    const materialOptions = {
      ...this.defaultMaterialOptions,
      ...options
    };
    
    // Choose material type based on options
    if (materialOptions.basic) {
      return new THREE.MeshBasicMaterial(materialOptions);
    } else if (materialOptions.lambert) {
      return new THREE.MeshLambertMaterial(materialOptions);
    } else if (materialOptions.phong) {
      return new THREE.MeshPhongMaterial(materialOptions);
    } else {
      // Default to standard material
      return new THREE.MeshStandardMaterial(materialOptions);
    }
  }
  
  /**
   * Create a complete mesh with geometry and material
   */
  createMesh(geometryType, geometryOptions = {}, materialOptions = {}) {
    let geometry;
    
    switch (geometryType.toLowerCase()) {
      case 'cube':
      case 'box':
        geometry = this.createCube(geometryOptions);
        break;
      case 'sphere':
        geometry = this.createSphere(geometryOptions);
        break;
      case 'torus':
        geometry = this.createTorus(geometryOptions);
        break;
      case 'cylinder':
        geometry = this.createCylinder(geometryOptions);
        break;
      case 'cone':
        geometry = this.createCone(geometryOptions);
        break;
      case 'plane':
        geometry = this.createPlane(geometryOptions);
        break;
      default:
        throw new Error(`Unknown geometry type: ${geometryType}`);
    }
    
    const material = this.createMaterial(materialOptions);
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * Get predefined shape configurations
   */
  getShapePresets() {
    return {
      cube: {
        geometry: { width: 2, height: 2, depth: 2 },
        material: { color: 0x00ff00 }
      },
      sphere: {
        geometry: { radius: 1.5, widthSegments: 32, heightSegments: 32 },
        material: { color: 0xff0000 }
      },
      torus: {
        geometry: { radius: 1, tube: 0.4, radialSegments: 16, tubularSegments: 100 },
        material: { color: 0x0088ff }
      },
      cylinder: {
        geometry: { radiusTop: 1, radiusBottom: 1, height: 2, radialSegments: 32 },
        material: { color: 0xffff00 }
      },
      cone: {
        geometry: { radius: 1, height: 2, radialSegments: 32 },
        material: { color: 0xff8800 }
      }
    };
  }
  
  /**
   * Create a preset shape
   */
  createPresetShape(shapeName, overrides = {}) {
    const presets = this.getShapePresets();
    const preset = presets[shapeName];
    
    if (!preset) {
      throw new Error(`Unknown preset shape: ${shapeName}`);
    }
    
    const geometryOptions = { ...preset.geometry, ...overrides.geometry };
    const materialOptions = { ...preset.material, ...overrides.material };
    
    return this.createMesh(shapeName, geometryOptions, materialOptions);
  }
  
  /**
   * Clear geometry cache
   */
  clearCache() {
    // Dispose of cached geometries
    this.cache.forEach(geometry => {
      geometry.dispose();
    });
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeometryFactory;
} else if (typeof window !== 'undefined') {
  window.GeometryFactory = GeometryFactory;
} 