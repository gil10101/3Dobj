/**
 * Service Worker for 3D Viewer Application
 * Provides basic caching and offline functionality
 */

const CACHE_NAME = '3d-viewer-v1.0.1';
const STATIC_CACHE_URLS = [
  '/',
  '/assets/viewer.css',
  '/assets/favicon.svg',
  '/assets/favicon.ico',
  '/js/core/Renderer.js',
  '/js/core/GeometryFactory.js',
  '/js/ui/ViewerController.js'
  // External dependencies will be cached when accessed
];

// Install event - cache static resources with better error handling
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        // Cache resources individually to handle 404s gracefully
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                } else {
                  console.warn(`Failed to cache ${url}: ${response.status} ${response.statusText}`);
                  return Promise.resolve(); // Don't fail the entire installation
                }
              })
              .catch(error => {
                console.warn(`Failed to fetch ${url}:`, error);
                return Promise.resolve(); // Don't fail the entire installation
              })
          )
        );
      })
      .then(results => {
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const total = results.length;
        console.log(`Service Worker installed successfully. Cached ${successful}/${total} resources.`);
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip caching for very large files or non-cacheable content
  const url = new URL(event.request.url);
  if (url.searchParams.has('no-cache') || 
      event.request.headers.get('cache-control') === 'no-cache') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or opaque responses from CDNs
            if (!response || response.status !== 200) {
              return response;
            }
            
            // For external CDN resources, cache them if they're successful
            const shouldCache = response.type === 'basic' || 
                              (response.type === 'cors' && url.hostname.includes('cdnjs.cloudflare.com')) ||
                              (response.type === 'cors' && url.hostname.includes('unpkg.com')) ||
                              (response.type === 'cors' && url.hostname.includes('cdn.jsdelivr.net'));
            
            if (shouldCache) {
              // Clone the response as it can only be consumed once
              const responseToCache = response.clone();
              
              // Cache successful responses (don't wait for this to complete)
              caches.open(CACHE_NAME)
                .then(cache => {
                  return cache.put(event.request, responseToCache);
                })
                .catch(error => {
                  console.warn('Failed to cache resource:', event.request.url, error);
                });
            }
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed for:', event.request.url, error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            // For other resources, throw the error to let the browser handle it
            throw error;
          });
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification click event (for future use)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
}); 