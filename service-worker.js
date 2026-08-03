/**
 * Oversea PenGate service worker
 *
 * Kept intentionally minimal — Chrome/Edge require a controlling SW
 * to show the "Add to Home Screen" install prompt, but this site is
 * fully server-rendered and depends on live Redis / TBS / iApp calls,
 * so we DON'T want to cache the app shell or API responses (would
 * show stale prices / stale login state).
 *
 * Strategy: network-only pass-through. Take control immediately so
 * the very first tab counts as a "controlled page".
 */

const CACHE_NAME = 'opg-v1';

self.addEventListener('install', (event) => {
  // Skip waiting so the SW activates on first load
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of any open tabs immediately
  event.waitUntil(self.clients.claim());
  // Drop any old caches from previous SW versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Pure network pass-through. No caching = always fresh.
  // We only need this listener to exist so Chrome recognises the SW
  // as controlling the page (required for the install prompt).
  // Intentionally no event.respondWith() → browser handles the request natively.
});
