// 設定頁、首頁精簡、歷史搜尋、標籤、刪除復原、清除所有資料
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/ui.cjs
const { chromium, devices } = require('playwright');
const { skipOnboarding } = require('./helpers.cjs');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

async function playOnce(page, spread, option, question, choices) {
  await page.goto(BASE + '#setup-' + spread);
  await page.waitForSelector('#view-setup:not([hidden])');
  await page.click(`[data-opt="${option}"]`);
  if (choices) { await page.fill('#setup-choice-a', choices[0]); await page.fill('#setup-choice-b', choices[1]); }
  await page.fill('#setup-question', question || '');
  await page.click('#btn-shuffle');
  await page.waitForSelector('#pick-area:not([hidden])');
  await page.click('#tab-quick'); await page.click('#btn-quick');
  await page.waitForFunction(() => { const d = window.__YUEXIA__.draw; return d && d.picks.length === d.n && !d.busy; });
  const n = await page.evaluate(() => window.__YUEXIA__.draw.n);
  for (let i = 0; i < n; i++) await page.click(`[data-slot="${i}"]`);
  await page.waitForSelector('#reading:not([hidden])');
  await page.click('#btn-save');
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
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 60000 });

  console.log('【首頁精簡】');
  ok(await page.isVisible('#offline-line'), '首頁保留一行離線狀態');
  ok(await page.isVisible('#install-guide') && !(await page.getAttribute('#install-guide', 'open')), '在 Safari 中首頁保留收合的安裝教學');
  ok(await page.locator('#view-home #btn-export').count() === 0 && await page.locator('#view-home .privacy-note').count() === 0, '備份與隱私說明移到設定頁');
  ok(await page.isVisible('#btn-settings') && !(await page.isVisible('#btn-home')), '首頁右上角顯示設定按鈕');
  const homeH = await page.evaluate(() => document.getElementById('view-home').scrollHeight);
  ok(homeH > 0, `首頁高度 ${homeH}px`);
  await page.screenshot({ path: path.join(SHOTS, 'u01-home.png'), fullPage: true });

  console.log('【設定頁】');
  await page.click('#offline-line');
  await page.waitForSelector('#view-settings:not([hidden])');
  ok(true, '點離線狀態進入設定頁');
  ok(await page.textContent('#set-offline-text') === '已可離線使用', '設定頁顯示離線狀態');
  ok((await page.textContent('#app-version')).length >= 6, '顯示版本號');
  ok(await page.isVisible('#btn-export') && await page.isVisible('#btn-import'), '設定頁有備份與還原');
  ok(await page.isVisible('#btn-home') && !(await page.isVisible('#btn-settings')), '其他頁面右上角改為回首頁');
  ok(await page.getAttribute('[data-set-palette="wine"]', 'aria-checked') === 'true', '預設配色為酒紅古金');
  await page.click('[data-set-palette="parchment"]');
  await page.click('[data-set-format="square"]');
  await page.check('#set-show-date');
  const prefs = await page.evaluate(() => ({ p: window.STORE.getPalette(), f: window.STORE.getCardFormat(), d: window.STORE.getShowDate() }));
  ok(prefs.p === 'parchment' && prefs.f === 'square' && prefs.d, '在設定頁更改結果卡預設');
  await page.screenshot({ path: path.join(SHOTS, 'u02-settings.png'), fullPage: true });
  await playOnce(page, 'guide', 'love', '我該不該先傳訊息');
  await page.click('#btn-preview');
  await page.waitForSelector('#card-preview[data-palette]');
  ok(await page.getAttribute('#card-preview', 'data-palette') === 'parchment' && await page.getAttribute('#card-preview', 'data-format') === 'square', '結果卡沿用設定頁的預設');
  await page.click('#card-close');

  console.log('【歷史：標籤同一行、搜尋】');
  await playOnce(page, 'choice', 'work', '', ['留在台北', '搬去台中']);
  await playOnce(page, 'flow', 'money', '年底的存錢計畫');
  const recs = await page.evaluate(() => window.STORE.list('all'));
  await page.goto(BASE + '#record-' + recs[2].id);
  await page.waitForSelector('#rec-note');
  await page.fill('#rec-note', '後來真的先傳了訊息');
  await page.click('#rec-note-save');
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  const tagRow = await page.evaluate(() => {
    const tags = document.querySelectorAll('.history-item .hi-tags');
    return Array.from(tags).map((t) => { const s = t.querySelectorAll('.hi-tag'); return { n: s.length, sameLine: Array.from(s).every((x) => Math.abs(x.getBoundingClientRect().top - s[0].getBoundingClientRect().top) < 2) }; });
  });
  ok(tagRow.some((r) => r.n === 2) && tagRow.every((r) => r.sameLine), '主題標籤與「已回顧」排在同一行');
  const search = async (q) => { await page.fill('#history-search', q); return page.locator('.history-item').count(); };
  ok(await search('傳訊息') === 1, '搜尋提問與筆記文字');
  ok(await search('台中') === 1, '搜尋二選一的選項名稱');
  ok(await search('時間之流') === 1, '搜尋牌陣名稱');
  const cardName = await page.evaluate(() => window.TAROT.BY_ID[window.STORE.list('all')[0].cards[0].id].name);
  ok(await search(cardName) >= 1, `搜尋牌名（${cardName}）`);
  ok(await search('完全不存在的字') === 0 && /找不到符合/.test(await page.textContent('#history-empty')), '沒有結果時顯示提示');
  await page.fill('#history-search', '');
  await page.click('[data-filter="money"]');
  ok(await page.locator('.history-item').count() === 1, '搜尋清空後恢復主題篩選');
  await page.fill('#history-search', '存錢');
  ok(await page.locator('.history-item').count() === 1, '搜尋與主題篩選可以同時使用');
  await page.click('[data-filter="work"]');
  ok(await page.locator('.history-item').count() === 0, '篩選工作＋搜尋「存錢」沒有結果');
  await page.screenshot({ path: path.join(SHOTS, 'u03-search.png'), fullPage: true });
  await page.fill('#history-search', '');
  await page.click('[data-filter="all"]');

  console.log('【刪除後復原】');
  const before = await page.evaluate(() => window.STORE.list('all').map((r) => r.id));
  await page.goto(BASE + '#record-' + recs[2].id);
  await page.waitForSelector('#rec-delete');
  await page.click('#rec-delete'); await page.click('#confirm-ok');
  await page.waitForSelector('#view-history:not([hidden])');
  await page.waitForSelector('#toast-action');
  ok(await page.locator('.history-item').count() === 2, '刪除後剩 2 筆');
  await page.screenshot({ path: path.join(SHOTS, 'u04-undo.png') });
  await page.click('#toast-action');
  ok(await page.locator('.history-item').count() === 3, '按「復原」後回到 3 筆');
  const after = await page.evaluate(() => window.STORE.list('all'));
  ok(JSON.stringify(after.map((r) => r.id)) === JSON.stringify(before), '復原後順序不變');
  ok(after.some((r) => r.note && r.note.text === '後來真的先傳了訊息'), '復原後筆記也還在');
  await page.goto(BASE + '#record-' + recs[1].id);
  await page.waitForSelector('#rec-delete');
  await page.click('#rec-delete'); await page.click('#confirm-ok');
  await page.waitForSelector('#toast-action');
  await page.waitForFunction(() => document.getElementById('toast').hidden, null, { timeout: 9000 });
  ok(await page.evaluate(() => window.STORE.list('all').length) === 2, '不按復原，提示消失後刪除生效');

  console.log('【清除所有資料】');
  await page.goto(BASE);
  await page.click('#btn-daily');
  await page.goto(BASE + '#settings');
  await page.waitForSelector('#view-settings:not([hidden])');
  await page.click('#btn-clear-all');
  await page.waitForSelector('#confirm-modal:not([hidden])');
  ok(/2 筆占卜紀錄/.test(await page.textContent('#confirm-text')), '清除前說明會刪除的內容');
  await page.click('#confirm-cancel');
  ok(await page.evaluate(() => window.STORE.list('all').length) === 2, '取消後資料保留');
  await page.click('#btn-clear-all'); await page.click('#confirm-ok');
  const cleared = await page.evaluate(() => ({ n: window.STORE.list('all').length, keys: Object.keys(localStorage).filter((k) => k.indexOf('yuexia.') === 0) }));
  ok(cleared.n === 0 && cleared.keys.length === 0, '清除紀錄、今日指引與設定');
  ok(await page.getAttribute('[data-set-palette="wine"]', 'aria-checked') === 'true', '設定回到預設');
  await page.goto(BASE);
  ok(await page.isVisible('#btn-daily'), '今日指引回到未抽狀態');

  console.log('【主畫面模式（模擬）】');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'] });
  await ctx2.addInitScript(() => { Object.defineProperty(window.navigator, 'standalone', { get: () => true }); });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE);
  ok(!(await p2.isVisible('#install-guide')), '從主畫面開啟時，首頁隱藏安裝教學');
  await p2.goto(BASE + '#settings');
  await p2.click('#view-settings .install-guide summary');
  ok(await p2.isVisible('#standalone-note'), '設定頁說明目前是主畫面版本');
  await ctx2.close();

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
