/**
 * Amble Service Worker
 * 
 * Provides offline support and caching for the PWA.
 */

const CACHE_NAME = 'amble-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// API endpoints to cache for offline
const API_CACHE_NAME = 'amble-api-cache-v1';
const CACHEABLE_API_ROUTES = [
    '/api/health',
    '/api/moods',
    '/api/activities',
    '/api/appointments'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
                        .map((name) => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activate complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (except for CDN assets)
    if (!url.origin.includes(self.location.origin) && 
        !url.origin.includes('fonts.googleapis.com') &&
        !url.origin.includes('fonts.gstatic.com')) {
        return;
    }

    // API requests - network first, then cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Static assets - cache first, then network
    event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        fetchAndCache(request);
        return cachedResponse;
    }

    return fetchAndCache(request);
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful GET responses
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback for HTML pages
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }

        // Return error response
        return new Response(
            JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
            { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    }
}

// Fetch and cache helper
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Return cached version if available
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        throw error;
    }
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    
    let data = { title: 'Amble', body: 'New notification' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'amble-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Open the app
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
    
    if (event.tag === 'sync-moods') {
        event.waitUntil(syncMoods());
    }
});

// Sync queued messages
async function syncMessages() {
    try {
        const cache = await caches.open('amble-offline-queue');
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/chat')) {
                const cachedResponse = await cache.match(request);
                const data = await cachedResponse.json();
                
                // Retry the request
                await fetch(request.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                // Remove from queue
                await cache.delete(request);
            }
        }
    } catch (error) {
        console.error('[ServiceWorker] Sync messages failed:', error);
    }
}

// Sync queued mood entries
async function syncMoods() {
    try {
        const cache = await caches.open('amble-offline-queue');
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/moods')) {
                const cachedResponse = await cache.match(request);
                const data = await cachedResponse.json();
                
                await fetch(request.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                await cache.delete(request);
            }
        }
    } catch (error) {
        console.error('[ServiceWorker] Sync moods failed:', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('[ServiceWorker] Periodic sync:', event.tag);
    
    if (event.tag === 'check-alerts') {
        event.waitUntil(checkForAlerts());
    }
});

// Check for new alerts
async function checkForAlerts() {
    try {
        const response = await fetch('/api/alerts?unread=true');
        const alerts = await response.json();
        
        if (alerts.length > 0) {
            const latestAlert = alerts[0];
            
            await self.registration.showNotification('Amble Alert', {
                body: latestAlert.message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                tag: `alert-${latestAlert.id}`,
                data: { url: '/family', alertId: latestAlert.id }
            });
        }
    } catch (error) {
        console.error('[ServiceWorker] Check alerts failed:', error);
    }
}
