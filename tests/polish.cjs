// 今日指引用語、分享預覽、淺色主題、牌陣說明驗收
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/polish.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

// WCAG 對比度
function lum(rgb) { const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
const parse = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 90000 });

  console.log('【今日指引用語】');
  await page.evaluate(() => window.STORE.setDaily({ date: window.__YUEXIA__.dateKey(), id: 'p05', rev: false }));
  await page.reload();
  await page.waitForSelector('.daily-line');
  const line = await page.textContent('.daily-line');
  const expect = await page.evaluate(() => window.PUBLIC_LINES.p05[0]);
  ok(line === expect && !/匱乏感/.test(line), `今日指引使用專屬指引句（${line}）`);
  const journalLine = await page.evaluate(() => {
    const k = window.__YUEXIA__.dateKey();
    location.hash = '#journal';
    return k;
  });
  await page.waitForSelector('#view-journal:not([hidden])');
  await page.click(`[data-jday="${journalLine}"]`);
  ok((await page.textContent('.j-detail')).includes(expect), '月曆中的那天也顯示同一句');

  console.log('【分享預覽】');
  const og = await page.evaluate(() => {
    const m = (p) => (document.querySelector(`meta[property="${p}"]`) || document.querySelector(`meta[name="${p}"]`) || {}).content;
    return { title: m('og:title'), desc: m('og:description'), url: m('og:url'), image: m('og:image'), w: m('og:image:width'), h: m('og:image:height'), card: m('twitter:card'), type: m('og:type') };
  });
  ok(og.title === '月下占卜' && /聽見自己的答案/.test(og.desc), 'og:title 與 og:description');
  ok(/^https:\/\//.test(og.url) && /^https:\/\/.+\/icons\/og-image\.jpg$/.test(og.image), '分享網址與預覽圖使用完整 HTTPS 網址');
  ok(og.w === '1200' && og.h === '630' && og.card === 'summary_large_image' && og.type === 'website', '預覽圖尺寸 1200×630 與大圖卡片設定');
  const ogLocal = await page.evaluate(async () => {
    const img = new Image(); img.src = 'icons/og-image.jpg'; await img.decode(); return [img.naturalWidth, img.naturalHeight];
  });
  ok(ogLocal[0] === 1200 && ogLocal[1] === 630, '預覽圖檔案實際為 1200×630');
  const ogSize = fs.statSync(path.join(__dirname, '..', 'icons', 'og-image.jpg')).size;
  ok(ogSize < 300 * 1024, `預覽圖大小 ${Math.round(ogSize / 1024)} KB`);

  console.log('【牌陣說明】');
  for (const s of ['guide', 'relation', 'choice', 'flow']) {
    await page.goto(BASE + '#setup-' + s);
    await page.waitForSelector('#view-setup:not([hidden])');
    const g = await page.evaluate(() => ({ fit: document.getElementById('spread-guide-fit').textContent, how: document.getElementById('spread-guide-how').textContent, ex: document.querySelectorAll('.example-q').length }));
    ok(g.fit.length > 20 && g.how.length > 30 && g.ex === 3, `${s}：說明適合問什麼、怎麼看，並有 3 個提問範例`);
  }
  await page.goto(BASE + '#setup-choice');
  await page.click('#spread-guide summary');
  await page.locator('.example-q').nth(1).click();
  ok((await page.inputValue('#setup-question')) === '這次旅行要去日本還是台東？', '點範例會填入提問');
  await page.screenshot({ path: path.join(SHOTS, 'p01-guide.png'), fullPage: true });

  console.log('【介面主題】');
  await page.goto(BASE);
  ok(await page.getAttribute('html', 'data-theme') === 'dark', '預設為深色酒紅');
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.goto(BASE + '#settings');
  await page.waitForSelector('#view-settings:not([hidden])');
  ok(await page.getAttribute('[data-set-theme="dark"]', 'aria-checked') === 'true', '設定頁標示目前主題');
  await page.click('[data-set-theme="light"]');
  ok(await page.getAttribute('html', 'data-theme') === 'light', '切換為淺色羊皮紙');
  ok(await page.getAttribute('meta[name="theme-color"]', 'content') === '#efe2c2', '同步更新瀏覽器頂部顏色');
  await page.goto(BASE);
  await page.reload();
  ok(await page.getAttribute('html', 'data-theme') === 'light', '重新開啟後沿用淺色');
  const lightBg = parse(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
  ok(lightBg[0] > 200 && lightBg[1] > 180 && darkBg !== await page.evaluate(() => getComputedStyle(document.body).backgroundColor), '淺色主題的背景為米色');
  // 主要文字對比度（淺色背景上）
  const pairs = await page.evaluate(() => {
    const g = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; };
    return { heading: g('.hero-title'), tagline: g('.hero-tagline'), daily: g('.daily-name'), offline: g('#offline-text'), topbar: g('.topbar-title') };
  });
  const bg = [231, 212, 170];
  const worst = Object.entries(pairs).filter(([, v]) => v).map(([k, v]) => [k, contrast(parse(v), bg)]);
  ok(worst.every(([, c]) => c >= 4.5), '淺色主題文字對比度 ≥ 4.5：' + worst.map(([k, c]) => k + ' ' + c.toFixed(1)).join('、'));
  await page.screenshot({ path: path.join(SHOTS, 'p02-light-home.png'), fullPage: true });
  // 抽一局確認選取狀態與解讀可讀
  await page.goto(BASE + '#setup-guide');
  const chipSel = await page.evaluate(() => { const e = document.querySelector('.chip[aria-checked="true"]'); const s = getComputedStyle(e); return [s.color, s.backgroundColor]; });
  ok(contrast(parse(chipSel[0]), parse(chipSel[1])) >= 4.5, '淺色主題的選取按鈕對比清楚');
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
  await page.click('#tab-quick'); await page.click('#btn-quick');
  await page.waitForFunction(() => window.__YUEXIA__.draw.picks.length === 3 && !window.__YUEXIA__.draw.busy);
  for (let i = 0; i < 3; i++) await page.click(`[data-slot="${i}"]`);
  await page.waitForSelector('#reading:not([hidden])');
  const nameC = await page.evaluate(() => getComputedStyle(document.querySelector('.tile-name')).color);
  ok(contrast(parse(nameC), bg) >= 4.5, '淺色主題的牌名清楚可讀');
  await page.screenshot({ path: path.join(SHOTS, 'p03-light-reading.png'), fullPage: true });

  console.log('【跟隨系統】');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'light' });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE);
  await p2.evaluate(() => localStorage.setItem('yuexia.theme', 'system'));
  await p2.reload();
  ok(await p2.getAttribute('html', 'data-theme') === 'light', '系統為淺色時使用淺色');
  await p2.emulateMedia({ colorScheme: 'dark' });
  await p2.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark', null, { timeout: 3000 }).catch(() => {});
  ok(await p2.getAttribute('html', 'data-theme') === 'dark', '系統切換為深色時即時跟著切換');
  await ctx2.close();

  console.log('【備份、清除與首次繪製】');
  const flash = await (async () => {
    const ctx3 = await browser.newContext({ ...devices['iPhone 13'] });
    await ctx3.addInitScript(() => { try { localStorage.setItem('yuexia.theme', 'light'); } catch (e) {} });
    const p3 = await ctx3.newPage();
    await p3.goto(BASE, { waitUntil: 'commit' });
    await p3.waitForSelector('html[data-theme]');
    const t = await p3.getAttribute('html', 'data-theme');
    await ctx3.close();
    return t;
  })();
  ok(flash === 'light', '頁面一開始繪製就套用淺色（不會先閃深色）');
  await page.goto(BASE + '#settings');
  await page.click('#btn-clear-all'); await page.click('#confirm-ok');
  ok(await page.getAttribute('html', 'data-theme') === 'dark', '清除所有資料後回到深色預設');

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
