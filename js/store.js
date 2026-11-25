/* 月下占卜：本機儲存（只存在目前裝置的網站儲存空間，不上傳） */
(function (root) {
  'use strict';
  var KEY_HISTORY = 'yuexia.history.v1';
  var KEY_PALETTE = 'yuexia.palette';
  var memory = {};

  function get(key) {
    try { var v = root.localStorage.getItem(key); return v == null ? memory[key] || null : v; } catch (e) { return memory[key] || null; }
  }
  function set(key, val) {
    memory[key] = val;
    try { root.localStorage.setItem(key, val); return true; } catch (e) { return false; }
  }

  function loadHistory() {
    try {
      var arr = JSON.parse(get(KEY_HISTORY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveHistory(list) { return set(KEY_HISTORY, JSON.stringify(list)); }

  function newestFirst(a, b) { return b.ts - a.ts; }

  var Store = {
    list: function (category) {
      var all = loadHistory().sort(newestFirst);
      if (!category || category === 'all') return all;
      return all.filter(function (r) { return r.category === category; });
    },
    get: function (id) {
      return loadHistory().filter(function (r) { return r.id === id; })[0] || null;
    },
    add: function (record) {
      var list = loadHistory();
      list.push(record);
      var ok = saveHistory(list);
      if (root.navigator && navigator.storage && navigator.storage.persist) {
        try { navigator.storage.persist(); } catch (e) { /* 忽略 */ }
      }
      return ok;
    },
    remove: function (id) {
      saveHistory(loadHistory().filter(function (r) { return r.id !== id; }));
    },
    getPalette: function () {
      var p = get(KEY_PALETTE);
      return p === 'parchment' ? 'parchment' : 'wine';
    },
    setPalette: function (p) { set(KEY_PALETTE, p === 'parchment' ? 'parchment' : 'wine'); }
  };

  root.STORE = Store;
})(typeof self !== 'undefined' ? self : this);
