// 驗證「有新版本」提示：更新後保留紀錄與配色
// 使用：伺服器執行中時 node tests/update.cjs（會暫時修改 precache-manifest.js 的版本號，結束後還原）
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8123/';
const mf = path.join(__dirname, '..', 'precache-manifest.js');
const sw = path.join(__dirname, '..', 'sw.js');
const orig = fs.readFileSync(mf, 'utf8');
const origSw = fs.readFileSync(sw, 'utf8');
(async () => {
  let failed = 0;
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) failed++; };
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  try {
    await p.goto(BASE);
    await p.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用');
    await p.evaluate(() => {
      localStorage.setItem('yuexia.palette', 'parchment');
      window.STORE.add({ id: 'keepme', ts: Date.now(), spread: 'guide', option: 'work', category: 'work', question: '', cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: true }, { id: 'm02', rev: false }], reading: window.READING.interpret({ spread: 'guide', option: 'work', cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: true }, { id: 'm02', rev: false }] }) });
    });
    // 發布「新版本」
    fs.writeFileSync(mf, orig.replace(/"version": "([^"]+)"/, '"version": "$1-next"'));
    fs.writeFileSync(sw, origSw + '\n// next\n');
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await p.waitForSelector('#update-banner:not([hidden])', { timeout: 30000 });
    ok(true, '偵測到新版本時顯示「重新載入」提示');
    await Promise.all([p.waitForNavigation(), p.click('#btn-update')]);
    await p.waitForFunction(() => window.PRECACHE.version.endsWith('-next'), null, { timeout: 15000 });
    ok(true, '重新載入後使用新版本');
    await p.waitForFunction(() => document.getElementById('offline-text').textContent === '已可離線使用', null, { timeout: 60000 });
    ok(true, '新版本完成離線準備');
    const kept = await p.evaluate(() => ({ rec: !!window.STORE.get('keepme'), pal: window.STORE.getPalette() }));
    ok(kept.rec && kept.pal === 'parchment', '更新後保留占卜紀錄與配色偏好');
  } finally {
    fs.writeFileSync(mf, orig);
    fs.writeFileSync(sw, origSw);
    await b.close();
  }
  process.exit(failed ? 1 : 0);
})().catch((e) => { fs.writeFileSync(mf, orig); fs.writeFileSync(sw, origSw); console.error(e); process.exit(1); });
