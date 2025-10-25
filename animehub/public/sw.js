// Service Worker for AnimeHub
// Implements caching strategies for better performance and offline support

const CACHE_NAME = 'animehub-v1';
const STATIC_CACHE = 'animehub-static-v1';
const DYNAMIC_CACHE = 'animehub-dynamic-v1';
const API_CACHE = 'animehub-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: ['/static/', '/assets/', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'],
  // API responses - stale while revalidate
  api: ['/api/', '/supabase/'],
  // Images - cache first with fallback
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  // Videos - network first
  videos: ['.mp4', '.webm', '.m3u8']
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/anime',
        '/player',
        '/favorites',
        '/watchlist',
        '/profile',
        '/manifest.json'
      ]);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Determine cache strategy based on request type
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    } else if (isApiRequest(request)) {
      return await staleWhileRevalidate(request, API_CACHE);
    } else if (isImageRequest(request)) {
      return await cacheFirstWithFallback(request, DYNAMIC_CACHE);
    } else if (isVideoRequest(request)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    } else {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
  } catch (error) {
    console.error('Service Worker: Error handling request:', error);
    return await getOfflineFallback(request);
  }
}

// Cache First Strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    throw error;
  }
}

// Stale While Revalidate Strategy - for API requests
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Return cached response immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then((cache) => cache.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch((error) => {
    console.error('Network request failed:', error);
    return cachedResponse;
  });
  
  return cachedResponse || await fetchPromise;
}

// Network First Strategy - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First with Fallback - for images
async function cacheFirstWithFallback(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a placeholder image or default image
    return new Response('', {
      status: 404,
      statusText: 'Image not found'
    });
  }
}

// Helper functions to determine request type
function isStaticAsset(request) {
  const url = new URL(request.url);
  return CACHE_STRATEGIES.static.some(pattern => 
    url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
  );
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return CACHE_STRATEGIES.api.some(pattern => 
    url.pathname.startsWith(pattern)
  );
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return CACHE_STRATEGIES.images.some(ext => 
    url.pathname.toLowerCase().endsWith(ext)
  );
}

function isVideoRequest(request) {
  const url = new URL(request.url);
  return CACHE_STRATEGIES.videos.some(ext => 
    url.pathname.toLowerCase().endsWith(ext)
  );
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return cached response if available
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return a generic offline response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Retry failed requests when back online
  console.log('Service Worker: Background sync triggered');
  
  // You can implement retry logic here for failed API calls
  // This is useful for saving user progress, favorites, etc.
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'animehub-notification',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('Service Worker: Loaded successfully');
