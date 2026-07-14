// MacTor Invoices — Service Worker
// Strategy: API calls are ALWAYS network-only (live data).
// App shell (HTML/JS/CSS/images) uses cache-first after first load.

const CACHE = 'mactor-v4';
const SHELL = [
  '/invoices',
  '/invoices/login',
  '/manifest.json',
  '/mactor-logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: pre-cache app shell ─────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: delete old caches ──────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // 1. API requests → always network-only (never serve stale data)
  if (
    url.hostname.includes('railway.app') ||
    url.hostname.includes('mactor-inspections') ||
    url.pathname.startsWith('/api/')
  ) {
    e.respondWith(fetch(request));
    return;
  }

  // 2. Non-GET → pass through
  if (request.method !== 'GET') {
    e.respondWith(fetch(request));
    return;
  }

  // 3. Cross-origin assets (fonts, analytics) → network only
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // 4. Navigation (HTML pages) → network-first, fallback to cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/invoices')))
    );
    return;
  }

  // 5. Static assets (JS/CSS/images) → cache-first, update in background
  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      });
      return cached || network;
    })
  );
});
