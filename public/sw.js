// Service Worker for Workout Tracker PWA
const CACHE_NAME = 'workout-tracker-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './manifest.json',
  './src/app.js',
  './src/core/constants.js',
  './src/core/dom.js',
  './src/core/storage.js',
  './src/core/rowState.js',
  './src/theme/theme.js',
  './src/routines/parseCsv.js',
  './src/routines/ids.js',
  './src/routines/index.js',
  './src/ui/modal.js',
  './src/ui/select.js',
  './src/ui/drawer.js',
  './src/ui/calendar.js',
  './src/features/video.js',
  './src/features/estimates.js',
  './src/features/dayEditor.js',
  './routines/manifest.json',
  './routines/shred.json',
  './routines/size.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then(fetchResponse => {
          // Cache new requests
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page or error
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
