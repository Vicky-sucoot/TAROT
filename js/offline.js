/* 月下占卜：Service Worker 註冊、離線準備檢查、新版本提示 */
(function (root) {
  'use strict';
  var PRE = root.PRECACHE || { version: 'dev', files: [] };
  var CACHE = 'yuexia-' + PRE.version;
  var listeners = [];
  var updateListeners = [];
  var state = { status: 'checking', done: 0, total: PRE.files.length, message: '' };

  function emit(patch) {
    for (var k in patch) state[k] = patch[k];
    listeners.forEach(function (fn) { fn(state); });
  }

  function supported() {
    return 'serviceWorker' in navigator && 'caches' in root && root.isSecureContext !== false;
  }

  // 逐一確認必要檔案都在快取中；缺少的由頁面補抓
  function verify() {
    if (!supported()) {
      emit({ status: 'unsupported', message: '此瀏覽器或環境不支援離線功能。' });
      return Promise.resolve(false);
    }
    emit({ status: 'checking', done: 0, total: PRE.files.length });
    return caches.open(CACHE).then(function (cache) {
      var done = 0, failed = [];
      var queue = PRE.files.slice();
      function worker() {
        if (!queue.length) return Promise.resolve();
        var url = queue.shift();
        return cache.match(url).then(function (hit) {
          if (hit) return;
          return fetch(url, { cache: 'reload' }).then(function (res) {
            if (!res.ok) throw new Error(res.status);
            return cache.put(url, res);
          });
        }).catch(function () { failed.push(url); }).then(function () {
          done++;
          emit({ status: 'preparing', done: done });
          return worker();
        });
      }
      var workers = [];
      for (var i = 0; i < 6; i++) workers.push(worker());
      return Promise.all(workers).then(function () {
        if (failed.length) {
          emit({ status: 'error', message: '有 ' + failed.length + ' 個檔案未能快取。請確認網路連線後重試。' });
          return false;
        }
        // 二次確認：全部檔案都能從快取讀到，才宣告可離線
        return Promise.all(PRE.files.map(function (u) { return cache.match(u); })).then(function (hits) {
          var missing = hits.filter(function (h) { return !h; }).length;
          if (missing) { emit({ status: 'error', message: '仍有 ' + missing + ' 個檔案未快取，請重試。' }); return false; }
          emit({ status: 'ready', done: PRE.files.length });
          return true;
        });
      });
    }).catch(function () {
      emit({ status: 'error', message: '無法使用離線儲存空間，請重試。' });
      return false;
    });
  }

  var waitingWorker = null;
  function onUpdate(fn) { updateListeners.push(fn); }

  function watchRegistration(reg) {
    function check(w) {
      if (!w) return;
      if (w.state === 'installed' && navigator.serviceWorker.controller) {
        waitingWorker = w;
        updateListeners.forEach(function (fn) { fn(); });
      }
    }
    if (reg.waiting && navigator.serviceWorker.controller) check(reg.waiting);
    reg.addEventListener('updatefound', function () {
      var w = reg.installing;
      if (w) w.addEventListener('statechange', function () { check(w); });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') reg.update().catch(function () {});
    });
  }

  function applyUpdate() {
    if (!waitingWorker) { location.reload(); return; }
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloaded) return; reloaded = true; location.reload();
    });
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(function () { if (!reloaded) location.reload(); }, 3000);
  }

  function start() {
    if (!supported()) { emit({ status: 'unsupported', message: '此瀏覽器或環境不支援離線功能。' }); return; }
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      watchRegistration(reg);
      return verify();
    }).catch(function () {
      emit({ status: 'error', message: '離線功能啟用失敗，請重試。' });
    });
  }

  root.OFFLINE = {
    start: start,
    verify: verify,
    applyUpdate: applyUpdate,
    onUpdate: onUpdate,
    subscribe: function (fn) { listeners.push(fn); fn(state); },
    get state() { return state; }
  };
})(typeof self !== 'undefined' ? self : this);
