// 以 Chromium 將 icons/icon.svg 轉為 PNG：node tools/render-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const root = path.join(__dirname, '..');
  const svg = fs.readFileSync(path.join(root, 'icons/icon.svg'), 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage();
  const jobs = [['apple-touch-icon.png', 180, 1], ['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['icon-maskable-512.png', 512, 0.8]];
  for (const [name, size, scale] of jobs) {
    await p.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * scale);
    await p.setContent(`<body style="margin:0;background:#2e0a14;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('width="512" height="512"', `width="${inner}" height="${inner}"`)}</body>`);
    await p.screenshot({ path: path.join(root, 'icons', name), omitBackground: false });
  }
  await b.close();
  console.log('icons rendered');
})();
