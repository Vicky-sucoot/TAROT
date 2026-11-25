/* 月下占卜：本機儲存（只存在目前裝置的網站儲存空間，不上傳） */
(function (root) {
  'use strict';
  var KEY_HISTORY = 'yuexia.history.v1';
  var KEY_PALETTE = 'yuexia.palette';
  var KEY_FORMAT = 'yuexia.cardFormat';
  var KEY_DATE = 'yuexia.cardDate';
  var KEY_DAILY = 'yuexia.daily';
  var KEY_DAILY_LOG = 'yuexia.dailyLog';
  var KEY_THEME = 'yuexia.theme';
  var PALETTES = ['wine', 'parchment', 'navy'];
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

  var Store;
  Store = {
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
    // 更新單筆紀錄的部分欄位（例如回顧筆記）
    update: function (id, patch) {
      var list = loadHistory(), found = false;
      list.forEach(function (r) {
        if (r.id !== id) return;
        found = true;
        for (var k in patch) { if (patch[k] === null) delete r[k]; else r[k] = patch[k]; }
      });
      return found && saveHistory(list);
    },
    all: function () { return loadHistory(); },
    // 清除本網站在這台裝置上保存的所有資料
    clearAll: function () {
      [KEY_HISTORY, KEY_PALETTE, KEY_FORMAT, KEY_DATE, KEY_DAILY, KEY_DAILY_LOG, KEY_THEME].forEach(function (k) {
        delete memory[k];
        try { root.localStorage.removeItem(k); } catch (e) { /* 忽略 */ }
      });
    },
    // 匯入：依 id 合併，已存在的紀錄不覆蓋
    importMany: function (records) {
      var list = loadHistory(), ids = {}, added = 0, dup = 0;
      list.forEach(function (r) { ids[r.id] = true; });
      records.forEach(function (r) {
        if (ids[r.id]) { dup++; return; }
        ids[r.id] = true; list.push(r); added++;
      });
      var ok = added ? saveHistory(list) : true;
      return { ok: ok, added: added, dup: dup };
    },
    getPalette: function () {
      var p = get(KEY_PALETTE);
      return PALETTES.indexOf(p) >= 0 ? p : 'wine';
    },
    setPalette: function (p) { set(KEY_PALETTE, PALETTES.indexOf(p) >= 0 ? p : 'wine'); },
    getTheme: function () { var t = get(KEY_THEME); return t === 'light' || t === 'system' ? t : 'dark'; },
    setTheme: function (t) { set(KEY_THEME, t === 'light' || t === 'system' ? t : 'dark'); },
    getCardFormat: function () { return get(KEY_FORMAT) === 'square' ? 'square' : 'portrait'; },
    setCardFormat: function (f) { set(KEY_FORMAT, f === 'square' ? 'square' : 'portrait'); },
    getShowDate: function () { return get(KEY_DATE) === '1'; },
    setShowDate: function (on) { set(KEY_DATE, on ? '1' : '0'); },
    // 每日一張：同一天固定同一張牌
    getDaily: function (dateKey) {
      try { var d = JSON.parse(get(KEY_DAILY) || 'null'); return d && d.date === dateKey ? d : null; } catch (e) { return null; }
    },
    setDaily: function (d) {
      set(KEY_DAILY, JSON.stringify(d));
      Store.logDaily(d);
    },
    // 今日指引紀錄：{ 'YYYY-MM-DD': { id, rev, mood?, moodTs? } }
    getDailyLog: function () {
      try { var o = JSON.parse(get(KEY_DAILY_LOG) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
    },
    logDaily: function (d) {
      var log = Store.getDailyLog();
      if (!log[d.date]) { log[d.date] = { id: d.id, rev: !!d.rev }; set(KEY_DAILY_LOG, JSON.stringify(log)); }
    },
    setDailyMood: function (date, text) {
      var log = Store.getDailyLog();
      if (!log[date]) return false;
      if (text) { log[date].mood = text; log[date].moodTs = Date.now(); } else { delete log[date].mood; delete log[date].moodTs; }
      return set(KEY_DAILY_LOG, JSON.stringify(log));
    },
    // 匯入：只補上還沒有的日期；同一天同一張牌而本機沒有心情時補上心情
    importDailyLog: function (incoming) {
      var log = Store.getDailyLog(), added = 0;
      Object.keys(incoming).forEach(function (k) {
        var e = incoming[k];
        if (!log[k]) { log[k] = e; added++; }
        else if (!log[k].mood && e.mood && log[k].id === e.id) { log[k].mood = e.mood; log[k].moodTs = e.moodTs; }
      });
      set(KEY_DAILY_LOG, JSON.stringify(log));
      return added;
    }
  };

  root.STORE = Store;
})(typeof self !== 'undefined' ? self : this);
