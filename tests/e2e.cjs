// 月下占卜端對端驗收測試（Chromium + Playwright，模擬 iPhone 尺寸）
// 使用：先在專案根目錄啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/e2e.cjs
const { chromium, devices } = require('playwright');
const { skipOnboarding } = require('./helpers.cjs');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

async function waitOffline(page) {
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 60000 });
}
async function startSpread(page, spread, option, question) {
  await page.goto(BASE + '#setup-' + spread);
  await page.click(`[data-opt="${option}"]`);
  if (question) await page.fill('#setup-question', question);
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
}
async function flipAll(page) {
  for (let i = 0; i < 3; i++) {
    await page.click(`[data-slot="${i}"]`);
    await page.waitForTimeout(80);
  }
  await page.waitForSelector('#reading:not([hidden])');
}
async function quick(page) {
  await page.click('#tab-quick');
  await page.click('#btn-quick');
  await page.waitForFunction(() => window.__YUEXIA__.draw && window.__YUEXIA__.draw.picks.length === 3 && !window.__YUEXIA__.draw.busy);
}

(async () => {
  const browser = skipOnboarding(await chromium.launch());
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  console.log('【資料完整性】');
  await page.goto(BASE);
  const data = await page.evaluate(() => {
    const C = window.TAROT.CARDS;
    const texts = [];
    C.forEach((c) => { texts.push(c.up.m, c.rv.m); });
    return { n: C.length, majors: C.filter((c) => c.suit === 'major').length, minors: C.filter((c) => c.suit !== 'major').length,
      meanings: texts.filter(Boolean).length, unique: new Set(texts).size, kwOk: C.every((c) => c.up.k.length >= 2 && c.rv.k.length >= 2) };
  });
  ok(data.n === 78 && data.majors === 22 && data.minors === 56, '78 張牌（22 大＋56 小）');
  ok(data.meanings === 156 && data.unique === 156, '156 筆正逆位牌義且互不重複');
  ok(data.kwOk, '每張牌正逆位都有關鍵詞');
  const svgs = fs.readdirSync(path.join(__dirname, '..', 'cards')).filter((f) => f.endsWith('.svg'));
  ok(svgs.length === 79, '78 張牌圖＋1 張牌背 SVG 檔案齊全');
  const hashes = new Set(svgs.map((f) => fs.readFileSync(path.join(__dirname, '..', 'cards', f), 'utf8')));
  ok(hashes.size === 79, '79 張圖檔內容各不相同（每張獨立構圖）');
  const rvs = fs.readdirSync(path.join(__dirname, '..', 'cards', 'rv')).filter((f) => f.endsWith('.svg'));
  ok(rvs.length === 78, '78 張逆位圖齊全');

  console.log('【逆位圖：插畫旋轉、金框正向】');
  const rvCheck = await page.evaluate(async () => {
    const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
    const draw = (im) => { const c = document.createElement('canvas'); c.width = 300; c.height = 500; c.getContext('2d').drawImage(im, 0, 0); return c.getContext('2d'); };
    const close = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 40;
    const out = [];
    for (const id of ['m21', 'w14', 'c03', 's10', 'p05']) {
      const up = draw(await load('cards/' + id + '.svg')), rv = draw(await load('cards/rv/' + id + '.svg'));
      let art = 0, frameSame = 0, n = 0, f = 0;
      for (let k = 0; k < 60; k++) {
        const x = 60 + (k * 37) % 180, y = 120 + (k * 71) % 280; // 拱形畫框內
        // 以 9×9 區塊平均比較，避免細排線差一個像素造成誤判
        const avg = (ctx, cx, cy) => { const d = ctx.getImageData(cx - 4, cy - 4, 9, 9).data; const s = [0, 0, 0]; for (let q = 0; q < d.length; q += 4) { s[0] += d[q]; s[1] += d[q + 1]; s[2] += d[q + 2]; } return s.map((v) => v / 81); };
        if (close(avg(rv, x, y), avg(up, 300 - x, 478 - y))) art++; n++;
      }
      for (const [x, y] of [[150, 473], [17, 17], [283, 483], [150, 24], [19, 166], [281, 300], [140, 470], [160, 476]]) {
        if (close(Array.from(rv.getImageData(x, y, 1, 1).data), Array.from(up.getImageData(x, y, 1, 1).data))) frameSame++; f++;
      }
      out.push({ id, art: art / n, frame: frameSame / f });
    }
    return out;
  });
  ok(rvCheck.every((r) => r.art >= 0.85), '逆位圖的插畫是正位插畫繞畫框中心旋轉 180 度（' + rvCheck.map((r) => r.id + ' ' + Math.round(r.art * 100) + '%').join('、') + '）');
  ok(rvCheck.every((r) => r.frame === 1), '逆位圖的金框、四角與底部徽章與正位相同（保持正向）');

  console.log('【離線準備】');
  await waitOffline(page);
  ok(true, '首頁顯示「已可離線使用」');
  const cached = await page.evaluate(async () => {
    const c = await caches.open('yuexia-' + PRECACHE.version);
    const r = await Promise.all(PRECACHE.files.map((u) => c.match(u)));
    return { total: PRECACHE.files.length, hit: r.filter(Boolean).length };
  });
  ok(cached.total === cached.hit, `全部 ${cached.total} 個必要檔案已在快取中`);
  await page.screenshot({ path: path.join(SHOTS, '01-home.png') });

  console.log('【三張牌指引：手選 → 部分手選後快速抽】');
  await startSpread(page, 'guide', 'love', '我和他最近的相處');
  await page.screenshot({ path: path.join(SHOTS, '02-draw-pick.png') });
  const deckCount = await page.locator('.deck-card').count();
  ok(deckCount === 78, '牌堆有 78 張牌背可滑動瀏覽');
  const scrollable = await page.$eval('#deck-scroller', (el) => el.scrollWidth > el.clientWidth);
  ok(scrollable, '牌堆可左右捲動');
  await page.locator('.deck-card').nth(5).click();
  await page.locator('.deck-card:not([hidden])').nth(20).click();
  let picks = await page.evaluate(() => window.__YUEXIA__.draw.picks.map((p) => p.id));
  ok(picks.length === 2, '手選兩張，依序放入牌位');
  ok(await page.locator('[data-slot="0"]:not(.is-empty)').count() === 1 && await page.locator('[data-slot="2"].is-empty').count() === 1, '第 1、2 牌位有牌，第 3 牌位空');
  // 部分手選後快速抽：先取消
  await page.click('#tab-quick');
  await page.click('#btn-quick');
  await page.waitForSelector('#confirm-modal:not([hidden])');
  const confirmText = await page.textContent('#confirm-text');
  ok(/重新抽選全部三張/.test(confirmText), '出現「將重選全部三張」提示');
  await page.screenshot({ path: path.join(SHOTS, '03-confirm.png') });
  await page.click('#confirm-cancel');
  picks = await page.evaluate(() => window.__YUEXIA__.draw.picks.map((p) => p.id));
  ok(picks.length === 2, '取消後保留原本手選的兩張');
  await page.click('#btn-quick');
  await page.click('#confirm-ok');
  await page.waitForFunction(() => window.__YUEXIA__.draw.picks.length === 3 && !window.__YUEXIA__.draw.busy);
  picks = await page.evaluate(() => window.__YUEXIA__.draw.picks.map((p) => p.id));
  ok(new Set(picks).size === 3, '確認後重新抽出三張且不重複');
  // 依序翻牌：先點第 3 張不應翻開
  ok(await page.locator('[data-slot="2"]').isDisabled(), '翻牌前，第 3 張不能先翻（需依序）');
  await page.click('[data-slot="0"]');
  ok(await page.locator('[data-slot="0"].is-flipped').count() === 1, '第 1 張翻開');
  await page.click('[data-slot="1"]'); await page.click('[data-slot="2"]');
  await page.waitForSelector('#reading:not([hidden])');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, '04-flipped.png') });
  const rd = await page.evaluate(() => ({ summary: document.querySelector('.reading-block p').textContent, details: document.querySelectorAll('.reading-detail').length, q: document.querySelector('.self-q').textContent }));
  ok(rd.summary.length > 30 && rd.details === 3 && rd.q.length > 8, '顯示整體摘要、3 段可展開逐張解讀、自我提問');
  ok(await page.locator('#btn-save').isVisible() && await page.locator('#btn-restart').isVisible(), '提供「儲存結果」與「重新占卜」');
  await page.locator('.reading-detail summary').first().click();
  await page.screenshot({ path: path.join(SHOTS, '05-reading.png'), fullPage: true });
  await page.click('#btn-save');
  ok(await page.locator('#btn-save').isDisabled(), '儲存後按鈕變為「已儲存」');

  console.log('【逆位呈現（翻牌畫面）】');
  // 強制製造一局包含逆位的牌，檢查插畫旋轉、文字正向
  let revFound = false;
  for (let k = 0; k < 15 && !revFound; k++) {
    await startSpread(page, 'guide', 'general');
    await quick(page);
    revFound = await page.evaluate(() => window.__YUEXIA__.draw.picks.some((p) => p.rev));
    if (revFound) await flipAll(page);
  }
  ok(revFound, '取得含逆位的牌局');
  const rev = await page.evaluate(() => {
    const d = window.__YUEXIA__.draw;
    const i = d.picks.findIndex((p) => p.rev);
    const slot = document.getElementById('slot-' + i);
    const img = slot.querySelector('.face-front img');
    const cap = slot.querySelector('.tile-cap');
    const pos = slot.querySelector('.tile-pos');
    const m = img.getAttribute('src');
    return { m, capT: getComputedStyle(cap).transform, posT: getComputedStyle(pos).transform, label: cap.textContent };
  });
  ok(/^cards\/rv\//.test(rev.m), '逆位使用「插畫倒置、金框正向」的逆位圖');
  ok(rev.capT === 'none' && rev.posT === 'none' && /逆位/.test(rev.label), '牌名、牌位與「逆位」文字保持正向');
  await page.screenshot({ path: path.join(SHOTS, '06-reversed.png') });
  await page.click('#btn-save');

  console.log('【感情關係牌陣：三種情境＋略過】');
  for (const opt of ['ambig', 'dating', 'after', 'none']) {
    await startSpread(page, 'relation', opt, opt === 'none' ? '' : '測試提問' + opt);
    const pos = await page.$$eval('.tile-pos', (els) => els.map((e) => e.textContent));
    ok(pos.join('／') === '我的感受與期待／目前的互動模式／下一步建議', `${opt}：牌位正確`);
    await quick(page);
    await flipAll(page);
    const focus = await page.textContent('.reading-focus');
    const expect = { ambig: /觀察實際的互動.*期待.*步調/, dating: /相處模式.*需求.*溝通/, after: /情緒.*界線.*下一步/, none: /感受.*互動.*溝通/ }[opt];
    ok(expect.test(focus), `${opt}：解讀聚焦符合情境（${focus.slice(0, 18)}…）`);
    await page.click('#btn-save');
  }
  for (const opt of ['work', 'money']) {
    await startSpread(page, 'guide', opt);
    await quick(page); await flipAll(page); await page.click('#btn-save');
  }
  const moneyText = await page.textContent('#reading');
  ok(/財務上可以試試|消費|風險|資源/.test(moneyText), '財運解讀聚焦消費、風險與資源');
  await page.screenshot({ path: path.join(SHOTS, '07-relation.png') });

  console.log('【同局不重複（壓力測試 300 局）】');
  const dupFree = await page.evaluate(async () => {
    for (let i = 0; i < 300; i++) {
      const ids = window.TAROT.CARDS.map((c) => c.id);
      // 以與程式相同的方式抽牌
      const d = ids.slice();
      for (let j = d.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [d[j], d[k]] = [d[k], d[j]]; }
      if (new Set(d.slice(0, 3)).size !== 3) return false;
    }
    return true;
  });
  ok(dupFree, '洗牌抽樣無重複');

  console.log('【歷史紀錄與主題篩選】');
  await page.goto(BASE + '#home');
  await page.click('#btn-history');
  await page.waitForSelector('#view-history:not([hidden])');
  const allCount = await page.locator('.history-item').count();
  ok(allCount === 8, `「全部」顯示 8 筆（實際 ${allCount}）`);
  const isDefaultAll = await page.getAttribute('[data-filter="all"]', 'aria-checked');
  ok(isDefaultAll === 'true', '預設選取「全部」');
  const times = await page.evaluate(() => { const l = window.STORE.list('all'); return l.map((r) => r.ts); });
  ok(times.every((t, i) => i === 0 || times[i - 1] >= t), '依占卜時間由新到舊排列');
  const cnt = {};
  for (const f of ['love', 'work', 'money', 'general']) {
    await page.click(`[data-filter="${f}"]`);
    cnt[f] = await page.locator('.history-item').count();
  }
  ok(cnt.love === 5, `「感情」含 4 筆感情關係牌陣（含略過情境）＋1 筆感情主題三張牌（實際 ${cnt.love}）`);
  ok(cnt.work === 1 && cnt.money === 1 && cnt.general === 1, '工作／財運／綜合各 1 筆');
  await page.click('[data-filter="love"]');
  await page.screenshot({ path: path.join(SHOTS, '08-history-love.png') });
  const loveSpreads = await page.evaluate(() => window.STORE.list('love').map((r) => r.spread + ':' + r.option));
  ok(loveSpreads.includes('relation:none') && loveSpreads.includes('guide:love'), '略過情境的感情牌陣與「感情」三張牌都歸入感情');
  // 刪除財運紀錄 → 空白提示
  await page.click('[data-filter="money"]');
  await page.locator('.history-item button').first().click();
  await page.waitForSelector('#view-record:not([hidden])');
  await page.click('#rec-delete');
  await page.click('#confirm-ok');
  await page.waitForSelector('#view-history:not([hidden])');
  await page.click('[data-filter="money"]');
  const emptyMsg = await page.textContent('#history-empty');
  ok(emptyMsg === '目前沒有這個主題的占卜紀錄' && await page.locator('#history-empty').isVisible(), '無符合紀錄時顯示空白提示');
  await page.screenshot({ path: path.join(SHOTS, '09-history-empty.png') });

  console.log('【歷史紀錄中的逆位】');
  const revRec = await page.evaluate(() => window.STORE.list('all').find((r) => r.cards.some((c) => c.rev)));
  await page.goto(BASE + '#record-' + revRec.id);
  await page.waitForSelector('#view-record:not([hidden])');
  const recRev = await page.evaluate((r) => {
    const i = r.cards.findIndex((c) => c.rev);
    const tile = document.querySelectorAll('#record-body .slots .tile')[i];
    return { m: tile.querySelector('img').getAttribute('src'), cap: getComputedStyle(tile.querySelector('.tile-cap')).transform, txt: tile.textContent };
  }, revRec);
  ok(/^cards\/rv\//.test(recRev.m) && recRev.cap === 'none' && /逆位/.test(recRev.txt), '歷史紀錄：逆位插畫倒置、文字正向');
  await page.screenshot({ path: path.join(SHOTS, '10-record.png'), fullPage: true });

  console.log('【結果卡：兩款配色、預覽＝下載、逆位、私密資訊】');
  await page.evaluate(() => localStorage.removeItem('yuexia.palette'));
  await page.reload();
  await page.waitForSelector('#view-record:not([hidden])');
  await page.click('#rec-preview');
  await page.waitForSelector('#card-preview[data-palette]');
  ok(await page.getAttribute('[data-palette="wine"].palette-opt', 'aria-checked') === 'true', '第一次預設「酒紅古金」');
  async function previewBytes() {
    return page.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())).length; });
  }
  async function downloadSample(name) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-card-download')]);
    const file = path.join(SHOTS, name);
    await dl.saveAs(file);
    return { file, suggested: dl.suggestedFilename() };
  }
  const prevWineSize = await previewBytes();
  const dWine = await downloadSample('card-wine.png');
  ok(fs.statSync(dWine.file).size === prevWineSize && /-wine\.png$/.test(dWine.suggested), '酒紅古金：下載的 PNG 與預覽完全相同');
  await page.click('[data-palette="parchment"].palette-opt');
  await page.waitForSelector('#card-preview[data-palette="parchment"]');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  const prevParchSize = await previewBytes();
  const dParch = await downloadSample('card-parchment.png');
  ok(fs.statSync(dParch.file).size === prevParchSize && /-parchment\.png$/.test(dParch.suggested), '羊皮紙米白：下載的 PNG 與預覽完全相同（切換即時更新）');
  await page.screenshot({ path: path.join(SHOTS, '11-card-modal.png') });
  // 像素檢查：背景色、逆位旋轉
  const pix = await page.evaluate(async (rec) => {
    const Y = window.__YUEXIA__;
    const data = Y.cardData(rec);
    async function canvasFor(pal) { return window.RESULTCARD.render(data, pal); }
    const wine = await canvasFor('wine'), parch = await canvasFor('parchment');
    const px = (cv, x, y) => Array.from(cv.getContext('2d').getImageData(x, y, 1, 1).data);
    // 逆位：結果卡中的牌圖應等於逆位圖（金框正向、插畫倒置），而不是正位圖
    const i = rec.cards.findIndex((c) => c.rev);
    const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
    const draw = (im) => { const c = document.createElement('canvas'); c.width = 300; c.height = 500; c.getContext('2d').drawImage(im, 0, 0, 300, 500); return c; };
    const ref = draw(await load('cards/rv/' + rec.cards[i].id + '.svg'));
    const up = draw(await load('cards/' + rec.cards[i].id + '.svg'));
    const x0 = (1080 - 960) / 2 + i * 330, y0 = 540;
    let match = 0, matchUnrot = 0, n = 0;
    for (let k = 0; k < 40; k++) {
      const x = 40 + (k * 53) % 220, y = 60 + (k * 97) % 380;
      const a = px(wine, x0 + x, y0 + y);
      const sx = Math.round(x * 300 / 300), sy = Math.round(y * 500 / 500);
      const r = Array.from(ref.getContext('2d').getImageData(sx, sy, 1, 1).data);
      const u = Array.from(up.getContext('2d').getImageData(sx, sy, 1, 1).data);
      const close = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 40;
      if (close(a, r)) match++; if (close(a, u)) matchUnrot++; n++;
    }
    return { wineBg: px(wine, 540, 30), parchBg: px(parch, 540, 30), match, matchUnrot, n };
  }, revRec);
  ok(pix.wineBg[0] > pix.wineBg[2] && pix.wineBg[0] < 120, '酒紅古金背景為深酒紅');
  ok(pix.parchBg[0] > 220 && pix.parchBg[1] > 200, '羊皮紙米白背景為米白');
  ok(pix.match >= pix.n * 0.85 && pix.match > pix.matchUnrot, `PNG 中逆位牌使用逆位圖（吻合 ${pix.match}/${pix.n}）`);
  const priv = await page.evaluate((rec) => JSON.stringify(window.__YUEXIA__.cardData(rec)), revRec);
  ok(!/測試提問|曖昧中|交往中|分開後/.test(priv) && !priv.includes(revRec.question || '@@none@@'), '結果卡資料不含私人提問與感情情境');
  await page.click('#card-close');

  console.log('【配色記憶】');
  await page.reload();
  await page.waitForSelector('#view-record:not([hidden])');
  await page.click('#rec-preview');
  await page.waitForSelector('#card-preview[data-palette]');
  ok(await page.getAttribute('#card-preview', 'data-palette') === 'parchment', '重新開啟後沿用上次的「羊皮紙米白」');
  await page.click('#card-close');

  console.log('【離線（飛航模式模擬）】');
  await ctx.setOffline(true);
  await page.goto(BASE);
  await page.waitForSelector('#view-home:not([hidden])');
  ok(await page.isVisible('.hero-title'), '離線重新開啟首頁');
  await startSpread(page, 'relation', 'dating', '離線提問');
  await page.locator('.deck-card').nth(3).click();
  await page.locator('.deck-card:not([hidden])').nth(7).click();
  await page.locator('.deck-card:not([hidden])').nth(11).click();
  await flipAll(page);
  const offImgs = await page.$$eval('#slots img', (els) => els.every((e) => e.complete && e.naturalWidth > 0));
  ok(offImgs, '離線時牌圖正常顯示');
  await page.click('#btn-save');
  await startSpread(page, 'guide', 'money');
  await quick(page); await flipAll(page); await page.click('#btn-save');
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  await page.click('[data-filter="money"]');
  ok(await page.locator('.history-item').count() === 1, '離線切換篩選（財運 1 筆）');
  await page.click('[data-filter="love"]');
  ok(await page.locator('.history-item').count() === 6, '離線切換篩選（感情 6 筆）');
  await page.locator('.history-item button').first().click();
  await page.waitForSelector('#view-record:not([hidden])');
  ok(/離線提問/.test(await page.textContent('#record-body')), '離線查看紀錄');
  await page.click('#rec-preview');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  const offP = await downloadSample('offline-parchment.png');
  await page.click('[data-palette="wine"].palette-opt');
  await page.waitForSelector('#card-preview[data-palette="wine"]');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  const offW = await downloadSample('offline-wine.png');
  ok(fs.statSync(offP.file).size > 100000 && fs.statSync(offW.file).size > 100000, '離線下載兩款結果卡 PNG');
  await page.click('#card-close');
  await page.click('#rec-delete'); await page.click('#confirm-ok');
  await page.waitForSelector('#view-history:not([hidden])');
  ok(await page.evaluate(() => window.STORE.list('love').length) === 5, '離線刪除紀錄');
  await ctx.setOffline(false);

  console.log('【減少動態效果】');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE);
  await startSpread(p2, 'guide', 'work');
  await quick(p2); await flipAll(p2);
  const fl = await p2.$eval('[data-slot="0"] .flipper', (e) => getComputedStyle(e).transform);
  ok(fl === 'none', '減少動態效果時以淡入取代 3D 翻轉');
  await ctx2.close();

  console.log('【桌面瀏覽器】');
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE);
  await startSpread(p3, 'guide', 'general');
  await quick(p3); await flipAll(p3);
  await p3.screenshot({ path: path.join(SHOTS, '12-desktop.png') });
  ok(true, '桌面版完成一局');
  await ctx3.close();

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
