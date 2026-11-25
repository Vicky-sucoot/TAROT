// 結果卡指引句、今日指引紀錄、氛圍動畫驗收
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/extras.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }
async function toastText(page) { await page.waitForSelector('#toast:not([hidden])'); return page.textContent('#toast'); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 90000 });

  console.log('【結果卡指引句】');
  const pl = await page.evaluate(() => {
    const L = window.PUBLIC_LINES, C = window.TAROT.CARDS;
    const all = C.flatMap((c) => L[c.id] || []);
    const R = window.READING;
    const r1 = R.interpret({ spread: 'guide', option: 'general', cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: true }, { id: 'p05', rev: false }] });
    const r2 = R.interpret({ spread: 'flow', option: 'love', cards: ['m00', 'w02', 'c03', 's04', 'c05'].map((id, i) => ({ id, rev: i === 4 })) });
    const r3 = R.interpret({ spread: 'relation', option: 'ambig', cards: [{ id: 'm06', rev: false }, { id: 'c02', rev: false }, { id: 's01', rev: true }] });
    return {
      n: all.length, unique: new Set(all).size, maxLen: Math.max(...all.map((s) => s.length)),
      noKeywordTemplate: all.every((s) => !/指引是「|今夜的提醒/.test(s)),
      r1: r1.publicLine === L.p05[0], r2: r2.publicLine === L.c05[1], r3: r3.publicLine === L.s01[1]
    };
  });
  ok(pl.n === 156 && pl.unique === 156, '78 張牌 × 正逆位，共 156 句專屬指引且不重複');
  ok(pl.maxLen <= 24, `每句最多 ${pl.maxLen} 字，結果卡兩行內放得下`);
  ok(pl.r1 && pl.r2 && pl.r3, '結果卡指引取自建議牌（時間之流取行動建議牌）的正逆位專屬句');
  ok(pl.noKeywordTemplate, '不再使用「今夜的指引是「關鍵詞」」的套句');

  console.log('【今日指引紀錄】');
  await page.click('#btn-daily');
  await page.waitForSelector('#daily-mood');
  await page.fill('#daily-mood', '有點累但很平靜');
  await page.click('#daily-mood-save');
  ok(/已記下今天的心情/.test(await toastText(page)), '首頁記下今天的心情');
  const today = await page.evaluate(() => window.__YUEXIA__.dateKey());
  // 模擬過去幾天的紀錄（含上個月）
  await page.evaluate((today) => {
    const log = JSON.parse(localStorage.getItem('yuexia.dailyLog'));
    const d = new Date(today + 'T12:00:00');
    const key = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    const ids = ['c02', 'c03', 'c07', 'm17', 'c02'];
    for (let i = 1; i <= 5; i++) { const x = new Date(d); x.setDate(d.getDate() - i); if (x.getMonth() === d.getMonth()) log[key(x)] = { id: ids[i - 1], rev: i === 2 }; }
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 15);
    log[key(prev)] = { id: 'w01', rev: false, mood: '上個月的心情', moodTs: 1 };
    localStorage.setItem('yuexia.dailyLog', JSON.stringify(log));
  }, today);
  await page.reload();
  await page.click('#daily-journal');
  await page.waitForSelector('#view-journal:not([hidden])');
  const cal = await page.evaluate((today) => {
    const t = document.querySelector('[data-jday="' + today + '"]');
    return { title: document.getElementById('j-title').textContent, hasToday: !!t, todayImg: t && !!t.querySelector('img'), dot: t && !!t.querySelector('.jc-dot'),
      days: document.querySelectorAll('.jc-has').length, summary: (document.getElementById('j-summary') || {}).textContent || '' };
  }, today);
  const expectDays = await page.evaluate(() => { const m = window.__YUEXIA__.dateKey().slice(0, 7); return Object.keys(JSON.parse(localStorage.getItem('yuexia.dailyLog'))).filter((k) => k.startsWith(m)).length; });
  ok(cal.hasToday && cal.todayImg && cal.dot, '月曆顯示今天的牌與心情記號');
  ok(cal.days === expectDays, `本月有 ${cal.days} 天紀錄`);
  ok(new RegExp('抽了 ' + expectDays + ' 天').test(cal.summary), '這個月的回顧統計天數');
  if (expectDays >= 3) ok(/重複出現的牌|出現得最多/.test(await page.textContent('#journal-body')), '回顧提到重複的牌或最多的牌組');
  await page.screenshot({ path: path.join(SHOTS, 'x01-journal.png'), fullPage: true });
  await page.click(`[data-jday="${today}"]`);
  ok((await page.inputValue('#j-mood')) === '有點累但很平靜', '點日期顯示那天的牌與心情');
  await page.fill('#j-mood', '晚上變得開心了');
  await page.click('#j-mood-save');
  ok(await page.evaluate((t) => JSON.parse(localStorage.getItem('yuexia.dailyLog'))[t].mood === '晚上變得開心了', today), '在月曆修改心情');
  await page.click('#j-prev');
  ok(await page.locator('.jc-has').count() === 1, '切換到上個月');
  await page.click('.jc-has');
  ok((await page.inputValue('#j-mood')) === '上個月的心情', '上個月的心情紀錄');
  await page.click('#j-next'); await page.click('#j-next');
  ok(/還沒有今日指引紀錄/.test(await page.textContent('#journal-body')), '沒有紀錄的月份顯示提示');
  // 從歷史頁進入
  await page.goto(BASE + '#history');
  await page.click('#btn-journal');
  await page.waitForSelector('#view-journal:not([hidden])');
  ok(true, '歷史紀錄頁的「每日紀錄」按鈕');

  console.log('【今日指引紀錄的備份與還原】');
  await page.goto(BASE + '#settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  const file = path.join(SHOTS, 'x-backup.json');
  await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(Object.keys(data.dailyLog).length === expectDays + 1, '備份檔含今日指引紀錄（只有今日指引、沒有占卜紀錄也能匯出）');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'] });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto(BASE + '#settings');
  await p2.waitForSelector('#view-settings:not([hidden])');
  await p2.setInputFiles('#import-file', file);
  await p2.waitForSelector('#confirm-modal:not([hidden])');
  ok(new RegExp((expectDays + 1) + ' 天的今日指引').test(await p2.textContent('#confirm-text')), '匯入前說明今日指引天數');
  await p2.click('#confirm-ok');
  ok(new RegExp((expectDays + 1) + ' 天今日指引').test(await toastText(p2)), '匯入今日指引紀錄');
  const restored = await p2.evaluate((t) => JSON.parse(localStorage.getItem('yuexia.dailyLog'))[t], today);
  ok(restored && restored.mood === '晚上變得開心了', '匯入後心情也一起還原');
  await ctx2.close();

  console.log('【清除資料】');
  await page.goto(BASE + '#settings');
  await page.click('#btn-clear-all'); await page.click('#confirm-ok');
  ok(await page.evaluate(() => localStorage.getItem('yuexia.dailyLog') === null), '清除所有資料時一併清除今日指引紀錄');

  console.log('【氛圍動畫】');
  await page.goto(BASE);
  const tw = await page.$eval('.twinkle i', (e) => getComputedStyle(e).animationName);
  ok(tw === 'twinkle', '首頁星光閃爍');
  await page.goto(BASE + '#setup-guide');
  await page.click('#btn-shuffle');
  const fan = await page.$eval('.shuffle-stage img', (e) => getComputedStyle(e).animationName);
  ok(fan === 'fan' && await page.locator('.shuffle-stage img').count() === 7, '洗牌時牌疊展開成扇形');
  await page.screenshot({ path: path.join(SHOTS, 'x02-fan.png') });
  await page.waitForSelector('#pick-area:not([hidden])');
  // 安排一局含大阿爾克那
  let flashed = false;
  for (let k = 0; k < 12 && !flashed; k++) {
    if (k) { await page.goto(BASE + '#setup-guide'); await page.click('#btn-shuffle'); await page.waitForSelector('#pick-area:not([hidden])'); }
    await page.click('#tab-quick'); await page.click('#btn-quick');
    await page.waitForFunction(() => window.__YUEXIA__.draw.picks.length === 3 && !window.__YUEXIA__.draw.busy);
    const idx = await page.evaluate(() => window.__YUEXIA__.draw.picks.findIndex((p) => p.id[0] === 'm'));
    if (idx < 0) continue;
    for (let i = 0; i <= idx; i++) await page.click(`[data-slot="${i}"]`);
    flashed = await page.evaluate((i) => document.querySelector(`[data-slot="${i}"]`).classList.contains('major-flash') &&
      getComputedStyle(document.querySelector(`[data-slot="${i}"]`), '::after').animationName === 'majorFlash', idx);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SHOTS, 'x03-flash.png') });
  }
  ok(flashed, '翻開大阿爾克那時出現金光');
  const ctx3 = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE);
  const rm = await p3.$eval('.twinkle i', (e) => parseFloat(getComputedStyle(e).animationDuration));
  ok(rm <= 0.01, '減少動態效果時關閉星光動畫');
  await ctx3.close();

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
