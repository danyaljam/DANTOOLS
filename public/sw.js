const CACHE_NAME = "dantools-offline-v1";
const PRELOAD_URLS = [
  "/",
  "/tools/pdf-ocr",
  "/pdf.worker.min.mjs",
  "/tesseract/worker.min.js",
  "/tesseract/core/tesseract-core-lstm.wasm",
  "/tesseract/core/tesseract-core-lstm.wasm.js",
  "/tesseract/core/tesseract-core-simd-lstm.wasm",
  "/tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm",
  "/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js",
  "/tesseract/lang/4.0.0_best_int/eng.traineddata.gz",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRELOAD_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      } catch {
        // A missing optional route must not prevent the service worker installing.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter((name) => name.startsWith("dantools-offline-") && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (request.mode === "navigate") {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request, { ignoreSearch: true }))
          || (await cache.match("/tools/pdf-ocr"))
          || (await cache.match("/"));
      }
    }

    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return new Response("Offline and this resource has not been cached yet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});