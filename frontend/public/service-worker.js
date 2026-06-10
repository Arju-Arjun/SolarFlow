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
  if (event.request.url.includes("/api/") || 
      !event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.warn("Network request failed for:", event.request.url, error);
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

// ==========================================================================
// 💡 NEW: PWA WEB PUSH NOTIFICATION LISTENERS
// ==========================================================================
self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: "/logo192.png", 
        badge: "/logo192.png",
        vibrate: [100, 50, 100],
        data: {
          url: data.url || "/dashboard"
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error("Push event data parsing failed:", e);
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      const targetUrl = event.notification.data.url;
      
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});