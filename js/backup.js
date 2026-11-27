/* 月下占卜：紀錄備份檔的產生與驗證
 * 備份檔是一般的 JSON 檔，只在使用者的裝置上產生與讀取，不會上傳。
 * 匯入時一律重新檢查每個欄位，不符合格式的紀錄會被略過，文字長度也會被限制。
 */
(function (root) {
  'use strict';
  var T = root.TAROT, RD = root.READING;
  var FORMAT = 'yuexia-backup';
  var VERSION = 1;
  var MAX_BYTES = 5 * 1024 * 1024;

  function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  function strArr(v, maxItems, maxLen) {
    return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }).slice(0, maxItems).map(function (x) { return x.slice(0, maxLen); }) : null;
  }
  function newId() { return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  // 檢查保存的解讀是否完整；不完整就依牌面重新產生
  function cleanReading(reading, rec) {
    var sp = RD.SPREADS[rec.spread];
    var ok = reading && typeof reading === 'object' && typeof reading.summary === 'string' && typeof reading.question === 'string' &&
      typeof reading.publicLine === 'string' && Array.isArray(reading.cards) && reading.cards.length === rec.cards.length;
    if (ok) {
      var cards = reading.cards.map(function (c, i) {
        if (!c || c.id !== rec.cards[i].id || !!c.rev !== rec.cards[i].rev) return null;
        var kw = strArr(c.keywords, 6, 40), body = strArr(c.body, 8, 600);
        if (!kw || !body) return null;
        return {
          position: sp.positions[i], id: c.id, rev: !!c.rev, name: T.BY_ID[c.id].name,
          orientation: c.rev ? '逆位' : '正位', keywords: kw, body: body, step: str(c.step, 300)
        };
      });
      if (cards.every(Boolean)) {
        var combos = Array.isArray(reading.combos) ? reading.combos.filter(function (x) { return x && typeof x.title === 'string' && typeof x.text === 'string'; })
          .slice(0, 3).map(function (x) { return { title: x.title.slice(0, 40), text: x.text.slice(0, 400) }; }) : [];
        return {
          summary: str(reading.summary, 2000), focus: str(reading.focus, 400), cards: cards, combos: combos,
          question: str(reading.question, 400), publicLine: str(reading.publicLine, 200)
        };
      }
    }
    return RD.interpret({ spread: rec.spread, option: rec.option, cards: rec.cards });
  }

  function cleanRecord(r) {
    if (!r || typeof r !== 'object') return null;
    var sp = RD.SPREADS[r.spread];
    if (!sp || !Array.isArray(r.cards) || r.cards.length !== sp.positions.length) return null;
    var seen = {};
    var cards = [];
    for (var i = 0; i < r.cards.length; i++) {
      var c = r.cards[i];
      if (!c || typeof c.id !== 'string' || !T.BY_ID[c.id] || seen[c.id]) return null;
      seen[c.id] = true;
      cards.push({ id: c.id, rev: c.rev === true });
    }
    var ts = Number(r.ts);
    if (!isFinite(ts) || ts < 946684800000 || ts > Date.now() + 86400000) return null;
    var optionIds = sp.options.map(function (o) { return o.id; });
    var option = optionIds.indexOf(r.option) >= 0 ? r.option : (r.spread === 'relation' ? 'none' : 'general');
    var rec = {
      id: typeof r.id === 'string' && /^[A-Za-z0-9]{1,40}$/.test(r.id) ? r.id : newId(),
      ts: ts,
      spread: r.spread,
      option: option,
      category: RD.categoryOf(r.spread, option),
      question: str(r.question, 200),
      cards: cards
    };
    if (r.spread === 'choice' && r.choices && typeof r.choices === 'object') {
      var a = str(r.choices.a, 40), b = str(r.choices.b, 40);
      if (a || b) rec.choices = { a: a, b: b };
    }
    if (r.note && typeof r.note === 'object' && typeof r.note.text === 'string' && r.note.text.trim()) {
      var nts = Number(r.note.ts);
      rec.note = { text: r.note.text.slice(0, 2000), ts: isFinite(nts) ? nts : ts };
    }
    rec.reading = cleanReading(r.reading, rec);
    return rec;
  }

  function cleanDailyLog(o) {
    var out = {};
    if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
    Object.keys(o).slice(0, 5000).forEach(function (k) {
      var e = o[k];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !e || typeof e.id !== 'string' || !T.BY_ID[e.id]) return;
      var c = { id: e.id, rev: e.rev === true };
      if (typeof e.mood === 'string' && e.mood.trim()) { c.mood = e.mood.slice(0, 200); c.moodTs = isFinite(Number(e.moodTs)) ? Number(e.moodTs) : 0; }
      out[k] = c;
    });
    return out;
  }

  function build(records, settings, dailyLog) {
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: Date.now(),
      settings: settings || {},
      records: records,
      dailyLog: dailyLog || {}
    };
  }

  /** 解析備份檔文字。格式錯誤時丟出帶有中文說明的 Error。 */
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('檔案是空的。');
    if (text.length > MAX_BYTES) throw new Error('檔案太大，不像是月下占卜的備份檔。');
    var data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('無法讀取這個檔案，請確認是月下占卜匯出的備份檔。'); }
    if (!data || data.format !== FORMAT || !Array.isArray(data.records)) throw new Error('這不是月下占卜的備份檔。');
    var records = [], skipped = 0;
    data.records.forEach(function (r) {
      var c = cleanRecord(r);
      if (c) records.push(c); else skipped++;
    });
    var s = data.settings && typeof data.settings === 'object' ? data.settings : {};
    var settings = {
      palette: ['wine', 'parchment', 'navy'].indexOf(s.palette) >= 0 ? s.palette : null,
      format: s.format === 'square' || s.format === 'portrait' ? s.format : null,
      showDate: typeof s.showDate === 'boolean' ? s.showDate : null,
      theme: s.theme === 'dark' || s.theme === 'light' || s.theme === 'system' ? s.theme : null,
      reversals: typeof s.reversals === 'boolean' ? s.reversals : null
    };
    return { records: records, skipped: skipped, settings: settings, dailyLog: cleanDailyLog(data.dailyLog), exportedAt: Number(data.exportedAt) || null };
  }

  root.BACKUP = { build: build, parse: parse, cleanRecord: cleanRecord };
})(typeof self !== 'undefined' ? self : this);
