const CACHE_NAME = "keralam-stream-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
  "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch Event (Network First Strategy for media/playlists, Cache Fallback for structural assets)
self.addEventListener("fetch", (event) => {
  // Do not cache multimedia video/audio streams or external m3u files
  if (
    event.request.url.includes(".m3u8") ||
    event.request.url.includes(".mp3") ||
    event.request.url.includes(".aac") ||
    event.request.url.includes("/live/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful response, clone it to cache for core app structure
        if (
          response &&
          response.status === 200 &&
          event.request.method === "GET"
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: try to return from cache
        return caches.match(event.request);
      }),
  );
});
