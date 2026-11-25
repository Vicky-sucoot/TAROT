// 備份與還原、回顧筆記驗收
// 使用：先啟動靜態伺服器（python3 -m http.server 8123），再執行 node tests/backup.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

async function playOnce(page, spread, option, question) {
  await page.goto(BASE + '#setup-' + spread);
  await page.waitForSelector('#view-setup:not([hidden])');
  await page.click(`[data-opt="${option}"]`);
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
async function toastText(page) {
  await page.waitForSelector('#toast:not([hidden])');
  return page.textContent('#toast');
}
async function importFile(page, file) {
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  await page.evaluate(() => { document.getElementById('import-file').value = ''; document.getElementById('toast').hidden = true; });
  await page.setInputFiles('#import-file', file);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('unexpected dialog: ' + d.message()); d.dismiss(); });
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log('【回顧筆記】');
  await playOnce(page, 'guide', 'work', '要不要接新專案');
  await playOnce(page, 'relation', 'ambig', '他是不是也喜歡我');
  await playOnce(page, 'flow', 'money', '');
  const recs = await page.evaluate(() => window.STORE.list('all'));
  ok(recs.length === 3, '建立 3 筆紀錄');
  await page.goto(BASE + '#record-' + recs[1].id);
  await page.waitForSelector('#rec-note');
  ok(await page.textContent('#rec-note-meta') === '還沒有筆記', '新紀錄顯示「還沒有筆記」');
  await page.fill('#rec-note', '後來主動約他吃飯，聊得很開心。<b>不是粗體</b>');
  await page.click('#rec-note-save');
  ok(/已儲存回顧筆記/.test(await toastText(page)), '儲存筆記');
  await page.screenshot({ path: path.join(SHOTS, 'b01-note.png'), fullPage: true });
  await page.reload();
  await page.waitForSelector('#rec-note');
  ok((await page.inputValue('#rec-note')).startsWith('後來主動約他吃飯'), '重新開啟後筆記還在');
  ok(/上次更新/.test(await page.textContent('#rec-note-meta')), '顯示筆記更新時間');
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  ok(await page.locator('.hi-noted').count() === 1, '歷史列表標示「已回顧」');
  await page.screenshot({ path: path.join(SHOTS, 'b02-history.png'), fullPage: true });

  console.log('【匯出】');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  const backupPath = path.join(SHOTS, 'backup.json');
  await dl.saveAs(backupPath);
  ok(/^yuexia-backup-\d{8}-\d{4}\.json$/.test(dl.suggestedFilename()), `備份檔名（${dl.suggestedFilename()}）`);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  ok(backup.format === 'yuexia-backup' && backup.records.length === 3, '備份檔含 3 筆紀錄');
  ok(backup.records.some((r) => r.note && /主動約他/.test(r.note.text)), '備份檔含回顧筆記');
  ok(backup.records.some((r) => r.question === '要不要接新專案'), '備份檔含提問');
  ok(backup.settings && backup.settings.palette === 'wine', '備份檔含結果卡設定');

  console.log('【還原到全新的瀏覽器（模擬換手機／主畫面版本）】');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'] });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto(BASE);
  await p2.evaluate(() => { localStorage.clear(); });
  // 匯出前改配色，確認匯入會套用備份裡的設定
  await page.evaluate(() => { window.STORE.setPalette('navy'); window.STORE.setCardFormat('square'); });
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  const backup2 = path.join(SHOTS, 'backup2.json');
  await dl2.saveAs(backup2);
  await importFile(p2, backup2);
  await p2.waitForSelector('#confirm-modal:not([hidden])');
  ok(/3 筆紀錄/.test(await p2.textContent('#confirm-text')), '匯入前確認筆數');
  await p2.click('#confirm-ok');
  ok(/已匯入 3 筆/.test(await toastText(p2)), '匯入 3 筆');
  ok(await p2.locator('.history-item').count() === 3, '歷史列表顯示匯入的 3 筆');
  const restored = await p2.evaluate(() => ({ list: window.STORE.list('all'), pal: window.STORE.getPalette(), fmt: window.STORE.getCardFormat() }));
  ok(JSON.stringify(restored.list.map((r) => r.id)) === JSON.stringify(recs.map((r) => r.id)), '紀錄與排序一致');
  ok(JSON.stringify(restored.list.map((r) => r.reading.summary)) === JSON.stringify(recs.map((r) => r.reading.summary)), '保留當時的解讀文字');
  ok(restored.pal === 'navy' && restored.fmt === 'square', '套用備份裡的結果卡設定');
  await p2.click('[data-filter="love"]');
  ok(await p2.locator('.history-item').count() === 1, '匯入後主題篩選正常');
  await p2.locator('.history-item button').first().click();
  await p2.waitForSelector('#rec-note');
  ok((await p2.inputValue('#rec-note')).startsWith('後來主動約他吃飯'), '匯入後筆記還在');
  ok(await p2.locator('#record-body b').count() === 0, '筆記中的 HTML 不會被執行');
  await p2.screenshot({ path: path.join(SHOTS, 'b03-restored.png'), fullPage: true });

  console.log('【重複匯入】');
  await importFile(p2, backup2);
  await p2.click('#confirm-ok');
  ok(/已匯入 0 筆，3 筆已存在而略過/.test(await toastText(p2)), '再次匯入不會重複');
  ok(await p2.evaluate(() => window.STORE.list('all').length) === 3, '仍然是 3 筆');

  console.log('【錯誤與惡意檔案】');
  const bad = (name, content) => { const f = path.join(SHOTS, name); fs.writeFileSync(f, content); return f; };
  await importFile(p2, bad('bad1.json', 'not json'));
  ok(/無法讀取這個檔案/.test(await toastText(p2)), '不是 JSON 的檔案');
  await p2.evaluate(() => { document.getElementById('toast').hidden = true; });
  await importFile(p2, bad('bad2.json', JSON.stringify({ hello: 1 })));
  ok(/不是月下占卜的備份檔/.test(await toastText(p2)), '其他 JSON 檔案');
  await p2.evaluate(() => { document.getElementById('toast').hidden = true; });
  const evil = {
    format: 'yuexia-backup', version: 1, settings: { palette: 'evil' },
    records: [
      { id: 'x"><img src=x onerror=alert(1)>', ts: Date.now() - 1000, spread: 'guide', option: 'love', question: '<img src=x onerror=alert(2)>',
        cards: [{ id: 'm00', rev: false }, { id: 'm01', rev: true }, { id: 'm02', rev: false }],
        reading: { summary: '<script>alert(3)</script>', question: 'q', publicLine: 'p', focus: 'f', cards: 'broken' },
        note: { text: '<img src=x onerror=alert(4)>', ts: 1 } },
      { id: 'dup', ts: Date.now(), spread: 'guide', cards: [{ id: 'm00' }, { id: 'm00' }, { id: 'm01' }] },
      { id: 'badcard', ts: Date.now(), spread: 'guide', cards: [{ id: 'zz' }, { id: 'm00' }, { id: 'm01' }] },
      { id: 'badspread', ts: Date.now(), spread: 'nope', cards: [] }
    ]
  };
  await importFile(p2, bad('evil.json', JSON.stringify(evil)));
  await p2.waitForSelector('#confirm-modal:not([hidden])');
  await p2.click('#confirm-ok');
  ok(/已匯入 1 筆.*3 筆格式不符/.test(await toastText(p2)), '略過重複牌、不存在的牌與未知牌陣');
  const imported = await p2.evaluate(() => window.STORE.list('all')[0]);
  ok(/^[A-Za-z0-9]+$/.test(imported.id), '不合法的紀錄 id 被替換');
  ok(imported.reading.cards.length === 3 && imported.reading.summary.indexOf('<script>') < 0, '損壞的解讀依牌面重新產生');
  ok(await p2.evaluate(() => window.STORE.getPalette()) === 'navy', '無效的配色設定被忽略');
  await p2.goto(BASE + '#record-' + imported.id);
  await p2.waitForSelector('#rec-note');
  ok(await p2.locator('#record-body img[src="x"]').count() === 0, '提問與筆記中的 HTML 不會被執行');
  await p2.goto(BASE + '#history');
  await p2.waitForSelector('#view-history:not([hidden])');
  ok(await p2.locator('.history-item img[src="x"]').count() === 0, '歷史列表不會執行匯入的 HTML');

  console.log('【離線匯出與匯入】');
  await ctx2.setOffline(true);
  await p2.goto(BASE + '#history');
  await p2.waitForSelector('#view-history:not([hidden])').catch(() => {});
  const offlineOk = await p2.evaluate(() => !!document.getElementById('btn-export'));
  ok(offlineOk, '離線開啟歷史頁');
  await ctx2.setOffline(false);
  await ctx.setOffline(true);
  await page.goto(BASE + '#history');
  await page.waitForSelector('#view-history:not([hidden])');
  const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  ok(/\.json$/.test(dl3.suggestedFilename()), '離線匯出');
  await page.evaluate(() => localStorage.removeItem('yuexia.history.v1'));
  await importFile(page, backupPath);
  await page.click('#confirm-ok');
  ok(/已匯入 3 筆/.test(await toastText(page)), '離線匯入');
  await ctx.setOffline(false);

  ok(errors.length === 0, '沒有 JavaScript 錯誤或意外對話框' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\n結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
