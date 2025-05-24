"use strict";

/**
 * Three.js based rendering library - deobfuscated and cleaned version
 * Original file: cc2.js
 */

(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[83877], {
  97897: (module, exports, require) => {
    require.d(exports, { l: () => Renderer });

    // Import necessary modules and utilities
    const THREE = require(55633);
    const utils = require(64001).hp;
    
    // Helper functions for object manipulation
    const createObject = Object.create;
    const defineProperty = Object.defineProperty;
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const getOwnPropertyNames = Object.getOwnPropertyNames;
    const getPrototypeOf = Object.getPrototypeOf;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    
    // Property assignment helper
    const assignProperty = (obj, key, value) => {
      if (key in obj) {
        defineProperty(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: value
        });
      } else {
        obj[key] = value;
      }
      return value;
    };
    
    // Module creation helper
    const createModule = (factory, defaultExports) => {
      return () => {
        const module = { exports: {} };
        (defaultExports || factory)(module.exports, module);
        return module.exports;
      };
    };
    
    // Object property copying helper
    const copyProperties = (target, source, exclude, descriptor) => {
      if (source && (typeof source === "object" || typeof source === "function")) {
        for (let key of getOwnPropertyNames(source)) {
          if (!hasOwnProperty.call(target, key) && key !== exclude) {
            defineProperty(target, key, {
              get: () => source[key],
              enumerable: !(descriptor = getOwnPropertyDescriptor(source, key)) || descriptor.enumerable
            });
          }
        }
      }
      return target;
    };
    
    // Module import helper
    const importModule = (module, defaultExport, result) => {
      result = module != null ? createObject(getPrototypeOf(module)) : {};
      return copyProperties(
        !defaultExport && module && module.__esModule ? 
          result : 
          defineProperty(result, "default", { value: module, enumerable: true }), 
        module
      );
    };
    
    // Constants
    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;
    const EPSILON = 0.000001;
    
    // Helper for UUID generation
    const generateUUID = function() {
      const lut = [
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f',
        '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f',
        // ... more hex values ...
      ];
      
      // Generate 4 random numbers
      let d0 = Math.random() * 0xffffffff | 0;
      let d1 = Math.random() * 0xffffffff | 0;
      let d2 = Math.random() * 0xffffffff | 0;
      let d3 = Math.random() * 0xffffffff | 0;
      
      // Format as UUID string
      return (
        lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
        lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' +
        lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' +
        lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
        lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
      ).toLowerCase();
    };
    
    // Math utility functions
    const MathUtils = {
      DEG2RAD,
      RAD2DEG,
      
      clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
      },
      
      euclideanModulo: function(n, m) {
        return ((n % m) + m) % m;
      },
      
      lerp: function(x, y, t) {
        return (1 - t) * x + t * y;
      },
      
      isPowerOfTwo: function(value) {
        return (value & (value - 1)) === 0 && value !== 0;
      },
      
      ceilPowerOfTwo: function(value) {
        return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
      },
      
      floorPowerOfTwo: function(value) {
        return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
      },
      
      // Other math utility functions...
    };
    
    // Vector2 class
    class Vector2 {
      constructor(x = 0, y = 0) {
        this.isVector2 = true;
        this.x = x;
        this.y = y;
      }
      
      get width() { return this.x; }
      set width(value) { this.x = value; }
      
      get height() { return this.y; }
      set height(value) { this.y = value; }
      
      set(x, y) {
        this.x = x;
        this.y = y;
        return this;
      }
      
      // Other Vector2 methods...
    }
    
    // Vector3 class
    class Vector3 {
      constructor(x = 0, y = 0, z = 0) {
        this.isVector3 = true;
        this.x = x;
        this.y = y;
        this.z = z;
      }
      
      // Vector3 methods...
    }
    
    // Matrix3 class
    class Matrix3 {
      constructor() {
        this.isMatrix3 = true;
        this.elements = [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1
        ];
      }
      
      // Matrix3 methods...
    }
    
    // Matrix4 class
    class Matrix4 {
      constructor() {
        this.isMatrix4 = true;
        this.elements = [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ];
      }
      
      // Matrix4 methods...
    }
    
    // EventDispatcher class
    class EventDispatcher {
      addEventListener(type, listener) {
        if (this._listeners === undefined) this._listeners = {};
        
        const listeners = this._listeners;
        
        if (listeners[type] === undefined) {
          listeners[type] = [];
        }
        
        if (listeners[type].indexOf(listener) === -1) {
          listeners[type].push(listener);
        }
      }
      
      hasEventListener(type, listener) {
        if (this._listeners === undefined) return false;
        
        const listeners = this._listeners;
        
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
      }
      
      removeEventListener(type, listener) {
        if (this._listeners === undefined) return;
        
        const listeners = this._listeners[type];
        
        if (listeners !== undefined) {
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      }
      
      dispatchEvent(event) {
        if (this._listeners === undefined) return;
        
        const listeners = this._listeners[event.type];
        
        if (listeners !== undefined) {
          event.target = this;
          
          const listenerArray = listeners.slice(0);
          
          for (let i = 0, l = listenerArray.length; i < l; i++) {
            listenerArray[i].call(this, event);
          }
          
          event.target = null;
        }
      }
    }
    
    // Main Renderer class
    class Renderer {
      constructor(options = {}) {
        this.scene = options.scene;
        this.currentPage = null;
        this.devicePixelRatio = window.devicePixelRatio;
        this.sortWorker = null;
        this.splatRenderCount = 0;
        this.splatSortCount = 0;
        this.splatMesh = null;
        this.sortRunning = false;
        this.meshMatrixWorlds = null;
        this.meshMatrixWorldsOld = null;
        this.cropsArray = null;
        this.splatEntries = null;
        this.queuedMessage = null;
        this.needsInitialRender = true;
        this.dummyPerspectiveMatrix = new Matrix4().makePerspective(-1, 1, -1, 1, 0.1, 1000);
      }
      
      updateSplatMeshUniforms(renderer, camera) {
        const size = new Vector2();
        
        if (this.splatMesh !== null && this.splatMesh.getSplatCount() > 0) {
          renderer.getSize(size);
          
          this.cameraFocalLengthX = camera.projectionMatrix.elements[0] * 
                                   this.devicePixelRatio * size.x * 0.45;
          
          this.cameraFocalLengthY = camera.projectionMatrix.elements[5] * 
                                   this.devicePixelRatio * size.y * 0.45;
          
          this.splatMesh.updateUniforms(
            size,
            this.cameraFocalLengthX,
            this.cameraFocalLengthY,
            camera.isPerspectiveCamera ? -1 : camera.zoom * this.devicePixelRatio
          );
        }
      }
      
      loadSplat(options = {}) {
        this.activePage = this.scene.activePage;
        
        if (options.position) {
          options.position = new Vector3().fromArray(options.position);
        }
        
        if (options.orientation) {
          options.orientation = new Quaternion().fromArray(options.orientation);
        }
        
        options.halfPrecisionCovariances = !!options.halfPrecisionCovariances;
        
        let entries = [];
        this.splatEntries = entries;
        
        this.activePage.traverseVisibleEntity(entity => {
          if (entity.data.type === "Splat") {
            entries.push(entity);
          }
        });
        
        if (this.splatMesh) {
          this.splatMesh.dispose();
        }
        
        if (entries.length === 0) {
          this.splatMesh = null;
          return false;
        }
        
        this.meshMatrixWorlds = entries.map(entry => entry.matrixWorld);
        this.meshMatrixWorldsOld = entries.map(entry => entry.matrixWorld.clone());
        this.cropsArray = entries.map(entry => entry.data.crops.map(crop => crop.data));
        
        let buffers = entries.map(
          entry => new GSplineBuffer(new Uint8Array(entry.data.buffer).buffer)
        );
        
        let totalSplatCount = 0;
        let intervalIndices = [0];
        
        for (let buffer of buffers) {
          totalSplatCount += buffer.getSplatCount();
          intervalIndices.push(totalSplatCount);
        }
        
        this.setupSplatMesh(
          buffers,
          totalSplatCount,
          options.position,
          options.orientation,
          options.halfPrecisionCovariances,
          this.devicePixelRatio,
          intervalIndices,
          this.meshMatrixWorlds
        );
        
        this.setupSortWorker(totalSplatCount);
        
        return true;
      }
      
      updateMatrixWorldsInWorkerIfNeeded() {
        let array = this.splatDataTextures.meshMatrixWorlds.data;
        
        for (let i = 0; i < this.meshMatrixWorlds.length; i++) {
          array.set(this.meshMatrixWorlds[i].elements, 16 * i);
        }
        
        this.splatDataTextures.meshMatrixWorlds.texture.needsUpdate = true;
        
        if (!this.meshMatrixWorlds.every((matrix, i) => matrix.equals(this.meshMatrixWorldsOld[i]))) {
          this.meshMatrixWorldsOld = this.meshMatrixWorlds.map(m => m.clone());
          return true;
        }
        
        return false;
      }
      
      // Other methods...
      
      update(renderer, camera) {
        if (this.splatMesh === null) return;
        
        this.updateSplatMeshUniforms(renderer, camera);
        this.updateView(false, camera);
      }
      
      // Additional methods...
    }
    
    // Return the Renderer class
    return Renderer;
  }
}]); 