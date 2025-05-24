const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.argv.includes('--dev');

// Security and CORS configuration
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static file serving with proper MIME types
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Serve JavaScript files from public directory with proper MIME types
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve static files from public directory (for service worker, etc.)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoint for renderer info
app.get('/api/renderer-info', (req, res) => {
  try {
    const stats = {
      availableRenderers: ['three.js', 'basic-fallback'],
      capabilities: ['rotation', 'wireframe', 'basic-shapes'],
      version: '1.0.0'
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get renderer info' });
  }
});

// Main application route
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback to old viewer for now
      res.sendFile(path.join(__dirname, '3d_viewer.html'));
    }
  } catch (error) {
    console.error('Error serving main page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Debug route
app.get('/debug', (req, res) => {
  try {
    const debugPath = path.join(__dirname, 'debug.html');
    if (fs.existsSync(debugPath)) {
      res.sendFile(debugPath);
    } else {
      res.status(404).send('Debug page not found');
    }
  } catch (error) {
    console.error('Error serving debug page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Service Worker test route
app.get('/test-sw', (req, res) => {
  try {
    const testPath = path.join(__dirname, 'test-sw.html');
    if (fs.existsSync(testPath)) {
      res.sendFile(testPath);
    } else {
      res.status(404).send('Service Worker test page not found');
    }
  } catch (error) {
    console.error('Error serving test page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: isDev ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 3D Viewer Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${__dirname}`);
  if (isDev) {
    console.log('🔧 Development mode enabled');
  }
});

module.exports = app; 