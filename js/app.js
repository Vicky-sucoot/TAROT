/* 月下占卜：主程式 */
(function () {
  'use strict';
  var T = window.TAROT, RD = window.READING, ST = window.STORE, RC = window.RESULTCARD, OFF = window.OFFLINE;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function isReduced() { return !!(reduceMotion && reduceMotion.matches); }

  // ───── 工具 ─────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function rand(n) {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1), lim = Math.floor(0xffffffff / n) * n;
      do { crypto.getRandomValues(a); } while (a[0] >= lim);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fileStamp(ts) {
    var d = new Date(ts);
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
  }
  var toastTimer;
  function toast(msg) {
    var el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function confirmBox(text) {
    return new Promise(function (resolve) {
      var m = $('confirm-modal');
      $('confirm-text').textContent = text;
      m.hidden = false;
      $('confirm-ok').focus();
      function done(v) { m.hidden = true; $('confirm-ok').onclick = $('confirm-cancel').onclick = null; resolve(v); }
      $('confirm-ok').onclick = function () { done(true); };
      $('confirm-cancel').onclick = function () { done(false); };
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ───── 牌面元件 ─────
  function artHTML(id, rev) {
    var c = T.BY_ID[id];
    return '<img class="' + (rev ? 'art-rev' : '') + '" src="' + c.img + '" alt="' + esc(c.name) + (rev ? '（逆位，插畫倒置）' : '') + '">';
  }
  function oriHTML(rev) { return '<span class="ori ' + (rev ? 'ori-rv' : 'ori-up') + '">' + (rev ? '逆位' : '正位') + '</span>'; }

  function staticTile(pos, id, rev) {
    var c = T.BY_ID[id];
    return '<div class="tile"><div class="tile-pos">' + esc(pos) + '</div>' +
      '<div class="tile-card is-flipped"><div class="flipper"><div class="face face-front">' + artHTML(id, rev) + '</div></div></div>' +
      '<div class="tile-cap"><span class="tile-name">' + esc(c.name) + '</span>' + oriHTML(rev) + '</div></div>';
  }

  // ───── 路由 ─────
  var VIEWS = ['home', 'setup', 'draw', 'history', 'record'];
  var draw = null; // 目前這一局
  var setupSpread = 'guide';
  var setupOption = { guide: 'general', relation: 'none' };
  var historyFilter = 'all';

  function show(view, title) {
    VIEWS.forEach(function (v) { $('view-' + v).hidden = v !== view; });
    $('topbar-title').textContent = title || '月下占卜';
    $('btn-back').hidden = view === 'home';
    $('btn-home').hidden = view === 'home';
    window.scrollTo(0, 0);
  }
  function go(hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  }
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'setup' && RD.SPREADS[parts[1]]) return showSetup(parts[1]);
    if (parts[0] === 'draw' && draw) return show('draw', draw.spreadDef.name);
    if (parts[0] === 'history') return showHistory();
    if (parts[0] === 'record' && parts[1]) return showRecord(decodeURIComponent(parts[1]));
    if (parts[0] && parts[0] !== '') { history.replaceState(null, '', location.pathname + location.search); }
    show('home');
  }
  window.addEventListener('hashchange', route);
  $('btn-back').onclick = function () {
    var h = location.hash;
    if (h.indexOf('#/record/') === 0) go('#/history');
    else if (h.indexOf('#/draw') === 0 && draw) go('#/setup/' + draw.spread);
    else go('#/');
  };
  $('btn-home').onclick = function () { go('#/'); };

  // ───── 首頁 ─────
  Array.prototype.forEach.call(document.querySelectorAll('[data-start]'), function (b) {
    b.onclick = function () { go('#/setup/' + b.getAttribute('data-start')); };
  });
  $('btn-history').onclick = function () { historyFilter = 'all'; go('#/history'); };
  $('btn-share-site').onclick = function () {
    var url = location.origin + location.pathname; // 只分享公開首頁，不含任何占卜內容
    if (navigator.share) {
      navigator.share({ title: '月下占卜', text: '在月光下，聽見自己的答案。一起來抽三張牌吧！', url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('已複製網站網址'); }, function () { window.prompt('複製網站網址', url); });
    } else {
      window.prompt('複製網站網址', url);
    }
  };
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) { $('standalone-note').hidden = false; }

  // 離線狀態
  OFF.subscribe(function (s) {
    var dot = $('offline-dot'), txt = $('offline-text'), prog = $('offline-progress'), retry = $('btn-offline-retry');
    dot.className = 'offline-dot';
    retry.hidden = true; prog.hidden = true;
    if (s.status === 'ready') { dot.classList.add('ok'); txt.textContent = '已可離線使用'; }
    else if (s.status === 'preparing' || s.status === 'checking') {
      dot.classList.add('busy');
      txt.textContent = s.status === 'checking' ? '正在檢查離線狀態…' : '正在準備離線使用（' + s.done + '／' + s.total + '）';
      prog.hidden = s.status === 'checking';
      $('offline-bar').style.width = Math.round((s.done / Math.max(1, s.total)) * 100) + '%';
    } else if (s.status === 'error') {
      dot.classList.add('err'); txt.textContent = '離線準備未完成。' + (s.message || ''); retry.hidden = false;
    } else if (s.status === 'unsupported') {
      txt.textContent = s.message || '此環境不支援離線功能。';
    }
  });
  $('btn-offline-retry').onclick = function () { OFF.verify(); };
  OFF.onUpdate(function () { $('update-banner').hidden = false; });
  $('btn-update').onclick = function () { $('btn-update').disabled = true; OFF.applyUpdate(); };

  // ───── 設定 ─────
  function showSetup(spreadId) {
    setupSpread = spreadId;
    var sp = RD.SPREADS[spreadId];
    $('setup-heading').textContent = sp.name;
    $('setup-positions').textContent = '牌位：' + sp.positions.join('／');
    $('setup-legend').textContent = spreadId === 'guide' ? '選擇主題' : '目前的感情情境（可略過）';
    $('setup-question').placeholder = spreadId === 'guide' ? '例如：最近的工作該怎麼調整步調？' : '例如：我該怎麼和對方溝通我的想法？';
    renderOptionChips();
    show('setup', sp.name);
  }
  function renderOptionChips() {
    var sp = RD.SPREADS[setupSpread];
    var cur = setupOption[setupSpread];
    $('setup-options').innerHTML = sp.options.map(function (o) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (o.id === cur) + '" data-opt="' + o.id + '">' + o.label + '</button>';
    }).join('');
    var hint = '';
    if (setupSpread === 'relation') {
      hint = {
        ambig: '曖昧中：著重觀察互動、釐清期待，確認彼此的步調。',
        dating: '交往中：著重相處模式、需求表達與溝通方式。',
        after: '分開後：著重整理情緒、建立界線，思考自己的下一步。',
        none: '略過情境：以你的感受、可觀察的互動與溝通選擇來解讀。'
      }[cur];
    } else {
      hint = { love: '感情：聚焦你的感受、可觀察的互動與溝通選擇。', work: '工作：聚焦節奏、合作與下一步行動。', money: '財運：聚焦消費、風險與資源分配。', general: '綜合：看看生活整體的狀態。' }[cur];
    }
    $('setup-option-hint').textContent = hint;
    Array.prototype.forEach.call($('setup-options').children, function (b) {
      b.onclick = function () { setupOption[setupSpread] = b.getAttribute('data-opt'); renderOptionChips(); };
    });
  }
  $('btn-shuffle').onclick = function () {
    startDraw(setupSpread, setupOption[setupSpread], $('setup-question').value.trim());
  };

  // ───── 抽牌 ─────
  function startDraw(spreadId, option, question) {
    var sp = RD.SPREADS[spreadId];
    draw = {
      spread: spreadId, spreadDef: sp, option: option, question: question,
      deck: shuffled(T.CARDS.map(function (c) { return c.id; })),
      picks: [], flipped: 0, reading: null, savedId: null, ts: Date.now(), busy: false
    };
    $('draw-heading').textContent = sp.name;
    var meta = spreadId === 'guide' ? '主題：' + RD.TOPIC_LABEL[option] : (option !== 'none' ? '情境：' + RD.CONTEXT_LABEL[option] : '情境：略過');
    $('draw-meta').textContent = meta + '・' + sp.positions.join('／');
    $('draw-question').hidden = !question;
    $('draw-question').textContent = question ? '你的提問：' + question : '';
    $('reading').hidden = true; $('reading').innerHTML = '';
    buildSlots();
    buildDeck();
    setMode('swipe');
    $('pick-area').hidden = true;
    go('#/draw');
    // 洗牌動畫
    var st = $('draw-status');
    st.innerHTML = '<div class="shuffle-stage" aria-hidden="true"><img src="cards/back.svg" alt=""><img src="cards/back.svg" alt=""><img src="cards/back.svg" alt=""></div>洗牌中…';
    wait(isReduced() ? 250 : 1600).then(function () {
      if (!draw || draw.picks.length) return;
      st.textContent = '請選出 3 張牌';
      $('pick-area').hidden = false;
    });
  }

  function buildSlots() {
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<div class="tile" id="slot-' + i + '"><div class="tile-pos">' + esc(draw.spreadDef.positions[i]) + '</div>' +
        '<button type="button" class="tile-card is-empty" data-slot="' + i + '" aria-label="' + esc(draw.spreadDef.positions[i]) + '：尚未放牌" disabled>' +
        '<div class="flipper"></div></button><div class="tile-cap"></div></div>';
    }
    $('slots').innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll('[data-slot]'), function (b) {
      b.onclick = function () { flip(parseInt(b.getAttribute('data-slot'), 10)); };
    });
  }
  function fillSlot(i) {
    var p = draw.picks[i];
    var btn = document.querySelector('[data-slot="' + i + '"]');
    btn.classList.remove('is-empty');
    btn.querySelector('.flipper').innerHTML = '<div class="face face-back"><img src="cards/back.svg" alt=""></div><div class="face face-front">' + artHTML(p.id, p.rev) + '</div>';
    btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：已放牌，尚未翻開');
  }
  function clearSlots() {
    for (var i = 0; i < 3; i++) {
      var btn = document.querySelector('[data-slot="' + i + '"]');
      btn.className = 'tile-card is-empty'; btn.disabled = true;
      btn.querySelector('.flipper').innerHTML = '';
      btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：尚未放牌');
    }
  }
  function buildDeck() {
    var html = '';
    draw.deck.forEach(function (id, idx) {
      html += '<button type="button" class="deck-card" data-card="' + id + '" aria-label="第 ' + (idx + 1) + ' 張牌背"><img src="cards/back.svg" alt=""></button>';
    });
    var sc = $('deck-scroller');
    sc.innerHTML = html;
    sc.scrollLeft = 0;
    Array.prototype.forEach.call(sc.children, function (b) {
      b.onclick = function () { pick(b.getAttribute('data-card'), b); };
    });
  }
  function setMode(m) {
    $('tab-swipe').classList.toggle('is-active', m === 'swipe');
    $('tab-quick').classList.toggle('is-active', m === 'quick');
    $('tab-swipe').setAttribute('aria-selected', m === 'swipe');
    $('tab-quick').setAttribute('aria-selected', m === 'quick');
    $('panel-swipe').hidden = m !== 'swipe';
    $('panel-quick').hidden = m !== 'quick';
  }
  $('tab-swipe').onclick = function () { setMode('swipe'); };
  $('tab-quick').onclick = function () { setMode('quick'); };

  function updatePickStatus() {
    var n = draw.picks.length;
    $('draw-status').textContent = n < 3 ? '已選 ' + n + ' 張，還需 ' + (3 - n) + ' 張' : '';
    $('btn-quick').textContent = n > 0 ? '重新快速抽三張' : '快速抽三張';
  }

  function addPick(id) {
    if (draw.picks.length >= 3) return false;
    if (draw.picks.some(function (p) { return p.id === id; })) return false; // 同一局不重複
    draw.picks.push({ id: id, rev: rand(2) === 1 });
    var b = document.querySelector('.deck-card[data-card="' + id + '"]');
    if (b) b.hidden = true;
    fillSlot(draw.picks.length - 1);
    return true;
  }
  function pick(id) {
    if (!draw || draw.busy || draw.picks.length >= 3) return;
    if (!addPick(id)) return;
    updatePickStatus();
    if (draw.picks.length === 3) onFull();
  }

  $('btn-quick').onclick = function () {
    if (!draw || draw.busy || draw.picks.length >= 3) return;
    var n = draw.picks.length;
    var p = n > 0 ? confirmBox('你已手選 ' + n + ' 張牌。快速抽三張會重新抽選全部三張，確定嗎？') : Promise.resolve(true);
    p.then(function (ok) {
      if (!ok) return;
      draw.busy = true;
      draw.picks = [];
      clearSlots();
      Array.prototype.forEach.call($('deck-scroller').children, function (b) { b.hidden = false; });
      var chosen = shuffled(draw.deck).slice(0, 3);
      var step = isReduced() ? 0 : 260;
      chosen.reduce(function (pr, id) {
        return pr.then(function () { addPick(id); updatePickStatus(); return wait(step); });
      }, Promise.resolve()).then(function () { draw.busy = false; onFull(); });
    });
  };

  function onFull() {
    $('pick-area').hidden = true;
    markNext();
  }
  function markNext() {
    for (var i = 0; i < 3; i++) {
      var btn = document.querySelector('[data-slot="' + i + '"]');
      var next = i === draw.flipped;
      btn.classList.toggle('is-next', next);
      btn.disabled = !next;
      if (next) btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：點擊翻牌');
    }
    if (draw.flipped < 3) $('draw-status').textContent = '請依序點擊牌面翻牌（第 ' + (draw.flipped + 1) + '／3 張）';
  }
  function flip(i) {
    if (!draw || draw.picks.length < 3 || i !== draw.flipped) return;
    var p = draw.picks[i], c = T.BY_ID[p.id];
    var btn = document.querySelector('[data-slot="' + i + '"]');
    btn.classList.remove('is-next');
    btn.classList.add('is-flipped');
    btn.disabled = true;
    btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：' + c.name + (p.rev ? '逆位' : '正位'));
    draw.flipped++;
    var cap = $('slot-' + i).querySelector('.tile-cap');
    wait(isReduced() ? 50 : 450).then(function () {
      cap.innerHTML = '<span class="tile-name">' + esc(c.name) + '</span>' + oriHTML(p.rev);
    });
    if (draw.flipped < 3) markNext();
    else {
      $('draw-status').textContent = '三張牌都翻開了';
      wait(isReduced() ? 100 : 750).then(showLiveReading);
    }
  }

  // ───── 解讀 ─────
  function readingHTML(rec) {
    var r = rec.reading;
    var h = '<div class="reading-block"><h3>整體摘要</h3><p>' + esc(r.summary) + '</p><p class="reading-focus">' + esc(r.focus) + '</p></div>';
    h += '<div class="reading-block"><h3>逐張解讀</h3>';
    r.cards.forEach(function (c) {
      h += '<details class="reading-detail"><summary><span class="rd-thumb">' + artHTML(c.id, c.rev) + '</span><span><span class="rd-pos">' + esc(c.position) + '</span>' +
        '<span class="rd-name">' + esc(c.name) + '</span> ' + oriHTML(c.rev) + '</span></summary><div class="rd-body">' +
        '<p>' + c.keywords.map(function (k) { return '<span class="kw">' + esc(k) + '</span>'; }).join('') + '</p>' +
        c.body.map(function (b) { return '<p>' + esc(b) + '</p>'; }).join('') +
        (c.step ? '<p class="rd-step">' + esc(c.step) + '</p>' : '') + '</div></details>';
    });
    h += '</div><div class="reading-block"><h3>給自己的提問</h3><p class="self-q">' + esc(r.question) + '</p></div>';
    return h;
  }
  function cardData(rec) {
    var sp = RD.SPREADS[rec.spread];
    return {
      spreadName: sp.name,
      publicLine: rec.reading.publicLine,
      cards: rec.cards.map(function (c, i) { return { id: c.id, rev: c.rev, name: T.BY_ID[c.id].name, position: sp.positions[i] }; }),
      ts: rec.ts
    };
  }

  function showLiveReading() {
    if (!draw) return;
    draw.reading = RD.interpret({ spread: draw.spread, option: draw.option, cards: draw.picks });
    var rec = liveRecord();
    var el = $('reading');
    el.innerHTML = readingHTML(rec) +
      '<div class="actions">' +
      '<button class="btn btn-primary" type="button" id="btn-save">儲存結果</button>' +
      '<button class="btn btn-ghost" type="button" id="btn-restart">重新占卜</button>' +
      '<button class="btn btn-ghost" type="button" id="btn-preview">預覽結果卡</button>' +
      '<button class="btn btn-ghost" type="button" id="btn-download">下載 PNG</button>' +
      '</div>';
    el.hidden = false;
    $('btn-save').onclick = saveLive;
    $('btn-restart').onclick = function () { draw = null; go('#/setup/' + rec.spread); $('setup-question').value = ''; };
    $('btn-preview').onclick = function () { openCardModal(cardData(rec)); };
    $('btn-download').onclick = function () { downloadCard(cardData(rec)); };
    setTimeout(function () { el.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'start' }); }, 60);
  }
  function liveRecord() {
    return {
      id: draw.savedId || (Date.now().toString(36) + rand(1e6).toString(36)),
      ts: draw.ts, spread: draw.spread, option: draw.option,
      category: RD.categoryOf(draw.spread, draw.option),
      question: draw.question,
      cards: draw.picks.map(function (p) { return { id: p.id, rev: p.rev }; }),
      reading: draw.reading
    };
  }
  function saveLive() {
    if (!draw || draw.savedId) return;
    var rec = liveRecord();
    if (ST.add(rec)) {
      draw.savedId = rec.id;
      $('btn-save').textContent = '已儲存';
      $('btn-save').disabled = true;
      toast('已儲存到這台裝置的歷史紀錄');
    } else {
      toast('儲存空間無法使用，紀錄未能保存');
    }
  }

  // ───── 歷史紀錄 ─────
  function showHistory() {
    $('history-filters').innerHTML = RD.CATEGORIES.map(function (c) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (c.id === historyFilter) + '" data-filter="' + c.id + '">' + c.label + '</button>';
    }).join('');
    Array.prototype.forEach.call($('history-filters').children, function (b) {
      b.onclick = function () { historyFilter = b.getAttribute('data-filter'); showHistory(); };
    });
    var list = ST.list(historyFilter);
    $('history-list').innerHTML = list.map(function (r) {
      var sp = RD.SPREADS[r.spread];
      var tag = RD.CATEGORIES.filter(function (c) { return c.id === r.category; })[0];
      var sub = r.spread === 'relation' && r.option && r.option !== 'none' ? '・' + RD.CONTEXT_LABEL[r.option] : '';
      return '<li class="history-item"><button type="button" data-rec="' + esc(r.id) + '">' +
        '<span class="hi-thumbs">' + r.cards.map(function (c) { return '<span class="hi-thumb">' + artHTML(c.id, c.rev) + '</span>'; }).join('') + '</span>' +
        '<span class="hi-meta"><span class="hi-title">' + esc(sp.name) + '<span class="hi-tag">' + (tag ? tag.label : '') + sub + '</span></span>' +
        '<span class="hi-date">' + fmtDate(r.ts) + '</span>' +
        '<span class="hi-cards">' + r.cards.map(function (c) { return esc(T.BY_ID[c.id].name) + (c.rev ? '（逆）' : ''); }).join('・') + '</span>' +
        (r.question ? '<span class="hi-cards">「' + esc(r.question) + '」</span>' : '') +
        '</span></button></li>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-rec]'), function (b) {
      b.onclick = function () { go('#/record/' + encodeURIComponent(b.getAttribute('data-rec'))); };
    });
    var empty = $('history-empty');
    empty.hidden = list.length > 0;
    empty.textContent = historyFilter === 'all' ? '還沒有儲存的占卜紀錄' : '目前沒有這個主題的占卜紀錄';
    show('history', '歷史紀錄');
  }

  function showRecord(id) {
    var r = ST.get(id);
    if (!r) { toast('找不到這筆紀錄'); go('#/history'); return; }
    var sp = RD.SPREADS[r.spread];
    var cat = RD.CATEGORIES.filter(function (c) { return c.id === r.category; })[0];
    var meta = fmtDate(r.ts) + '・' + (cat ? cat.label : '');
    if (r.spread === 'relation') meta += '・情境：' + (r.option && r.option !== 'none' ? RD.CONTEXT_LABEL[r.option] : '略過');
    var h = '<h2 class="view-heading">' + esc(sp.name) + '</h2><p class="record-meta">' + esc(meta) + '</p>' +
      (r.question ? '<p class="draw-question">你的提問：' + esc(r.question) + '</p>' : '') +
      '<div class="slots">' + r.cards.map(function (c, i) { return staticTile(sp.positions[i], c.id, c.rev); }).join('') + '</div>' +
      '<div class="reading">' + readingHTML(r) + '</div>' +
      '<div class="actions"><button class="btn btn-primary" type="button" id="rec-preview">預覽結果卡</button>' +
      '<button class="btn btn-ghost" type="button" id="rec-download">下載 PNG</button>' +
      '<button class="btn btn-ghost btn-danger btn-block" type="button" id="rec-delete">刪除這筆紀錄</button></div>';
    $('record-body').innerHTML = h;
    $('rec-preview').onclick = function () { openCardModal(cardData(r)); };
    $('rec-download').onclick = function () { downloadCard(cardData(r)); };
    $('rec-delete').onclick = function () {
      confirmBox('確定要刪除這筆紀錄嗎？刪除後無法復原。').then(function (ok) {
        if (!ok) return;
        ST.remove(r.id);
        toast('已刪除');
        go('#/history');
      });
    };
    show('record', '占卜紀錄');
  }

  // ───── 結果卡 ─────
  var modalData = null, modalBlob = null, modalUrl = null, renderSeq = 0;
  function canShareFiles() {
    try {
      var f = new File([new Blob(['x'], { type: 'image/png' })], 'test.png', { type: 'image/png' });
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] }));
    } catch (e) { return false; }
  }
  function makeBlob(data, palette) {
    return RC.render(data, palette).then(RC.toBlob);
  }
  function openCardModal(data) {
    modalData = data;
    $('card-modal').hidden = false;
    $('btn-card-share').hidden = !canShareFiles();
    syncPaletteButtons();
    renderPreview();
  }
  function syncPaletteButtons() {
    var cur = ST.getPalette();
    Array.prototype.forEach.call(document.querySelectorAll('.palette-opt'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-palette') === cur);
    });
  }
  function renderPreview() {
    var seq = ++renderSeq;
    var palette = ST.getPalette();
    $('card-preview-loading').hidden = false;
    $('btn-card-download').disabled = true; $('btn-card-share').disabled = true;
    modalBlob = null;
    makeBlob(modalData, palette).then(function (blob) {
      if (seq !== renderSeq) return;
      modalBlob = blob;
      if (modalUrl) URL.revokeObjectURL(modalUrl);
      modalUrl = URL.createObjectURL(blob);
      var img = $('card-preview');
      img.src = modalUrl;
      img.setAttribute('data-palette', palette);
      $('card-preview-loading').hidden = true;
      $('btn-card-download').disabled = false; $('btn-card-share').disabled = false;
    }).catch(function (e) {
      $('card-preview-loading').textContent = '結果卡繪製失敗，請重試';
      console.error(e);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.palette-opt'), function (b) {
    b.onclick = function () {
      ST.setPalette(b.getAttribute('data-palette'));
      syncPaletteButtons();
      renderPreview();
    };
  });
  $('card-close').onclick = function () { $('card-modal').hidden = true; };
  $('card-modal').addEventListener('click', function (e) { if (e.target === $('card-modal')) $('card-modal').hidden = true; });
  // 檔名使用英數字，避免部分瀏覽器丟失中文檔名
  function fileName(data) { return 'yuexia-tarot-' + fileStamp(data.ts || Date.now()) + '-' + ST.getPalette() + '.png'; }
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    toast('已產生 PNG（' + (ST.getPalette() === 'wine' ? '酒紅古金' : '羊皮紙米白') + '）');
  }
  $('btn-card-download').onclick = function () { if (modalBlob) saveBlob(modalBlob, fileName(modalData)); };
  $('btn-card-share').onclick = function () {
    if (!modalBlob) return;
    var file = new File([modalBlob], fileName(modalData), { type: 'image/png' });
    navigator.share({ files: [file], title: '月下占卜' }).catch(function (e) {
      if (e && e.name !== 'AbortError') toast('無法開啟分享選單，請改用下載 PNG');
    });
  };
  function downloadCard(data) {
    makeBlob(data, ST.getPalette()).then(function (blob) { saveBlob(blob, fileName(data)); })
      .catch(function () { toast('結果卡繪製失敗，請重試'); });
  }

  // ───── 啟動 ─────
  route();
  OFF.start();

  // 供自動化測試使用的唯讀介面
  window.__YUEXIA__ = { get draw() { return draw; }, makeBlob: makeBlob, cardData: cardData };
})();
