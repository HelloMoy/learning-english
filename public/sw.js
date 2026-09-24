// Install-enabling service worker.
//
// This worker deliberately does nothing, and that is the whole design.
//
// It exists because Chromium refuses to fire `beforeinstallprompt` for a site
// whose service worker carries no `fetch` handler, and without that event the
// app can never offer to install itself on Android or on a desktop. The handler
// below is that handler.
//
// It MUST NOT cache, now or later. The app streams video from a content store a
// worker cannot usefully cache, so a caching worker would add an invalidation
// layer to get wrong and buy nothing — the reasoning recorded in
// `src/app/manifest.ts`, which still stands. The listener never calls
// `respondWith`, which hands every request straight back to the browser's own
// networking; a worker that answers nothing can never answer something stale.
//
// Claiming clients on activate is what lets a replacement take effect on the
// next load instead of after every tab has been closed.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", () => {});
