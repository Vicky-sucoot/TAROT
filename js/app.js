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
    var el = $('toast'); el.textContent = msg; el.hidden = false; // textContent 也會清掉先前的動作按鈕
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }
  // 帶有一個動作按鈕的提示（例如刪除後的「復原」），6 秒後消失
  function toastAction(msg, label, fn) {
    var el = $('toast');
    el.innerHTML = '';
    var span = document.createElement('span'); span.textContent = msg;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'toast-action'; b.id = 'toast-action'; b.textContent = label;
    b.onclick = function () { el.hidden = true; fn(); };
    el.appendChild(span); el.appendChild(b);
    el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 6000);
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
    return '<img src="' + (rev ? c.imgRv : c.img) + '" alt="' + esc(c.name) + (rev ? '（逆位，插畫倒置）' : '') + '">';
  }
  function oriHTML(rev) { return '<span class="ori ' + (rev ? 'ori-rv' : 'ori-up') + '">' + (rev ? '逆位' : '正位') + '</span>'; }

  function staticTile(pos, id, rev) {
    var c = T.BY_ID[id];
    return '<div class="tile"><div class="tile-pos">' + esc(pos) + '</div>' +
      '<div class="tile-card is-flipped"><div class="flipper"><div class="face face-front">' + artHTML(id, rev) + '</div></div></div>' +
      '<div class="tile-cap"><span class="tile-name">' + esc(c.name) + '</span>' + oriHTML(rev) + '</div></div>';
  }

  function numLabel(n) { return RD.NUM[n] || String(n); }
  // 只在本機顯示的私人內容（提問、二選一的選項名稱）
  function privateText(question, choices) {
    var parts = [];
    if (choices && choices.a) parts.push('選項 A：' + choices.a);
    if (choices && choices.b) parts.push('選項 B：' + choices.b);
    if (question) parts.push('你的提問：' + question);
    return parts.join('　');
  }
  function dateKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // ───── 路由 ─────
  var VIEWS = ['home', 'setup', 'draw', 'history', 'record', 'gallery', 'card', 'stats', 'settings', 'journal'];
  var draw = null; // 目前這一局
  var setupSpread = 'guide';
  var setupOption = { guide: 'general', relation: 'none', choice: 'general', flow: 'general' };
  var galleryFilter = 'all';
  var historyFilter = 'all';

  function show(view, title) {
    VIEWS.forEach(function (v) { $('view-' + v).hidden = v !== view; });
    $('topbar-title').textContent = title || '月下占卜';
    $('btn-back').hidden = view === 'home';
    $('btn-home').hidden = view === 'home';
    $('btn-settings').hidden = view !== 'home';
    window.scrollTo(0, 0);
  }
  function go(hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  }
  // 路由只用 ASCII 的 #name 形式（#setup-guide、#draw、#history、#record-<id>）
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var m;
    if ((m = /^setup-(guide|relation|choice|flow)$/.exec(h))) return showSetup(m[1]);
    if (h === 'draw' && draw) return show('draw', draw.spreadDef.name);
    if (h === 'history') return showHistory();
    if ((m = /^record-([A-Za-z0-9]+)$/.exec(h))) return showRecord(m[1]);
    if (h === 'cards') return showGallery();
    if ((m = /^card-([mwcsp]\d\d)$/.exec(h)) && T.BY_ID[m[1]]) return showCard(m[1]);
    if (h === 'stats') return showStats();
    if (h === 'settings') return showSettings();
    if (h === 'journal') return showJournal();
    show('home');
  }
  window.addEventListener('hashchange', route);
  $('btn-back').onclick = function () {
    var h = location.hash;
    if (h.indexOf('#record-') === 0 || h === '#stats') go('#history');
    else if (h === '#journal') go('#home');
    else if (h.indexOf('#card-') === 0) go('#cards');
    else if (h === '#draw' && draw) go('#setup-' + draw.spread);
    else go('#home');
  };
  $('btn-home').onclick = function () { go('#home'); };

  // ───── 首頁 ─────
  Array.prototype.forEach.call(document.querySelectorAll('[data-start]'), function (b) {
    b.onclick = function () { go('#setup-' + b.getAttribute('data-start')); };
  });
  $('btn-history').onclick = function () { historyFilter = 'all'; $('history-search').value = ''; go('#history'); };
  $('btn-gallery').onclick = function () { go('#cards'); };
  $('btn-stats').onclick = function () { go('#stats'); };
  $('btn-journal').onclick = function () { journalMonth = null; go('#journal'); };
  $('btn-settings').onclick = function () { go('#settings'); };
  $('offline-line').onclick = function () { go('#settings'); };
  $('history-to-settings').onclick = function () { go('#settings'); };
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
  // 已從主畫面開啟時，首頁不再顯示安裝教學（設定頁仍保留）
  if (standalone) { $('standalone-note').hidden = false; $('install-guide').hidden = true; }

  // 離線狀態
  function renderOffline(s, ids) {
    var dot = $(ids.dot), txt = $(ids.text), prog = $(ids.progress), retry = $(ids.retry);
    dot.className = 'offline-dot';
    retry.hidden = true; prog.hidden = true;
    if (s.status === 'ready') { dot.classList.add('ok'); txt.textContent = '已可離線使用'; }
    else if (s.status === 'preparing' || s.status === 'checking') {
      dot.classList.add('busy');
      txt.textContent = s.status === 'checking' ? '正在檢查離線狀態…' : '正在準備離線使用（' + s.done + '／' + s.total + '）';
      prog.hidden = s.status === 'checking';
      $(ids.bar).style.width = Math.round((s.done / Math.max(1, s.total)) * 100) + '%';
    } else if (s.status === 'error') {
      dot.classList.add('err'); txt.textContent = '離線準備未完成。' + (s.message || ''); retry.hidden = false;
    } else if (s.status === 'unsupported') {
      txt.textContent = s.message || '此環境不支援離線功能。';
    }
  }
  OFF.subscribe(function (s) {
    renderOffline(s, { dot: 'offline-dot', text: 'offline-text', progress: 'offline-progress', bar: 'offline-bar', retry: 'btn-offline-retry' });
    renderOffline(s, { dot: 'set-offline-dot', text: 'set-offline-text', progress: 'set-offline-progress', bar: 'set-offline-bar', retry: 'set-offline-retry' });
  });
  $('set-offline-retry').onclick = function () { OFF.verify(); };
  $('btn-offline-retry').onclick = function () { OFF.verify(); };
  OFF.onUpdate(function () { $('update-banner').hidden = false; });
  $('btn-update').onclick = function () { $('btn-update').disabled = true; OFF.applyUpdate(); };

  // ───── 設定 ─────
  function showSetup(spreadId) {
    setupSpread = spreadId;
    var sp = RD.SPREADS[spreadId];
    $('setup-heading').textContent = sp.name;
    $('setup-positions').textContent = '牌位：' + sp.positions.join('／');
    $('setup-legend').textContent = spreadId === 'relation' ? '目前的感情情境（可略過）' : '選擇主題';
    $('setup-question').placeholder = {
      guide: '例如：最近的工作該怎麼調整步調？',
      relation: '例如：我該怎麼和對方溝通我的想法？',
      choice: '例如：我該留下，還是換一份工作？',
      flow: '例如：這段時間的生活會往哪裡走？'
    }[spreadId];
    $('setup-choices').hidden = spreadId !== 'choice';
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
    var choices = setupSpread === 'choice' ? { a: $('setup-choice-a').value.trim(), b: $('setup-choice-b').value.trim() } : null;
    startDraw(setupSpread, setupOption[setupSpread], $('setup-question').value.trim(), choices);
  };

  // ───── 抽牌 ─────
  function startDraw(spreadId, option, question, choices) {
    var sp = RD.SPREADS[spreadId];
    draw = {
      spread: spreadId, spreadDef: sp, option: option, question: question, n: sp.positions.length,
      choices: choices && (choices.a || choices.b) ? choices : null,
      deck: shuffled(T.CARDS.map(function (c) { return c.id; })),
      picks: [], flipped: 0, reading: null, savedId: null, ts: Date.now(), busy: false
    };
    $('draw-heading').textContent = sp.name;
    var meta = spreadId !== 'relation' ? '主題：' + RD.TOPIC_LABEL[option] : (option !== 'none' ? '情境：' + RD.CONTEXT_LABEL[option] : '情境：略過');
    $('draw-meta').textContent = meta + '・' + sp.positions.join('／');
    var priv = privateText(question, draw.choices);
    $('draw-question').hidden = !priv;
    $('draw-question').textContent = priv;
    Array.prototype.forEach.call(document.querySelectorAll('.n-label'), function (el) { el.textContent = numLabel(draw.n); });
    $('reading').hidden = true; $('reading').innerHTML = '';
    buildSlots();
    buildDeck();
    setMode('swipe');
    $('pick-area').hidden = true;
    go('#draw');
    // 洗牌動畫
    var st = $('draw-status');
    var fan = '';
    for (var k = 0; k < 7; k++) fan += '<img src="cards/back.svg" alt="" style="--i:' + (k - 3) + '">';
    st.innerHTML = '<div class="shuffle-stage" aria-hidden="true">' + fan + '</div>洗牌中…';
    wait(isReduced() ? 250 : 1600).then(function () {
      if (!draw || draw.picks.length) return;
      st.textContent = '請選出 ' + draw.n + ' 張牌';
      $('pick-area').hidden = false;
    });
  }

  function buildSlots() {
    var html = '';
    for (var i = 0; i < draw.n; i++) {
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
    for (var i = 0; i < draw.n; i++) {
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
    var N = draw.n, L = numLabel(N);
    $('draw-status').textContent = n < N ? '已選 ' + n + ' 張，還需 ' + (N - n) + ' 張' : '';
    $('btn-quick').textContent = n > 0 ? '重新快速抽' + L + '張' : '快速抽' + L + '張';
  }

  function addPick(id) {
    if (draw.picks.length >= draw.n) return false;
    if (draw.picks.some(function (p) { return p.id === id; })) return false; // 同一局不重複
    draw.picks.push({ id: id, rev: rand(2) === 1 });
    var b = document.querySelector('.deck-card[data-card="' + id + '"]');
    if (b) b.hidden = true;
    fillSlot(draw.picks.length - 1);
    return true;
  }
  function pick(id) {
    if (!draw || draw.busy || draw.picks.length >= draw.n) return;
    if (!addPick(id)) return;
    updatePickStatus();
    if (draw.picks.length === draw.n) onFull();
  }

  $('btn-quick').onclick = function () {
    if (!draw || draw.busy || draw.picks.length >= draw.n) return;
    var n = draw.picks.length, L = numLabel(draw.n);
    var p = n > 0 ? confirmBox('你已手選 ' + n + ' 張牌。快速抽' + L + '張會重新抽選全部' + L + '張，確定嗎？') : Promise.resolve(true);
    p.then(function (ok) {
      if (!ok) return;
      draw.busy = true;
      draw.picks = [];
      clearSlots();
      Array.prototype.forEach.call($('deck-scroller').children, function (b) { b.hidden = false; });
      var chosen = shuffled(draw.deck).slice(0, draw.n);
      var step = isReduced() ? 0 : (draw.n > 3 ? 180 : 260);
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
    for (var i = 0; i < draw.n; i++) {
      var btn = document.querySelector('[data-slot="' + i + '"]');
      var next = i === draw.flipped;
      btn.classList.toggle('is-next', next);
      btn.disabled = !next;
      if (next) btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：點擊翻牌');
    }
    if (draw.flipped < draw.n) $('draw-status').textContent = '請依序點擊牌面翻牌（第 ' + (draw.flipped + 1) + '／' + draw.n + ' 張）';
  }
  function flip(i) {
    if (!draw || draw.picks.length < draw.n || i !== draw.flipped) return;
    var p = draw.picks[i], c = T.BY_ID[p.id];
    var btn = document.querySelector('[data-slot="' + i + '"]');
    btn.classList.remove('is-next');
    btn.classList.add('is-flipped');
    if (c.suit === 'major') btn.classList.add('major-flash'); // 大阿爾克那翻開時的金光
    btn.disabled = true;
    btn.setAttribute('aria-label', draw.spreadDef.positions[i] + '：' + c.name + (p.rev ? '逆位' : '正位'));
    draw.flipped++;
    var cap = $('slot-' + i).querySelector('.tile-cap');
    wait(isReduced() ? 50 : 450).then(function () {
      cap.innerHTML = '<span class="tile-name">' + esc(c.name) + '</span>' + oriHTML(p.rev);
    });
    if (draw.flipped < draw.n) markNext();
    else {
      $('draw-status').textContent = numLabel(draw.n) + '張牌都翻開了';
      wait(isReduced() ? 100 : 750).then(showLiveReading);
    }
  }

  // ───── 解讀 ─────
  function readingHTML(rec) {
    var r = rec.reading;
    var h = '<div class="reading-block"><h3>整體摘要</h3><p>' + esc(r.summary) + '</p><p class="reading-focus">' + esc(r.focus) + '</p></div>';
    if (r.combos && r.combos.length) {
      h += '<div class="reading-block combo-block"><h3>牌組合</h3>' + r.combos.map(function (c) {
        return '<p class="combo"><span class="combo-title">' + esc(c.title) + '</span>' + esc(c.text) + '</p>';
      }).join('') + '</div>';
    }
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
    $('btn-restart').onclick = function () { draw = null; go('#setup-' + rec.spread); $('setup-question').value = ''; $('setup-choice-a').value = ''; $('setup-choice-b').value = ''; };
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
      choices: draw.choices,
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
    renderHistory();
    show('history', '歷史紀錄');
  }
  function searchText(r) {
    return [RD.SPREADS[r.spread].name, r.question || '', r.choices ? (r.choices.a || '') + ' ' + (r.choices.b || '') : '', r.note ? r.note.text : '']
      .concat(r.cards.map(function (c) { return T.BY_ID[c.id].name; })).join(' ').toLowerCase();
  }
  function renderHistory() {
    $('history-filters').innerHTML = RD.CATEGORIES.map(function (c) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (c.id === historyFilter) + '" data-filter="' + c.id + '">' + c.label + '</button>';
    }).join('');
    Array.prototype.forEach.call($('history-filters').children, function (b) {
      b.onclick = function () { historyFilter = b.getAttribute('data-filter'); renderHistory(); };
    });
    var q = $('history-search').value.trim().toLowerCase();
    var list = ST.list(historyFilter);
    if (q) list = list.filter(function (r) { return searchText(r).indexOf(q) >= 0; });
    $('history-list').innerHTML = list.map(function (r) {
      var sp = RD.SPREADS[r.spread];
      var tag = RD.CATEGORIES.filter(function (c) { return c.id === r.category; })[0];
      var sub = r.spread === 'relation' && r.option && r.option !== 'none' ? '・' + RD.CONTEXT_LABEL[r.option] : '';
      return '<li class="history-item"><button type="button" data-rec="' + esc(r.id) + '">' +
        '<span class="hi-thumbs">' + r.cards.map(function (c) { return '<span class="hi-thumb">' + artHTML(c.id, c.rev) + '</span>'; }).join('') + '</span>' +
        '<span class="hi-meta"><span class="hi-title">' + esc(sp.name) + '</span>' +
        '<span class="hi-tags"><span class="hi-tag">' + (tag ? tag.label : '') + sub + '</span>' +
        (r.note && r.note.text ? '<span class="hi-tag hi-noted">已回顧</span>' : '') + '</span>' +
        '<span class="hi-date">' + fmtDate(r.ts) + '</span>' +
        '<span class="hi-cards">' + r.cards.map(function (c) { return esc(T.BY_ID[c.id].name) + (c.rev ? '（逆）' : ''); }).join('・') + '</span>' +
        (privateText(r.question, r.choices) ? '<span class="hi-cards">' + esc(privateText(r.question, r.choices)) + '</span>' : '') +
        '</span></button></li>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-rec]'), function (b) {
      b.onclick = function () { go('#record-' + b.getAttribute('data-rec')); };
    });
    var empty = $('history-empty');
    empty.hidden = list.length > 0;
    empty.textContent = q ? '找不到符合「' + $('history-search').value.trim() + '」的紀錄' : (historyFilter === 'all' ? '還沒有儲存的占卜紀錄' : '目前沒有這個主題的占卜紀錄');
  }
  $('history-search').addEventListener('input', renderHistory);

  function showRecord(id) {
    var r = ST.get(id);
    if (!r) { toast('找不到這筆紀錄'); go('#history'); return; }
    var sp = RD.SPREADS[r.spread];
    var cat = RD.CATEGORIES.filter(function (c) { return c.id === r.category; })[0];
    var meta = fmtDate(r.ts) + '・' + (cat ? cat.label : '');
    if (r.spread === 'relation') meta += '・情境：' + (r.option && r.option !== 'none' ? RD.CONTEXT_LABEL[r.option] : '略過');
    var h = '<h2 class="view-heading">' + esc(sp.name) + '</h2><p class="record-meta">' + esc(meta) + '</p>' +
      (privateText(r.question, r.choices) ? '<p class="draw-question">' + esc(privateText(r.question, r.choices)) + '</p>' : '') +
      '<div class="slots">' + r.cards.map(function (c, i) { return staticTile(sp.positions[i], c.id, c.rev); }).join('') + '</div>' +
      '<div class="reading">' + readingHTML(r) + '</div>' +
      '<div class="reading-block note-block"><h3>後來怎麼了</h3>' +
      '<p class="hint" style="color:var(--ink-soft)">過幾天回來，寫下實際發生的事，或現在回頭看這次占卜的想法。筆記只存在這台裝置。</p>' +
      '<textarea id="rec-note" rows="4" maxlength="2000" placeholder="例如：後來我主動約對方聊了一次，比想像中順利。">' + esc(r.note ? r.note.text : '') + '</textarea>' +
      '<p class="note-meta" id="rec-note-meta">' + (r.note ? '上次更新：' + fmtDate(r.note.ts) : '還沒有筆記') + '</p>' +
      '<div class="note-actions"><button class="btn btn-primary btn-small" type="button" id="rec-note-save">儲存筆記</button></div></div>' +
      '<div class="actions"><button class="btn btn-primary" type="button" id="rec-preview">預覽結果卡</button>' +
      '<button class="btn btn-ghost" type="button" id="rec-download">下載 PNG</button>' +
      '<button class="btn btn-ghost btn-danger btn-block" type="button" id="rec-delete">刪除這筆紀錄</button></div>';
    $('record-body').innerHTML = h;
    $('rec-preview').onclick = function () { openCardModal(cardData(r)); };
    $('rec-download').onclick = function () { downloadCard(cardData(r)); };
    $('rec-note-save').onclick = function () {
      var text = $('rec-note').value.trim();
      var note = text ? { text: text, ts: Date.now() } : null;
      if (!ST.update(r.id, { note: note })) { toast('儲存空間無法使用，筆記未能保存'); return; }
      r.note = note || undefined;
      $('rec-note-meta').textContent = note ? '上次更新：' + fmtDate(note.ts) : '還沒有筆記';
      toast(note ? '已儲存回顧筆記' : '已清除回顧筆記');
    };
    $('rec-delete').onclick = function () {
      confirmBox('確定要刪除這筆紀錄嗎？刪除後無法復原。').then(function (ok) {
        if (!ok) return;
        ST.remove(r.id);
        go('#history');
        toastAction('已刪除這筆紀錄', '復原', function () {
          ST.importMany([r]);
          if (location.hash === '#history') renderHistory();
          toast('已復原');
        });
      });
    };
    show('record', '占卜紀錄');
  }

  // ───── 備份與還原 ─────
  function backupFile() {
    var data = window.BACKUP.build(ST.all(), { palette: ST.getPalette(), format: ST.getCardFormat(), showDate: ST.getShowDate() }, ST.getDailyLog());
    var name = 'yuexia-backup-' + fileStamp(Date.now()) + '.json';
    return { file: new File([JSON.stringify(data)], name, { type: 'application/json' }), count: data.records.length, days: Object.keys(data.dailyLog).length };
  }
  function downloadFile(file) {
    var url = URL.createObjectURL(file);
    var a = document.createElement('a');
    a.href = url; a.download = file.name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  $('btn-export').onclick = function () {
    var b = backupFile();
    if (!b.count && !b.days) { toast('目前沒有紀錄可以匯出'); return; }
    var canShare = false;
    try { canShare = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [b.file] })); } catch (e) { canShare = false; }
    if (canShare) {
      navigator.share({ files: [b.file], title: '月下占卜備份' }).then(function () {
        toast('已匯出 ' + b.count + ' 筆紀錄');
      }, function (e) {
        if (e && e.name === 'AbortError') return;
        downloadFile(b.file); toast('已下載備份檔（' + b.count + ' 筆紀錄）');
      });
    } else {
      downloadFile(b.file);
      toast('已下載備份檔（' + b.count + ' 筆紀錄）');
    }
  };
  $('btn-import').onclick = function () { $('import-file').value = ''; $('import-file').click(); };
  $('import-file').onchange = function () {
    var f = $('import-file').files[0];
    if (!f) return;
    f.text().then(function (text) {
      var res;
      try { res = window.BACKUP.parse(text); } catch (e) { toast(e.message); return; }
      var days = Object.keys(res.dailyLog).length;
      if (!res.records.length && !days) { toast('備份檔裡沒有可以匯入的紀錄' + (res.skipped ? '（' + res.skipped + ' 筆格式不符）' : '')); return; }
      return confirmBox('備份檔裡有 ' + res.records.length + ' 筆紀錄' + (days ? '、' + days + ' 天的今日指引' : '') + '，將合併到目前的紀錄中，已經存在的不會重複。也會套用備份裡的結果卡設定。確定匯入嗎？').then(function (ok) {
        if (!ok) return;
        var r = ST.importMany(res.records);
        if (!r.ok) { toast('儲存空間無法使用，匯入失敗'); return; }
        if (res.settings.palette) ST.setPalette(res.settings.palette);
        if (res.settings.format) ST.setCardFormat(res.settings.format);
        if (res.settings.showDate !== null) ST.setShowDate(res.settings.showDate);
        var addedDays = ST.importDailyLog(res.dailyLog);
        var msg = '已匯入 ' + r.added + ' 筆';
        if (addedDays) msg += '、' + addedDays + ' 天今日指引';
        if (r.dup) msg += '，' + r.dup + ' 筆已存在而略過';
        if (res.skipped) msg += '，' + res.skipped + ' 筆格式不符';
        toast(msg);
        historyFilter = 'all';
        $('history-search').value = '';
        go('#history');
      });
    }, function () { toast('無法讀取這個檔案'); });
  };

  // ───── 結果卡 ─────
  var modalData = null, modalBlob = null, modalUrl = null, renderSeq = 0;
  function canShareFiles() {
    try {
      var f = new File([new Blob(['x'], { type: 'image/png' })], 'test.png', { type: 'image/png' });
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] }));
    } catch (e) { return false; }
  }
  function cardOpts() { return { format: ST.getCardFormat(), showDate: ST.getShowDate() }; }
  function makeBlob(data, palette, opts) {
    return RC.render(data, palette, opts || cardOpts()).then(RC.toBlob);
  }
  function openCardModal(data) {
    modalData = data;
    $('card-modal').hidden = false;
    $('btn-card-share').hidden = !canShareFiles();
    syncPaletteButtons();
    renderPreview();
  }
  function syncPaletteButtons() {
    var fmt = ST.getCardFormat();
    Array.prototype.forEach.call(document.querySelectorAll('.format-opt'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-format') === fmt);
    });
    $('card-show-date').checked = ST.getShowDate();
    var cur = ST.getPalette();
    Array.prototype.forEach.call(document.querySelectorAll('.palette-opt'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-palette') === cur);
    });
  }
  function renderPreview() {
    var seq = ++renderSeq;
    var palette = ST.getPalette(), opts = cardOpts();
    $('card-preview-loading').hidden = false;
    $('btn-card-download').disabled = true; $('btn-card-share').disabled = true;
    modalBlob = null;
    makeBlob(modalData, palette, opts).then(function (blob) {
      if (seq !== renderSeq) return;
      modalBlob = blob;
      if (modalUrl) URL.revokeObjectURL(modalUrl);
      modalUrl = URL.createObjectURL(blob);
      var img = $('card-preview');
      img.src = modalUrl;
      img.setAttribute('data-palette', palette);
      img.setAttribute('data-format', opts.format);
      img.setAttribute('data-date', opts.showDate ? '1' : '0');
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
  Array.prototype.forEach.call(document.querySelectorAll('.format-opt'), function (b) {
    b.onclick = function () { ST.setCardFormat(b.getAttribute('data-format')); syncPaletteButtons(); renderPreview(); };
  });
  $('card-show-date').onchange = function () { ST.setShowDate($('card-show-date').checked); renderPreview(); };
  $('card-close').onclick = function () { $('card-modal').hidden = true; };
  $('card-modal').addEventListener('click', function (e) { if (e.target === $('card-modal')) $('card-modal').hidden = true; });
  // 檔名使用英數字，避免部分瀏覽器丟失中文檔名
  function fileName(data) { return 'yuexia-tarot-' + fileStamp(data.ts || Date.now()) + (ST.getCardFormat() === 'square' ? '-square' : '') + '-' + ST.getPalette() + '.png'; }
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    toast('已產生 PNG（' + RC.PALETTES[ST.getPalette()].label + '）');
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

  // ───── 今日指引 ─────
  var DAILY_UP = ['今天，讓「{k}」陪你走一段路。', '把「{k}」放在心上，今天會更清楚自己要什麼。', '今日關鍵詞是「{k}」，從一件小事開始實踐它。'];
  var DAILY_RV = ['今天留意「{k}」，慢一點也沒關係。', '如果感到卡住，看看是不是「{k}」在作用。', '今日提醒：溫柔地面對「{k}」，不必急著改變。'];
  function dailyLine(d) {
    var c = T.BY_ID[d.id], f = d.rev ? c.rv : c.up;
    var arr = d.rev ? DAILY_RV : DAILY_UP;
    var seed = 0; for (var i = 0; i < d.date.length; i++) seed += d.date.charCodeAt(i);
    return arr[seed % arr.length].replace('{k}', f.k[0]);
  }
  function moodOf(date) { var e = ST.getDailyLog()[date]; return e && e.mood ? e.mood : ''; }
  function renderDaily(animate) {
    var d = ST.getDaily(dateKey());
    if (d) ST.logDaily(d); // 舊版只存當天，補進紀錄
    var card = $('daily-card');
    if (!d) {
      card.classList.remove('is-flipped'); card.disabled = false;
      card.setAttribute('aria-label', '抽今日一張');
      $('daily-text').innerHTML = '<p class="daily-hint">每天抽一張牌，給今天一句提醒。同一天再打開，會看到同一張。</p>' +
        '<button type="button" class="btn btn-primary btn-small" id="btn-daily">抽今日一張</button>';
      $('btn-daily').onclick = drawDaily;
      return;
    }
    var c = T.BY_ID[d.id];
    $('daily-front').innerHTML = artHTML(d.id, d.rev);
    card.disabled = true;
    card.setAttribute('aria-label', '今日的牌：' + c.name + (d.rev ? '逆位' : '正位'));
    var showText = function () {
      $('daily-text').innerHTML = '<p><span class="daily-name">' + esc(c.name) + '</span> ' + oriHTML(d.rev) + '</p>' +
        '<p class="daily-line">' + esc(dailyLine(d)) + '</p>' +
        '<div class="daily-mood"><input type="text" id="daily-mood" maxlength="60" placeholder="今天的心情一句話（可留白）" value="' + esc(moodOf(d.date)) + '">' +
        '<button type="button" class="btn btn-ghost btn-small" id="daily-mood-save">記下</button></div>' +
        '<p class="daily-more"><button type="button" class="link-btn" id="daily-detail">查看牌義</button>　<button type="button" class="link-btn" id="daily-journal">今日指引紀錄</button></p>';
      $('daily-detail').onclick = function () { go('#card-' + d.id); };
      $('daily-journal').onclick = function () { journalMonth = null; go('#journal'); };
      $('daily-mood-save').onclick = function () {
        ST.setDailyMood(d.date, $('daily-mood').value.trim());
        toast($('daily-mood').value.trim() ? '已記下今天的心情' : '已清除今天的心情');
      };
    };
    if (animate) { card.classList.add('is-flipped'); wait(isReduced() ? 50 : 500).then(showText); }
    else { card.classList.add('is-flipped'); showText(); }
  }
  function drawDaily() {
    if (ST.getDaily(dateKey())) return;
    var c = T.CARDS[rand(T.CARDS.length)];
    ST.setDaily({ date: dateKey(), id: c.id, rev: rand(2) === 1 });
    renderDaily(true);
  }
  $('daily-card').onclick = drawDaily;
  // 跨過午夜回到首頁時重新整理
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') renderDaily(false); });

  // ───── 牌卡圖鑑 ─────
  var GALLERY_FILTERS = [
    { id: 'all', label: '全部' }, { id: 'major', label: '大阿爾克那' }, { id: 'wands', label: '權杖' },
    { id: 'cups', label: '聖杯' }, { id: 'swords', label: '寶劍' }, { id: 'pentacles', label: '錢幣' }
  ];
  function showGallery() {
    $('gallery-filters').innerHTML = GALLERY_FILTERS.map(function (f) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (f.id === galleryFilter) + '" data-gfilter="' + f.id + '">' + f.label + '</button>';
    }).join('');
    Array.prototype.forEach.call($('gallery-filters').children, function (b) {
      b.onclick = function () { galleryFilter = b.getAttribute('data-gfilter'); showGallery(); };
    });
    var list = T.CARDS.filter(function (c) { return galleryFilter === 'all' || c.suit === galleryFilter; });
    $('gallery-grid').innerHTML = list.map(function (c) {
      return '<button type="button" class="gallery-item" data-gcard="' + c.id + '"><img src="' + c.img + '" alt="" loading="lazy"><span>' + esc(c.name) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call($('gallery-grid').children, function (b) {
      b.onclick = function () { go('#card-' + b.getAttribute('data-gcard')); };
    });
    show('gallery', '牌卡圖鑑');
  }
  function showCard(id) {
    var c = T.BY_ID[id], S = T.SUITS[c.suit];
    var idx = T.CARDS.indexOf(c);
    var prev = T.CARDS[(idx + 77) % 78], next = T.CARDS[(idx + 1) % 78];
    var tm = window.TOPIC_MEANINGS && window.TOPIC_MEANINGS[c.id];
    var block = function (label, f, ri) {
      return '<div class="reading-block"><h3>' + label + '</h3><p>' + f.k.map(function (k) { return '<span class="kw">' + esc(k) + '</span>'; }).join('') + '</p><p>' + esc(f.m) + '</p>' +
        (tm ? '<dl class="topic-list"><dt>感情</dt><dd>' + esc(tm.love[ri]) + '</dd><dt>工作</dt><dd>' + esc(tm.work[ri]) + '</dd><dt>財運</dt><dd>' + esc(tm.money[ri]) + '</dd></dl>' : '') + '</div>';
    };
    $('card-body').innerHTML = '<div class="card-detail-head"><h2 class="view-heading">' + esc(c.name) + '</h2><p class="en">' + esc(c.en) + '・' + S.name + (S.element ? '（' + S.element + '・' + S.theme + '）' : '') + '</p></div>' +
      '<div class="card-detail-art"><img id="card-detail-img" src="' + c.img + '" alt="' + esc(c.name) + '"></div>' +
      '<div class="orient-switch" role="radiogroup" aria-label="切換正逆位"><button type="button" role="radio" aria-checked="true" data-orient="up">正位</button><button type="button" role="radio" aria-checked="false" data-orient="rv">逆位</button></div>' +
      block('正位', c.up, 0) + block('逆位', c.rv, 1) +
      '<div class="card-nav"><button class="btn btn-ghost" type="button" id="card-prev">‹ ' + esc(prev.name) + '</button><button class="btn btn-ghost" type="button" id="card-next">' + esc(next.name) + ' ›</button></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-orient]'), function (b) {
      b.onclick = function () {
        var rv = b.getAttribute('data-orient') === 'rv';
        $('card-detail-img').src = rv ? c.imgRv : c.img;
        Array.prototype.forEach.call(document.querySelectorAll('[data-orient]'), function (o) { o.setAttribute('aria-checked', o === b); });
      };
    });
    $('card-prev').onclick = function () { history.replaceState(null, '', '#card-' + prev.id); showCard(prev.id); };
    $('card-next').onclick = function () { history.replaceState(null, '', '#card-' + next.id); showCard(next.id); };
    show('card', '牌卡圖鑑');
  }

  // ───── 統計 ─────
  function bars(rows, total) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
    return '<ul class="bars">' + rows.map(function (r) {
      var pct = total ? Math.round(r.v / total * 100) : 0;
      return '<li class="bar-row" title="' + esc(r.label) + '：' + r.v + ' 次（' + pct + '%）"><span class="bar-label">' + esc(r.label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + (r.v / max * 100).toFixed(1) + '%"></span></span><span class="bar-val">' + r.v + '</span></li>';
    }).join('') + '</ul>';
  }
  function showStats() {
    var list = ST.list('all');
    var body = $('stats-body');
    if (!list.length) {
      body.innerHTML = '<p class="empty">還沒有儲存的占卜紀錄。<br>占卜後按「儲存結果」，這裡就會出現你的統計。</p>';
      show('stats', '我的統計');
      return;
    }
    var cardsDrawn = 0, rev = 0, counts = {}, suit = { major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 };
    var cat = { love: 0, work: 0, money: 0, general: 0 }, spread = {};
    list.forEach(function (r) {
      cat[r.category] = (cat[r.category] || 0) + 1;
      spread[r.spread] = (spread[r.spread] || 0) + 1;
      r.cards.forEach(function (c) {
        cardsDrawn++; if (c.rev) rev++;
        counts[c.id] = (counts[c.id] || 0) + 1;
        suit[T.BY_ID[c.id].suit]++;
      });
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || T.CARDS.indexOf(T.BY_ID[a]) - T.CARDS.indexOf(T.BY_ID[b]); }).slice(0, 5);
    var revPct = Math.round(rev / cardsDrawn * 100);
    body.innerHTML =
      '<div class="stat-tiles"><div class="stat-tile"><span class="stat-num" id="stat-total">' + list.length + '</span><span class="stat-label">次占卜</span></div>' +
      '<div class="stat-tile"><span class="stat-num" id="stat-cards">' + cardsDrawn + '</span><span class="stat-label">張牌</span></div>' +
      '<div class="stat-tile"><span class="stat-num" id="stat-rev">' + revPct + '%</span><span class="stat-label">逆位比例</span></div></div>' +
      '<div class="reading-block"><h3>各主題占卜次數</h3>' + bars(RD.CATEGORIES.slice(1).map(function (c) { return { label: c.label, v: cat[c.id] || 0 }; }), list.length) + '</div>' +
      '<div class="reading-block"><h3>各牌陣使用次數</h3>' + bars(RD.ORDER.map(function (s) { return { label: RD.SPREADS[s].name.replace('牌陣', ''), v: spread[s] || 0 }; }), list.length) + '</div>' +
      '<div class="reading-block"><h3>正位與逆位</h3>' + bars([{ label: '正位', v: cardsDrawn - rev }, { label: '逆位', v: rev }], cardsDrawn) + '</div>' +
      '<div class="reading-block"><h3>牌組分布</h3>' + bars(['major', 'wands', 'cups', 'swords', 'pentacles'].map(function (s) { return { label: T.SUITS[s].name, v: suit[s] }; }), cardsDrawn) + '</div>' +
      '<div class="reading-block"><h3>最常出現的牌</h3><ol class="top-cards" id="stat-top">' + top.map(function (id) {
        var c = T.BY_ID[id];
        return '<li class="top-card"><img src="' + c.img + '" alt=""><span><span class="tc-name">' + esc(c.name) + '</span><span class="tc-sub">' + T.SUITS[c.suit].name + '</span></span><span class="tc-count">' + counts[id] + ' 次</span></li>';
      }).join('') + '</ol></div>';
    show('stats', '我的統計');
  }

  // ───── 設定 ─────
  // ───── 今日指引紀錄（月曆） ─────
  var journalMonth = null, journalDay = null;
  function showJournal() {
    var now = new Date();
    if (!journalMonth) journalMonth = { y: now.getFullYear(), m: now.getMonth() };
    renderJournal();
    show('journal', '今日指引紀錄');
  }
  function renderJournal() {
    var log = ST.getDailyLog();
    var y = journalMonth.y, m = journalMonth.m;
    var first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    var today = dateKey();
    var cells = '';
    for (var i = 0; i < first.getDay(); i++) cells += '<span class="jc jc-empty" aria-hidden="true"></span>';
    var monthEntries = [];
    for (var d = 1; d <= days; d++) {
      var key = y + '-' + pad(m + 1) + '-' + pad(d);
      var e = log[key];
      var cls = 'jc' + (key === today ? ' jc-today' : '') + (key === journalDay ? ' jc-sel' : '');
      if (e) {
        monthEntries.push({ key: key, e: e });
        var c = T.BY_ID[e.id];
        cells += '<button type="button" class="' + cls + ' jc-has" data-jday="' + key + '" aria-label="' + (m + 1) + ' 月 ' + d + ' 日：' + esc(c.name) + (e.rev ? '逆位' : '正位') + (e.mood ? '，有心情紀錄' : '') + '">' +
          '<span class="jc-num">' + d + '</span><img src="' + (e.rev ? c.imgRv : c.img) + '" alt="">' + (e.mood ? '<span class="jc-dot" aria-hidden="true"></span>' : '') + '</button>';
      } else {
        cells += '<span class="' + cls + '"><span class="jc-num">' + d + '</span></span>';
      }
    }
    var suit = { major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 }, rev = 0, count = {};
    monthEntries.forEach(function (x) { var c = T.BY_ID[x.e.id]; suit[c.suit]++; if (x.e.rev) rev++; count[x.e.id] = (count[x.e.id] || 0) + 1; });
    var n = monthEntries.length;
    var summary = n ? '<div class="reading-block"><h3>這個月的回顧</h3>' +
      '<p id="j-summary">這個月抽了 <b>' + n + '</b> 天，其中 ' + rev + ' 天是逆位。' + monthNote(suit, n) + '</p>' +
      bars(['major', 'wands', 'cups', 'swords', 'pentacles'].map(function (s) { return { label: T.SUITS[s].name, v: suit[s] }; }), n) + repeatNote(count) + '</div>'
      : '<p class="empty">這個月還沒有今日指引紀錄。<br>回到首頁抽一張今日的牌吧。</p>';
    var sel = journalDay && log[journalDay] ? dayDetail(journalDay, log[journalDay]) : '';
    $('journal-body').innerHTML =
      '<div class="j-nav"><button type="button" class="btn btn-ghost btn-small" id="j-prev" aria-label="上個月">‹</button>' +
      '<h3 class="j-title" id="j-title">' + y + ' 年 ' + (m + 1) + ' 月</h3>' +
      '<button type="button" class="btn btn-ghost btn-small" id="j-next" aria-label="下個月">›</button></div>' +
      '<div class="j-week" aria-hidden="true"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>' +
      '<div class="j-grid">' + cells + '</div>' + sel + summary;
    $('j-prev').onclick = function () { journalMonth = m === 0 ? { y: y - 1, m: 11 } : { y: y, m: m - 1 }; journalDay = null; renderJournal(); };
    $('j-next').onclick = function () { journalMonth = m === 11 ? { y: y + 1, m: 0 } : { y: y, m: m + 1 }; journalDay = null; renderJournal(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-jday]'), function (b) {
      b.onclick = function () { journalDay = b.getAttribute('data-jday'); renderJournal(); };
    });
    if (sel) {
      $('j-mood-save').onclick = function () {
        ST.setDailyMood(journalDay, $('j-mood').value.trim());
        toast($('j-mood').value.trim() ? '已更新心情' : '已清除心情');
        renderJournal();
      };
      $('j-card').onclick = function () { go('#card-' + log[journalDay].id); };
    }
  }
  function dayDetail(key, e) {
    var c = T.BY_ID[e.id];
    var parts = key.split('-');
    return '<div class="reading-block j-detail"><h3>' + parseInt(parts[1], 10) + ' 月 ' + parseInt(parts[2], 10) + ' 日</h3>' +
      '<div class="j-detail-row"><img src="' + (e.rev ? c.imgRv : c.img) + '" alt="' + esc(c.name) + '">' +
      '<div><p><span class="rd-name">' + esc(c.name) + '</span> ' + oriHTML(e.rev) + '</p><p>' + esc(dailyLine({ date: key, id: e.id, rev: e.rev })) + '</p>' +
      '<button type="button" class="link-btn j-link" id="j-card">查看牌義</button></div></div>' +
      '<label class="field"><span class="field-label" style="font-size:16px">那天的心情</span><input type="text" id="j-mood" maxlength="60" value="' + esc(e.mood || '') + '" placeholder="寫一句話（可留白）"></label>' +
      '<div class="note-actions"><button type="button" class="btn btn-primary btn-small" id="j-mood-save">儲存心情</button></div></div>';
  }
  function monthNote(suit, n) {
    var top = Object.keys(suit).sort(function (a, b) { return suit[b] - suit[a]; })[0];
    if (!suit[top] || suit[top] < 2) return '';
    var note = {
      major: '大阿爾克那出現得最多，這個月似乎有一些值得深思的課題。',
      wands: '權杖出現得最多，這個月的關鍵字是行動與熱情。',
      cups: '聖杯出現得最多，這個月的重心落在感受與關係。',
      swords: '寶劍出現得最多，這個月想得比較多，記得讓腦袋休息。',
      pentacles: '錢幣出現得最多，這個月的重心在生活、工作與實際的事務。'
    };
    return note[top];
  }
  function repeatNote(count) {
    var rep = Object.keys(count).filter(function (k) { return count[k] >= 2; });
    if (!rep.length) return '';
    return '<p class="reading-focus">重複出現的牌：' + rep.map(function (k) { return esc(T.BY_ID[k].name) + ' ' + count[k] + ' 次'; }).join('、') + '</p>';
  }

  function syncSettings() {
    var pal = ST.getPalette(), fmt = ST.getCardFormat();
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-palette]'), function (b) { b.setAttribute('aria-checked', b.getAttribute('data-set-palette') === pal); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-format]'), function (b) { b.setAttribute('aria-checked', b.getAttribute('data-set-format') === fmt); });
    $('set-show-date').checked = ST.getShowDate();
  }
  function showSettings() {
    syncSettings();
    $('app-version').textContent = (window.PRECACHE && window.PRECACHE.version) || '';
    show('settings', '設定');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-set-palette]'), function (b) {
    b.onclick = function () { ST.setPalette(b.getAttribute('data-set-palette')); syncSettings(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-set-format]'), function (b) {
    b.onclick = function () { ST.setCardFormat(b.getAttribute('data-set-format')); syncSettings(); };
  });
  $('set-show-date').onchange = function () { ST.setShowDate($('set-show-date').checked); };
  $('btn-clear-all').onclick = function () {
    var n = ST.list('all').length;
    confirmBox('確定要清除這台裝置上的所有資料嗎？' + (n ? '包含 ' + n + ' 筆占卜紀錄與回顧筆記、' : '') + '今日指引與結果卡設定都會被刪除，無法復原。建議先匯出備份。').then(function (ok) {
      if (!ok) return;
      ST.clearAll();
      draw = null;
      renderDaily(false);
      syncSettings();
      toast('已清除所有資料');
    });
  };

  // ───── 啟動 ─────
  renderDaily(false);
  route();
  OFF.start();

  // 供自動化測試使用的唯讀介面
  window.__YUEXIA__ = { get draw() { return draw; }, makeBlob: makeBlob, cardData: cardData, dateKey: dateKey };
})();
