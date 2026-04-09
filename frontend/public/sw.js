const CACHE_NAME = "discipline-tracker-v2";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
  "/apple-touch-icon.svg",
];

function isCacheableRequest(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith("/api/")) {
    return false;
  }

  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    );

    if ("navigationPreload" in self.registration) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (!isCacheableRequest(event.request)) {
    return;
  }

  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preloadResponse = await event.preloadResponse;

        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/", networkResponse.clone());
        return networkResponse;
      } catch (_error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match("/");
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(request);
    const networkFetch = fetch(request)
      .then(async (response) => {
        if (response && response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;
      })
      .catch(() => cachedResponse);

    return cachedResponse || networkFetch;
  })());
});
