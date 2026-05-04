const CACHE_NAME = 'notas-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/global.css',
  '/css/dashboard.css',
  '/css/editor.css',
  '/js/services/storage.js',
  '/js/services/push.js',
  '/js/services/photo.js',
  '/js/components/noteCard.js',
  '/js/components/editorMenu.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS.map(url =>
        cache.add(url).catch(() => console.warn('[SW] Não cacheado:', url))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      }).catch(() => {
        if (event.request.destination === 'document')
          return caches.match('/index.html');
      });
    })
  );
});

/* ── Push recebido do servidor (futuro) ─────────── */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Lembrete', {
      body:    data.body    || 'Você tem uma nota com lembrete!',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      tag:     data.tag    || 'nota-push',
      data:    data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',    title: 'Abrir nota' },
        { action: 'dismiss', title: 'Dispensar'  },
      ],
    })
  );
});

/* ── Clique na notificação ──────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) {
        list[0].focus();
        return;
      }
      clients.openWindow('/');
    })
  );
});
