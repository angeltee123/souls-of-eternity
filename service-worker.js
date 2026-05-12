const CACHE_NAME = "no-way-out-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./manifest.json"
];

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(["./",'.img/icon-192.png']);
      })
  );
});

self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
