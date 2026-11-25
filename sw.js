/* 月下占卜 Service Worker：預先快取全部必要檔案，離線可完整使用 */
importScripts('precache-manifest.js');
var CACHE = 'yuexia-' + self.PRECACHE.version;
var FILES = self.PRECACHE.files;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    })
  );
  // 不自動 skipWaiting：有舊版在使用時，由頁面提示「重新載入」後才切換
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('yuexia-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        // 先找該頁本身（例如 docs/credits.html），找不到才回到首頁
        return cache.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || cache.match('index.html');
        }).then(function (hit) {
          return hit || fetch(req);
        });
      }).catch(function () { return fetch(req); })
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || fetch(req);
      });
    })
  );
});
