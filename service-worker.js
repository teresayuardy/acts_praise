
const CACHE_NAME = "acts-praise-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./index.css",
    "./manifest.json"
];

// Install service worker baru
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Hapus cache versi lama
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Ambil file terbaru dari internet terlebih dahulu
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Hanya menangani file dari website sendiri
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {

                if (response.ok) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseCopy);
                        });
                }

                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(cachedResponse => {

                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Jika halaman tidak tersedia saat offline
                        if (event.request.mode === "navigate") {
                            return caches.match("./index.html");
                        }
                    });
            })
    );
});
