/**
 * Mobius Browser Shell — Service Worker
 * C-314: PWA offline support + install prompt enablement
 *
 * Strategy:
 *  - /api/*         Network-first (always try live data; fall back to cache)
 *  - Everything else Cache-first (shell assets are immutable-hashed by Vite)
 *
 * Cache is versioned. On activate, old caches are deleted.
 */

const CACHE_NAME = 'mobius-shell-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/world/current-cycle.json',
];

// ── Install: pre-cache shell skeleton ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ── Activate: prune old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (except our own domain)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.endsWith('vercel.app')) return;

  if (url.pathname.startsWith('/api/')) {
    // Network-first: API calls should always be fresh; fall back to cache
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first: Vite assets are content-hashed; serve from cache when available
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
      )
    );
  }
});
