const CACHE_NAME = 'servego-partner-v1';
const ASSETS = [
  '/partner/portal',
  '/partner/login',
  '/logo.png',
  '/partner-manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('firestore.googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// Push event listener for background notifications
self.addEventListener('push', (e) => {
  let data = {
    title: '🚨 NEW DISPATCH LEAD!',
    body: 'A new service request is available in your area. Open the app now to accept!',
    tag: 'new-lead'
  };

  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      console.warn("Push payload was not JSON, reading as text:", err);
      data = {
        title: '🚨 NEW DISPATCH LEAD!',
        body: e.data.text(),
        tag: 'new-lead'
      };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'new-lead',
    vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 500],
    requireInteraction: true,
    data: {
      url: '/partner/portal'
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click event listener to open portal tab on tap
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  
  const targetUrl = e.notification.data?.url || '/partner/portal';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const url = new URL(client.url);
        if (url.pathname === targetUrl || url.pathname.startsWith('/partner/portal')) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
