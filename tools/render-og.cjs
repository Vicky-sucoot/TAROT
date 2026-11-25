// 產生分享預覽圖 icons/og-image.jpg（1200×630），供 LINE、Facebook 等顯示連結預覽
// 使用：node tools/render-og.cjs（需要 Playwright）
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.join(__dirname, '..');
  const b64 = (f) => fs.readFileSync(path.join(root, f)).toString('base64');
  const back = 'data:image/svg+xml;base64,' + b64('cards/back.svg');
  const emblem = 'data:image/svg+xml;base64,' + b64('icons/emblem.svg');
  const font = (w) => `@font-face{font-family:"Yuexia Serif";src:url(data:font/woff2;base64,${b64('fonts/yuexia-serif-' + w + '.woff2')}) format("woff2");font-weight:${w}}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font(400)}${font(700)}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:"Yuexia Serif",serif;
background:radial-gradient(ellipse at 72% 30%,rgba(226,201,143,.22),transparent 55%),linear-gradient(160deg,#5a1424,#26070f 75%);color:#f3e7cc}
.frame{position:absolute;inset:22px;border:3px solid #c9a45c;border-radius:20px}
.frame2{position:absolute;inset:34px;border:1px solid rgba(226,201,143,.55);border-radius:14px}
.stars i{position:absolute;width:4px;height:4px;border-radius:50%;background:#f6e6b8;box-shadow:0 0 8px 2px rgba(246,230,184,.7)}
.cards{position:absolute;left:96px;top:118px;width:420px;height:420px}
.cards img{position:absolute;width:196px;border-radius:12px;box-shadow:0 14px 30px rgba(0,0,0,.55);transform-origin:50% 110%}
.text{position:absolute;left:560px;top:110px;width:560px;text-align:center}
.text img{width:132px;height:132px;filter:drop-shadow(0 4px 18px rgba(226,201,143,.35))}
h1{margin:10px 0 0;font-size:104px;font-weight:700;letter-spacing:.18em;color:#ecd08f;text-shadow:0 3px 0 rgba(0,0,0,.35)}
p{margin:6px 0 0;font-size:36px;letter-spacing:.12em;color:#e2cfa4}
.tags{margin-top:30px;font-size:26px;letter-spacing:.1em;color:#d6bf91}
.tags span{display:inline-block;margin:0 10px;padding:6px 18px;border:1px solid rgba(201,164,92,.7);border-radius:999px}
</style></head><body>
<div class="frame"></div><div class="frame2"></div>
<div class="stars"><i style="left:540px;top:70px"></i><i style="left:1120px;top:90px"></i><i style="left:90px;top:80px"></i><i style="left:1080px;top:540px"></i><i style="left:600px;top:560px;width:3px;height:3px"></i><i style="left:70px;top:560px;width:3px;height:3px"></i></div>
<div class="cards"><img src="${back}" style="left:30px;top:40px;transform:rotate(-14deg)"><img src="${back}" style="left:180px;top:40px;transform:rotate(14deg)"><img src="${back}" style="left:105px;top:10px;z-index:2"></div>
<div class="text"><img src="${emblem}" alt=""><h1>月下占卜</h1><p>在月光下，聽見自己的答案</p>
<div class="tags"><span>免登入</span><span>可離線</span><span>繁體中文塔羅</span></div></div>
</body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(root, 'icons', 'og-image.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('icons/og-image.jpg rendered');
})();
