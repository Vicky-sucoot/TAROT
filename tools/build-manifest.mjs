// 產生 precache-manifest.js：列出離線所需的全部檔案，版本號由內容雜湊決定
// 使用：node tools/build-manifest.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const list = (d, ext) => readdirSync(join(root, d)).filter((f) => f.endsWith(ext)).sort().map((f) => d + '/' + f);
const files = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  ...list('js', '.js'),
  ...list('cards', '.svg'),
  ...list('cards/rv', '.svg'),
  'icons/icon.svg', 'icons/emblem.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'fonts/yuexia-serif-400.woff2', 'fonts/yuexia-serif-700.woff2', 'fonts/OFL.txt',
  'docs/credits.html', 'precache-manifest.js'
];
const h = createHash('sha256');
for (const f of files) if (f !== './' && f !== 'precache-manifest.js') h.update(f).update(readFileSync(join(root, f)));
h.update(readFileSync(join(root, 'sw.js')));
const version = h.digest('hex').slice(0, 12);
writeFileSync(join(root, 'precache-manifest.js'),
  `/* 自動產生，請勿手動修改：node tools/build-manifest.mjs */\nself.PRECACHE = ${JSON.stringify({ version, files }, null, 2)};\n`);
console.log('precache', files.length, 'files, version', version);
