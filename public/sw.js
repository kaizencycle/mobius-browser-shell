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

  const isApi        = url.pathname.startsWith('/api/');
  // Navigation requests (HTML documents) must be network-first so users always
  // get the latest shell after a deploy. Cache-first would pin stale HTML
  // indefinitely, breaking asset references after content-hash changes.
  const isNavigation = event.request.mode === 'navigate';
  // Vite production assets are content-hashed (e.g. /assets/index-AbCd1234.js)
  // and truly immutable, so cache-first is safe and desirable.
  const isHashedAsset = url.pathname.startsWith('/assets/');

  if (isApi || isNavigation) {
    // Network-first: always try live copy; fall back to cache on failure
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && !isApi) {
            // Cache successful navigation responses for offline fallback
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else if (isHashedAsset) {
    // Cache-first: immutable content-hashed assets never change at a given URL
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
  } else {
    // Everything else (world JSON, manifest, images): network-first with cache fallback
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
  }
});
