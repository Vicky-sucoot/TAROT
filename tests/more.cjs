// 逆位開關、結果卡網址、聖杯八月亮、單張快問、第一次使用的導覽
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/more.cjs
const { chromium, devices } = require('playwright');
const { skipOnboarding } = require('./helpers.cjs');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

async function quickRound(page, spread, option) {
  await page.goto(BASE + '#setup-' + spread);
  await page.waitForSelector('#view-setup:not([hidden])');
  await page.click(`[data-opt="${option}"]`);
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
  await page.click('#tab-quick'); await page.click('#btn-quick');
  await page.waitForFunction(() => { const d = window.__YUEXIA__.draw; return d && d.picks.length === d.n && !d.busy; });
  return page.evaluate(() => window.__YUEXIA__.draw.picks.map((p) => p.rev));
}

(async () => {
  const browser = skipOnboarding(await chromium.launch());
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 90000 });

  console.log('【逆位開關】');
  await page.goto(BASE + '#settings');
  ok(await page.getAttribute('[data-set-rev="1"]', 'aria-checked') === 'true', '預設使用正逆位');
  await page.click('[data-set-rev="0"]');
  ok(await page.evaluate(() => window.STORE.getReversals()) === false, '切換為只用正位');
  let anyRev = false;
  for (let i = 0; i < 6; i++) { const r = await quickRound(page, 'flow', 'general'); if (r.some(Boolean)) anyRev = true; }
  ok(!anyRev, '只用正位時，連續 6 局（30 張）都沒有逆位');
  ok(/只用正位/.test(await page.textContent('#draw-meta')), '抽牌畫面提示「只用正位」');
  await page.evaluate(() => { localStorage.removeItem('yuexia.daily'); localStorage.removeItem('yuexia.dailyLog'); });
  await page.goto(BASE); await page.reload();
  await page.click('#btn-daily');
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('yuexia.daily')).rev) === false, '今日指引也只抽正位');
  await page.goto(BASE + '#settings');
  await page.click('[data-set-rev="1"]');
  let sawRev = false;
  for (let i = 0; i < 8 && !sawRev; i++) { const r = await quickRound(page, 'flow', 'general'); if (r.some(Boolean)) sawRev = true; }
  ok(sawRev, '切回使用正逆位後會再出現逆位');
  const bk = await page.evaluate(() => { window.STORE.setReversals(false); const b = window.BACKUP.parse(JSON.stringify(window.BACKUP.build([], { reversals: window.STORE.getReversals() }, {}))); window.STORE.setReversals(true); return b.settings.reversals; });
  ok(bk === false, '逆位設定會納入備份');

  console.log('【結果卡上的網址】');
  const site = await page.evaluate(() => window.__YUEXIA__.cardData({ spread: 'guide', ts: Date.now(), cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: false }, { id: 'm02', rev: false }], reading: { publicLine: '測試' } }).site);
  ok(site === 'vicky-sucoot.github.io/TAROT', `結果卡資料帶有網站網址（${site}）`);
  const diff = await page.evaluate(async () => {
    const base = window.__YUEXIA__.cardData({ spread: 'guide', ts: Date.now(), cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: false }, { id: 'm02', rev: false }], reading: { publicLine: window.PUBLIC_LINES.m02[0] } });
    const out = {};
    for (const fmt of ['portrait', 'square']) {
      const a = await window.RESULTCARD.render(base, 'wine', { format: fmt });
      const b = await window.RESULTCARD.render(Object.assign({}, base, { site: '' }), 'wine', { format: fmt });
      const y0 = a.height - (fmt === 'portrait' ? 140 : 110), h = 60;
      const da = a.getContext('2d').getImageData(0, y0, a.width, h).data, db = b.getContext('2d').getImageData(0, y0, a.width, h).data;
      let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > 30) n++;
      out[fmt] = n;
    }
    return out;
  });
  ok(diff.portrait > 200 && diff.square > 200, `直式與方形結果卡的頁尾都畫上網址（差異像素 ${diff.portrait}／${diff.square}）`);
  const privacy = await page.evaluate(() => JSON.stringify(window.__YUEXIA__.cardData({ spread: 'guide', ts: 1, question: '秘密問題', cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: false }, { id: 'm02', rev: false }], reading: { publicLine: 'x' } })));
  ok(!/秘密問題/.test(privacy), '加上網址後仍不含私人提問');

  console.log('【聖杯八的月亮】');
  const c08 = fs.readFileSync(path.join(__dirname, '..', 'cards', 'c08.svg'), 'utf8');
  ok(/#efe6cf/.test(c08), '聖杯八的月亮改為清楚可見的滿月與新月臉');

  console.log('【單張快問】');
  await page.goto(BASE);
  ok(await page.locator('[data-start="single"]').count() === 1, '首頁有「單張快問」');
  await page.goto(BASE + '#setup-single');
  await page.waitForSelector('#view-setup:not([hidden])');
  ok(/小問題/.test(await page.textContent('#spread-guide-fit')) && await page.locator('.example-q').count() === 3, '單張快問有說明與提問範例');
  await page.click('[data-opt="love"]');
  await page.fill('#setup-question', '今天要主動傳訊息嗎');
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
  ok(await page.locator('[data-slot]').count() === 1, '一個牌位');
  ok((await page.textContent('#tab-quick')).includes('快速抽一張'), '按鈕顯示「快速抽一張」');
  await page.locator('.deck-card').nth(10).click();
  ok(await page.evaluate(() => window.__YUEXIA__.draw.picks.length) === 1 && await page.isHidden('#pick-area'), '手選一張後立即可以翻牌');
  await page.click('[data-slot="0"]');
  await page.waitForSelector('#reading:not([hidden])');
  const one = await page.evaluate(() => {
    const d = window.__YUEXIA__.draw;
    return { details: document.querySelectorAll('.reading-detail').length, summary: document.querySelector('.reading-block p').textContent, status: document.getElementById('draw-status').textContent,
      pl: d.reading.publicLine === window.PUBLIC_LINES[d.picks[0].id][d.picks[0].rev ? 1 : 0], topic: d.reading.cards[0].body.some((b) => b.startsWith('放在感情上：')) };
  });
  ok(one.details === 1 && /這次抽到「/.test(one.summary) && one.status === '牌已經翻開了', '單張解讀與摘要');
  ok(one.pl && one.topic, '結果卡指引與主題牌義都對應這張牌');
  await page.screenshot({ path: path.join(SHOTS, 'm01-single.png'), fullPage: true });
  await page.click('#btn-save');
  await page.click('#btn-preview');
  await page.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  const sz = await page.evaluate(async () => { const i = document.getElementById('card-preview'); await i.decode(); return [i.naturalWidth, i.naturalHeight]; });
  ok(sz[0] === 1080 && (sz[1] === 1920 || sz[1] === 1080), '單張結果卡可以產生');
  fs.writeFileSync(path.join(SHOTS, 'm02-single-card.png'), Buffer.from(await page.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())); })));
  await page.click('#card-close');
  await page.goto(BASE + '#history');
  await page.click('[data-filter="love"]');
  ok(/單張快問/.test(await page.textContent('#history-list')), '單張快問依主題歸入「感情」');
  await page.goto(BASE + '#stats');
  ok(/單張快問/.test(await page.textContent('#stats-body')), '統計列出單張快問的次數');

  console.log('【第一次使用的導覽】');
  const ctx2 = await browser.newContextRaw({ ...devices['iPhone 13'] });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto(BASE);
  await p2.waitForSelector('#onboard:not([hidden])');
  ok(true, '第一次打開時顯示導覽');
  ok(/歡迎來到月下占卜/.test(await p2.textContent('.ob-page:not([hidden])')), '第 1 頁：歡迎與選牌陣');
  await p2.screenshot({ path: path.join(SHOTS, 'm03-onboard1.png') });
  await p2.click('#ob-next');
  ok(/洗牌、抽牌、翻牌/.test(await p2.textContent('.ob-page:not([hidden])')), '第 2 頁：抽牌與翻牌');
  await p2.click('#ob-next');
  ok(/紀錄只留在這台手機/.test(await p2.textContent('.ob-page:not([hidden])')) && (await p2.textContent('#ob-next')) === '開始使用', '第 3 頁：隱私與備份，按鈕改為「開始使用」');
  await p2.screenshot({ path: path.join(SHOTS, 'm04-onboard3.png') });
  await p2.click('#ob-next');
  ok(await p2.isHidden('#onboard'), '按「開始使用」關閉導覽');
  await p2.reload();
  await p2.waitForTimeout(400);
  ok(await p2.isHidden('#onboard'), '看過之後不再自動出現');
  await p2.goto(BASE + '#settings');
  await p2.click('#btn-onboard');
  ok(await p2.isVisible('#onboard') && /歡迎/.test(await p2.textContent('.ob-page:not([hidden])')), '設定頁可以重看導覽');
  await p2.click('#ob-skip');
  ok(await p2.isHidden('#onboard'), '「略過」關閉導覽');
  await p2.click('#btn-clear-all'); await p2.click('#confirm-ok');
  await p2.goto(BASE); await p2.reload();
  await p2.waitForSelector('#onboard:not([hidden])');
  ok(true, '清除所有資料後，下次打開會再顯示導覽');
  await ctx2.close();

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
