// 新功能驗收：今日指引、牌卡圖鑑、二選一與時間之流牌陣、個人統計、結果卡加強
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/features.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

async function startSpread(page, spread, option, question, choices) {
  await page.goto(BASE + '#setup-' + spread);
  await page.waitForSelector('#view-setup:not([hidden])');
  await page.click(`[data-opt="${option}"]`);
  if (choices) { await page.fill('#setup-choice-a', choices[0]); await page.fill('#setup-choice-b', choices[1]); }
  await page.fill('#setup-question', question || '');
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
}
async function quick(page) {
  await page.click('#tab-quick');
  await page.click('#btn-quick');
  await page.waitForFunction(() => { const d = window.__YUEXIA__.draw; return d && d.picks.length === d.n && !d.busy; });
}
async function flipAll(page, n) {
  for (let i = 0; i < n; i++) { await page.click(`[data-slot="${i}"]`); await page.waitForTimeout(60); }
  await page.waitForSelector('#reading:not([hidden])');
}
async function pngSize(page) {
  return page.evaluate(async () => {
    const img = document.getElementById('card-preview');
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 60000 });

  console.log('【今日指引】');
  ok(await page.isVisible('#btn-daily'), '首頁顯示「抽今日一張」');
  await page.click('#btn-daily');
  await page.waitForSelector('#daily-detail');
  const d1 = await page.evaluate(() => JSON.parse(localStorage.getItem('yuexia.daily')));
  ok(d1 && d1.date === await page.evaluate(() => window.__YUEXIA__.dateKey()), '抽出今日的牌並記錄日期');
  const name1 = await page.textContent('.daily-name');
  ok(await page.locator('#daily-card.is-flipped').count() === 1 && name1.length > 0, `翻開今日的牌（${name1}）`);
  await page.screenshot({ path: path.join(SHOTS, 'f01-daily.png') });
  await page.reload();
  await page.waitForSelector('.daily-name');
  ok(await page.textContent('.daily-name') === name1, '同一天重新開啟，仍是同一張牌');
  ok(await page.locator('#btn-daily').count() === 0, '同一天不能重抽');
  if (d1.rev) {
    const src = await page.$eval('#daily-front img', (e) => e.getAttribute('src'));
    ok(/^cards\/rv\//.test(src), '今日的牌為逆位時使用逆位圖');
  }
  // 模擬隔天
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('yuexia.daily')); d.date = '2000-01-01'; localStorage.setItem('yuexia.daily', JSON.stringify(d)); });
  await page.reload();
  ok(await page.isVisible('#btn-daily'), '隔天可以重新抽牌');
  await page.click('#daily-detail').catch(() => {});

  console.log('【牌卡圖鑑】');
  await page.click('#btn-gallery');
  await page.waitForSelector('#view-gallery:not([hidden])');
  ok(await page.locator('.gallery-item').count() === 78, '圖鑑顯示全部 78 張');
  const counts = {};
  for (const f of ['major', 'wands', 'cups', 'swords', 'pentacles']) {
    await page.click(`[data-gfilter="${f}"]`);
    counts[f] = await page.locator('.gallery-item').count();
  }
  ok(counts.major === 22 && counts.wands === 14 && counts.cups === 14 && counts.swords === 14 && counts.pentacles === 14, '篩選：大阿爾克那 22、四種花色各 14');
  await page.click('[data-gfilter="all"]');
  await page.screenshot({ path: path.join(SHOTS, 'f02-gallery.png') });
  await page.locator('.gallery-item').nth(16).click();
  await page.waitForSelector('#view-card:not([hidden])');
  const detail = await page.textContent('#card-body');
  ok(/高塔/.test(detail) && /正位/.test(detail) && /逆位/.test(detail) && /突然變動/.test(detail), '單張頁顯示牌名與正逆位牌義');
  await page.click('[data-orient="rv"]');
  ok(/^cards\/rv\/m16\.svg$/.test(await page.getAttribute('#card-detail-img', 'src')), '切換逆位時顯示逆位圖');
  await page.click('[data-orient="up"]');
  ok(/^cards\/m16\.svg$/.test(await page.getAttribute('#card-detail-img', 'src')), '切回正位');
  await page.click('[data-orient="rv"]');
  await page.screenshot({ path: path.join(SHOTS, 'f03-card.png'), fullPage: true });
  await page.click('#card-next');
  ok(/星星/.test(await page.textContent('#card-body')), '「下一張」切換到星星');
  await page.click('#btn-back');
  await page.waitForSelector('#view-gallery:not([hidden])');
  ok(true, '返回圖鑑');

  console.log('【二選一牌陣】');
  await startSpread(page, 'choice', 'work', '要不要換工作', ['留在現職', '去新公司']);
  ok(/選項 A：留在現職/.test(await page.textContent('#draw-question')), '抽牌畫面顯示自己填的選項（僅本機）');
  const cpos = await page.$$eval('.tile-pos', (els) => els.map((e) => e.textContent));
  ok(cpos.join('／') === '選項 A 的發展／選項 B 的發展／我真正在意的事', '二選一牌位正確');
  await quick(page); await flipAll(page, 3);
  const csum = await page.textContent('.reading-block p');
  ok(/選項 A 呈現/.test(csum) && /牌不替你做決定/.test(csum), '二選一摘要比較兩個選項');
  const cdata = await page.evaluate(() => JSON.stringify(window.__YUEXIA__.cardData({ spread: 'choice', ts: 1, cards: window.__YUEXIA__.draw.picks, reading: window.__YUEXIA__.draw.reading })));
  ok(!/留在現職|去新公司|要不要換工作/.test(cdata), '結果卡不含選項名稱與提問');
  await page.click('#btn-save');

  console.log('【時間之流牌陣（五張）】');
  await startSpread(page, 'flow', 'love', '');
  ok(await page.locator('[data-slot]').count() === 5, '五個牌位');
  ok((await page.textContent('#tab-quick')).includes('快速抽五張'), '按鈕顯示「快速抽五張」');
  await page.locator('.deck-card').nth(2).click();
  await page.locator('.deck-card:not([hidden])').nth(9).click();
  await page.click('#tab-quick'); await page.click('#btn-quick');
  await page.waitForSelector('#confirm-modal:not([hidden])');
  ok(/重新抽選全部五張/.test(await page.textContent('#confirm-text')), '部分手選後提示「重新抽選全部五張」');
  await page.click('#confirm-ok');
  await page.waitForFunction(() => window.__YUEXIA__.draw.picks.length === 5 && !window.__YUEXIA__.draw.busy);
  const fp = await page.evaluate(() => window.__YUEXIA__.draw.picks.map((p) => p.id));
  ok(new Set(fp).size === 5, '五張不重複');
  ok(await page.locator('[data-slot="4"]').isDisabled(), '必須依序翻牌');
  await flipAll(page, 5);
  ok(await page.locator('.reading-detail').count() === 5, '五段逐張解讀');
  ok(/從過去的/.test(await page.textContent('.reading-block p')), '時間之流摘要');
  await page.screenshot({ path: path.join(SHOTS, 'f04-flow.png'), fullPage: true });
  await page.click('#btn-save');
  // 五張的結果卡：直式與方形
  await page.evaluate(() => { localStorage.setItem('yuexia.cardFormat', 'portrait'); });
  await page.click('#btn-preview');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  ok(JSON.stringify(await pngSize(page)) === '[1080,1920]', '五張直式結果卡 1080×1920');
  fs.writeFileSync(path.join(SHOTS, 'f05-flow-portrait.png'), Buffer.from(await page.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())); })));
  await page.click('[data-format="square"]');
  await page.waitForSelector('#card-preview[data-format="square"]');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  ok(JSON.stringify(await pngSize(page)) === '[1080,1080]', '五張方形結果卡 1080×1080');
  fs.writeFileSync(path.join(SHOTS, 'f06-flow-square.png'), Buffer.from(await page.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())); })));
  await page.click('#card-close');

  console.log('【結果卡：深藍星空、方形、日期】');
  await startSpread(page, 'guide', 'money', '');
  await quick(page); await flipAll(page, 3); await page.click('#btn-save');
  await page.click('#btn-preview');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  ok(await page.getAttribute('#card-preview', 'data-format') === 'square', '方形格式被記住');
  await page.click('[data-palette="navy"].palette-opt');
  await page.waitForSelector('#card-preview[data-palette="navy"]');
  await page.click('#card-show-date');
  await page.waitForSelector('#card-preview[data-date="1"]');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  const navyPx = await page.evaluate(async () => {
    const img = document.getElementById('card-preview'); await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); return Array.from(x.getImageData(540, 20, 1, 1).data);
  });
  ok(navyPx[2] > navyPx[0] && navyPx[0] < 60, '深藍星空背景為深藍色');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-card-download')]);
  ok(/-square-navy\.png$/.test(dl.suggestedFilename()), `下載檔名反映格式與配色（${dl.suggestedFilename()}）`);
  await page.screenshot({ path: path.join(SHOTS, 'f07-card-options.png') });
  fs.writeFileSync(path.join(SHOTS, 'f08-guide-square-navy.png'), Buffer.from(await page.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())); })));
  await page.click('#card-close');
  await page.reload();
  await page.waitForSelector('#view-draw, #view-home');
  const prefs = await page.evaluate(() => ({ p: window.STORE.getPalette(), f: window.STORE.getCardFormat(), d: window.STORE.getShowDate() }));
  ok(prefs.p === 'navy' && prefs.f === 'square' && prefs.d === true, '重新開啟後沿用配色、格式與日期設定');

  console.log('【歷史分類與統計】');
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  ok(await page.locator('.history-item').count() === 3, '歷史共 3 筆');
  await page.click('[data-filter="work"]');
  ok(await page.locator('.history-item').count() === 1, '二選一依主題歸入「工作」');
  await page.click('[data-filter="love"]');
  ok(await page.locator('.history-item').count() === 1, '時間之流依主題歸入「感情」');
  const rec = await page.evaluate(() => window.STORE.list('work')[0]);
  await page.goto(BASE + '#record-' + rec.id);
  await page.waitForSelector('#view-record:not([hidden])');
  ok(/選項 A：留在現職/.test(await page.textContent('#record-body')), '紀錄頁顯示選項名稱（僅本機）');
  await page.goto(BASE + '#history');
  await page.click('#btn-stats');
  await page.waitForSelector('#view-stats:not([hidden])');
  const st = await page.evaluate(() => ({ total: document.getElementById('stat-total').textContent, cards: document.getElementById('stat-cards').textContent, top: document.querySelectorAll('#stat-top li').length }));
  ok(st.total === '3' && st.cards === '11', `統計：3 次占卜、11 張牌（實際 ${st.total}、${st.cards}）`);
  const revExpect = await page.evaluate(() => { const l = window.STORE.list('all'); let r = 0, n = 0; l.forEach((x) => x.cards.forEach((c) => { n++; if (c.rev) r++; })); return Math.round(r / n * 100) + '%'; });
  ok(await page.textContent('#stat-rev') === revExpect, '逆位比例計算正確');
  ok(st.top === 5, '列出最常出現的 5 張牌');
  await page.screenshot({ path: path.join(SHOTS, 'f09-stats.png'), fullPage: true });
  await page.evaluate(() => localStorage.removeItem('yuexia.history.v1'));
  await page.reload();
  await page.waitForSelector('#view-stats:not([hidden])');
  ok(/還沒有儲存的占卜紀錄/.test(await page.textContent('#stats-body')), '沒有紀錄時顯示空白提示');

  console.log('【離線使用新功能】');
  await ctx.setOffline(true);
  await page.goto(BASE + '#cards');
  await page.waitForSelector('#view-gallery:not([hidden])');
  await page.locator('.gallery-item').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  ok(await page.$eval('.gallery-item:last-child img', (e) => e.complete && e.naturalWidth > 0), '離線瀏覽圖鑑');
  await startSpread(page, 'flow', 'general', '');
  await quick(page); await flipAll(page, 5);
  ok(true, '離線完成時間之流占卜');
  await ctx.setOffline(false);

  await page.goto(BASE);
  await page.screenshot({ path: path.join(SHOTS, 'f10-home.png'), fullPage: true });
  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
