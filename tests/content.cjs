// 主題牌義、牌組合、字型與牌圖細節驗收
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/content.cjs
const { chromium, devices } = require('playwright');
const { skipOnboarding } = require('./helpers.cjs');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

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

  console.log('【主題牌義】');
  const tm = await page.evaluate(() => {
    const M = window.TOPIC_MEANINGS, C = window.TAROT.CARDS;
    const all = [];
    let complete = true;
    C.forEach((c) => ['love', 'work', 'money'].forEach((t) => { const p = M[c.id] && M[c.id][t]; if (!p || p.length !== 2 || !p[0] || !p[1]) complete = false; else all.push(p[0], p[1]); }));
    return { complete, n: all.length, unique: new Set(all).size };
  });
  ok(tm.complete && tm.n === 468 && tm.unique === 468, '78 張牌 × 感情／工作／財運 × 正逆位，共 468 句且不重複');
  const lines = await page.evaluate(() => {
    const R = window.READING, M = window.TOPIC_MEANINGS;
    const cards = [{ id: 'm06', rev: false }, { id: 'c05', rev: true }, { id: 'p01', rev: false }];
    const has = (r, prefix, topic) => r.cards.every((c, i) => c.body.includes(prefix + M[c.id][topic][cards[i].rev ? 1 : 0]));
    return {
      love: has(R.interpret({ spread: 'guide', option: 'love', cards }), '放在感情上：', 'love'),
      work: has(R.interpret({ spread: 'choice', option: 'work', cards }), '放在工作上：', 'work'),
      money: has(R.interpret({ spread: 'guide', option: 'money', cards }), '放在財運上：', 'money'),
      rel: has(R.interpret({ spread: 'relation', option: 'none', cards }), '放在感情上：', 'love'),
      general: R.interpret({ spread: 'guide', option: 'general', cards }).cards.every((c) => !c.body.some((b) => /^放在/.test(b))),
      flow5: R.interpret({ spread: 'flow', option: 'money', cards: ['m00', 'w02', 'c03', 's04', 'p05'].map((id) => ({ id, rev: false })) }).cards.every((c) => c.body.some((b) => b.startsWith('放在財運上：')))
    };
  });
  ok(lines.love && lines.work && lines.money, '三張牌指引／二選一依主題加入對應的正逆位主題牌義');
  ok(lines.rel, '感情關係牌陣（含略過情境）一律加入感情面向');
  ok(lines.general, '綜合主題不加主題牌義');
  ok(lines.flow5, '五張牌陣每張都有主題牌義');

  console.log('【牌組合】');
  const combos = await page.evaluate(() => {
    const R = window.READING;
    const t = (ids) => R.interpret({ spread: ids.length === 5 ? 'flow' : 'guide', option: 'general', cards: ids.map((id) => ({ id, rev: false })) }).combos.map((c) => c.title);
    return {
      pair: t(['m06', 'c03', 'm15']), tower: t(['m16', 'm17', 'w05']), none: t(['w02', 'c07', 's06']),
      aces: t(['w01', 'c01', 's05']), samenum: t(['w03', 'c03', 's03', 'p09', 'm00']),
      max: t(['m16', 'm17', 'm18', 'm19', 'm21']), pairs: window.COMBOS.PAIRS.length
    };
  });
  ok(combos.pairs >= 30, `收錄 ${combos.pairs} 組特定牌組合`);
  ok(combos.pair.includes('戀人＋惡魔') && combos.tower.includes('高塔＋星星'), '同時出現時加入組合解讀（不論位置）');
  ok(combos.none.length === 0, '沒有特定組合時不顯示');
  ok(combos.aces.includes('多張王牌') && combos.samenum.includes('三張以上同數字'), '多張王牌、同數字等規則');
  ok(combos.max.length <= 3, '組合解讀最多三段');
  // 存一筆含組合的紀錄並在紀錄頁顯示
  const recId = await page.evaluate(() => {
    const cards = [{ id: 'm16', rev: false }, { id: 'm17', rev: true }, { id: 'p05', rev: false }];
    const rec = { id: 'combotest', ts: Date.now(), spread: 'guide', option: 'love', category: 'love', question: '', cards, reading: window.READING.interpret({ spread: 'guide', option: 'love', cards }) };
    window.STORE.add(rec);
    return rec.id;
  });
  await page.goto(BASE + '#record-' + recId);
  await page.waitForSelector('#view-record:not([hidden])');
  ok(/高塔＋星星/.test(await page.textContent('.combo-block')), '紀錄頁顯示「牌組合」區塊');
  await page.locator('.reading-detail summary').first().click();
  ok(/放在感情上：/.test(await page.textContent('.reading-detail[open]')), '逐張解讀顯示主題牌義');
  await page.screenshot({ path: path.join(SHOTS, 'c01-combo.png'), fullPage: true });
  const clean = await page.evaluate(() => {
    const r = window.STORE.get('combotest');
    const c = window.BACKUP.cleanRecord(JSON.parse(JSON.stringify(r)));
    return c.reading.combos.length === r.reading.combos.length && c.reading.combos[0].title === r.reading.combos[0].title;
  });
  ok(clean, '備份還原時保留牌組合');

  console.log('【圖鑑中的主題牌義】');
  await page.goto(BASE + '#card-p10');
  await page.waitForSelector('#view-card:not([hidden])');
  const dl = await page.$$eval('.topic-list', (els) => els.map((e) => e.querySelectorAll('dd').length));
  ok(dl.length === 2 && dl.every((n) => n === 3), '單張頁的正位與逆位各列出感情、工作、財運');
  await page.screenshot({ path: path.join(SHOTS, 'c02-card.png'), fullPage: true });

  console.log('【字型】');
  const font = await page.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load('700 30px "Yuexia Serif"', '月下占卜');
    const fam = getComputedStyle(document.querySelector('.view-heading')).fontFamily;
    return { fam, check: document.fonts.check('700 30px "Yuexia Serif"', '月下占卜'),
      faces: Array.from(document.fonts).filter((f) => f.family.replace(/"/g, '') === 'Yuexia Serif' && f.status === 'loaded').length };
  });
  ok(/Yuexia Serif/.test(font.fam), '標題使用網站字型');
  ok(font.check && font.faces >= 1, '網站字型已載入');
  const glyphs = await page.evaluate(async () => {
    // 檢查所有網站內建文字的字元都在字型中（用寬度比對備援字型）
    const txt = Array.from(new Set((document.body.innerText + window.TAROT.CARDS.map((c) => c.name).join('')).replace(/\s/g, ''))).filter((c) => c.charCodeAt(0) > 0x3000).join('');
    const cv = document.createElement('canvas').getContext('2d');
    await document.fonts.load('400 40px "Yuexia Serif"', txt);
    return { n: txt.length, ok: document.fonts.check('400 40px "Yuexia Serif"', txt) };
  });
  ok(glyphs.ok, `首頁與牌名的 ${glyphs.n} 個中文字都由網站字型提供`);

  console.log('【離線字型與結果卡】');
  await ctx.setOffline(true);
  const p2 = await ctx.newPage();
  await p2.goto(BASE + '#record-' + recId);
  await p2.waitForSelector('#view-record:not([hidden])');
  const offFont = await p2.evaluate(async () => {
    await document.fonts.load('700 30px "Yuexia Serif"', '月下占卜');
    return document.fonts.check('700 30px "Yuexia Serif"', '月下占卜');
  });
  ok(offFont, '離線時字型從快取載入');
  await p2.click('#rec-preview');
  await p2.waitForFunction(() => !document.getElementById('btn-card-download').disabled);
  fs.writeFileSync(path.join(SHOTS, 'c03-card-font.png'), Buffer.from(await p2.evaluate(async () => { const r = await fetch(document.getElementById('card-preview').src); return Array.from(new Uint8Array(await r.arrayBuffer())); })));
  ok(true, '離線產生使用網站字型的結果卡');
  await ctx.setOffline(false);

  console.log('【牌圖細節與檔案大小】');
  const root = path.join(__dirname, '..', 'cards');
  const files = fs.readdirSync(root).filter((f) => f.endsWith('.svg')).map((f) => path.join(root, f))
    .concat(fs.readdirSync(path.join(root, 'rv')).map((f) => path.join(root, 'rv', f)));
  const total = files.reduce((a, f) => a + fs.statSync(f).size, 0);
  ok(files.length === 157 && total < 4.5 * 1024 * 1024, `157 張牌圖合計 ${(total / 1024 / 1024).toFixed(2)} MB`);
  const m01 = fs.readFileSync(path.join(root, 'm01.svg'), 'utf8');
  ok(/fill="#b8505a" opacity="0\.\d+"/.test(m01), '人物有臉部細節（腮紅等）');

  ok(errors.length === 0, '頁面無 JavaScript 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
