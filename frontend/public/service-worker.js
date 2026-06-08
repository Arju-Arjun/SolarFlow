const CACHE_NAME = "lavenir-cache-v2";

const urlsToCache = [
  "/",
  "/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("Cache failed:", url);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Skip caching for API calls and external domains
  if (event.request.url.includes("/api/") || 
      !event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Gracefully handle network failures for API calls
        return new Response(
          JSON.stringify({ error: "Network request failed" }),
          { status: 0, statusText: "Service Worker" }
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch((error) => {
          console.warn("Fetch failed for:", event.request.url, error);
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Network request failed", { status: 0 });
        });
    })
  );
});