self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => {
          // Return cached home page or a basic offline response
          return caches.match('/').then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a basic offline HTML page
            return new Response('Offline - Unable to load page', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        })
    );
    return;
  }

  // Handle requests that might fail due to CSP or network issues
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response && response.status === 200) {
              const clonedResponse = response.clone();
              if (caches) {
                caches.open('dynamic-cache-v1').then((cache) => {
                  cache.put(request, clonedResponse);
                });
              }
              return response;
            }
            return response;
          })
          .catch((error) => {
            // Log the error but don't throw
            console.log('[Service Worker] Fetch error:', error);
            // Return a proper Response object instead of null
            return new Response(null, {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
      .catch((error) => {
        console.log('[Service Worker] Cache error:', error);
        return new Response(null, {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
