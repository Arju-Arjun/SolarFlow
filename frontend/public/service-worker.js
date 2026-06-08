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
      fetch(event.request).catch((error) => {
        console.warn("Network request failed for:", event.request.url, error);
        // Gracefully handle network failures for API calls (use 503 Service Unavailable)
        return new Response(
          JSON.stringify({ error: "Network request failed. Backend may be unavailable." }),
          { 
            status: 503, 
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" }
          }
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
          // Return valid 503 status instead of 0
          return new Response(
            JSON.stringify({ error: "Network request failed" }),
            { 
              status: 503, 
              statusText: "Service Unavailable",
              headers: { "Content-Type": "application/json" }
            }
          );
        });
    })
  );
});