// 月下占卜：原創復古雕版風牌圖的 SVG 繪圖元件庫
// 所有圖形皆以程式繪製，無外部素材。

export const C = {
  INK: '#3a1c17', WINE: '#6d1a2b', WINED: '#4b0f1d', GOLD: '#b8893a', GOLDL: '#dcbd73',
  PARCH: '#f2e6c9', PARCH2: '#e2cc9f', SKIN: '#f4e3c4', WHITE: '#faf3e3', DARK: '#2e1a14',
  BLUE: '#5d7182', BLUEL: '#9fb0b6', GREEN: '#6c7a46', GREENL: '#a3ad74', STONE: '#a59780',
  STONED: '#76675e', BROWN: '#7a4f2e', ROSE: '#b8505a', SAND: '#d9c08c', NIGHT: '#2b2238'
};
const { INK, WINE, WINED, GOLD, GOLDL, PARCH, PARCH2, SKIN, WHITE, DARK, BLUE, BLUEL, GREEN, GREENL, STONE, STONED, BROWN, ROSE, SAND, NIGHT } = C;

const f = (n) => Math.round(n * 100) / 100;
export const g = (t, inner) => `<g transform="${t}">${inner}</g>`;
export const tr = (x, y, s = 1, r = 0, flip = false) =>
  `translate(${f(x)} ${f(y)})` + (r ? ` rotate(${r})` : '') + (s !== 1 || flip ? ` scale(${flip ? -s : s} ${s})` : '');

// 填色＋雕版排線陰影＋描邊
let QID = 0;
export function P(d, fill, o = {}) {
  const { hatch = 'h', sw = 1.3, stroke = INK, op = 1 } = o;
  if (hatch && fill !== 'none' && d.length > 90) {
    // 長路徑只寫一次：底色用外層 g 繼承，排線陰影以 <use> 重用同一路徑
    const id = 'q' + (QID++).toString(36);
    return `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${op !== 1 ? ` opacity="${op}"` : ''}><path id="${id}" d="${d}"/></g><use href="#${id}" fill="url(#${hatch})" stroke="none"/>`;
  }
  let s = `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${op !== 1 ? ` opacity="${op}"` : ''}/>`;
  if (hatch && fill !== 'none') s += `<path d="${d}" fill="url(#${hatch})" stroke="none"/>`;
  return s;
}
export function Ci(cx, cy, r, fill, o = {}) {
  const { hatch = 'h', sw = 1.3, stroke = INK } = o;
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  if (hatch && fill !== 'none') s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${hatch})"/>`;
  return s;
}
export function El(cx, cy, rx, ry, fill, o = {}) {
  const { hatch = 'h', sw = 1.3, stroke = INK, rot = 0 } = o;
  const t = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';
  let s = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${t}/>`;
  if (hatch && fill !== 'none') s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${hatch})"${t}/>`;
  return s;
}
export const L = (x1, y1, x2, y2, w = 1.3, c = INK, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
export const R = (x, y, w, h, fill, o = {}) => P(`M${x},${y}h${w}v${h}h${-w}Z`, fill, o);
export const line = (d, w = 1.3, c = INK, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

// 拱形畫框（華麗版）
export const ARCH = 'M30,452 V104 Q30,56 72,44 Q112,33 150,26 Q188,33 228,44 Q270,56 270,104 V452Z';

// ───── 圖紋定義 ─────
export function defs(id = 'x') {
  return `<defs>
<pattern id="h" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="4.5" stroke="${INK}" stroke-width="0.8" opacity="0.32"/></pattern>
<pattern id="hx" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0V4M0,0H4" stroke="${INK}" stroke-width="0.8" opacity="0.4"/></pattern>
<pattern id="hz" width="8" height="5" patternUnits="userSpaceOnUse"><line x1="0" y1="2.5" x2="8" y2="2.5" stroke="${INK}" stroke-width="0.6" opacity="0.22"/></pattern>
<pattern id="hl" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.6" opacity="0.18"/></pattern>
<pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.7" fill="${INK}" opacity="0.35"/><circle cx="5.5" cy="5" r="0.5" fill="${INK}" opacity="0.3"/></pattern>
<pattern id="wv" width="24" height="9" patternUnits="userSpaceOnUse"><path d="M0,5 Q6,1 12,5 T24,5" fill="none" stroke="${INK}" stroke-width="0.7" opacity="0.4"/></pattern>
<radialGradient id="pg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#f6ecd4"/><stop offset="0.7" stop-color="${PARCH}"/><stop offset="1" stop-color="${PARCH2}"/></radialGradient>
<radialGradient id="ng" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#4a3a52"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLDL}"/><stop offset="0.5" stop-color="${GOLD}"/><stop offset="1" stop-color="#8e6626"/></linearGradient>
<linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e9b5"/><stop offset="0.35" stop-color="#d4ad5a"/><stop offset="0.6" stop-color="#9a6f2a"/><stop offset="0.85" stop-color="#e6c77c"/><stop offset="1" stop-color="#a87b31"/></linearGradient>
<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6f2a"/><stop offset="0.3" stop-color="#f3dfa2"/><stop offset="0.55" stop-color="#c99d4c"/><stop offset="0.8" stop-color="#f0d791"/><stop offset="1" stop-color="#9a6f2a"/></linearGradient>
<radialGradient id="gem" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#f2a3ad"/><stop offset="0.35" stop-color="#a3243a"/><stop offset="1" stop-color="#3d0612"/></radialGradient>
<radialGradient id="gemb" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#cfe2ee"/><stop offset="0.35" stop-color="#3f6f8c"/><stop offset="1" stop-color="#132634"/></radialGradient>
<radialGradient id="halo" cx="50%" cy="8%" r="75%"><stop offset="0" stop-color="#fff6d6" stop-opacity="0.9"/><stop offset="0.5" stop-color="#f4dc9a" stop-opacity="0.25"/><stop offset="1" stop-color="#f4dc9a" stop-opacity="0"/></radialGradient>
<pattern id="damask" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11,3 l3,8 l-3,8 l-3,-8Z M0,11 l3,-2 l0,4Z M22,11 l-3,-2 l0,4Z" fill="${GOLD}" opacity="0.28"/><circle cx="0" cy="0" r="1.2" fill="${GOLDL}" opacity="0.35"/><circle cx="22" cy="22" r="1.2" fill="${GOLDL}" opacity="0.35"/><circle cx="22" cy="0" r="1.2" fill="${GOLDL}" opacity="0.35"/><circle cx="0" cy="22" r="1.2" fill="${GOLDL}" opacity="0.35"/></pattern>
<clipPath id="panel"><path d="${ARCH}"/></clipPath>
${FRAME_SYMBOLS()}
</defs>`;
}

// ───── 天空與地景 ─────
export function sky(o = {}) {
  const { night = false, top = 18, bottom = 482 } = o;
  const h = bottom - top;
  let rays = '';
  for (let i = 0; i < 25; i++) {
    const a = Math.PI * (0.06 + 0.88 * i / 24);
    rays += `M150,${top} L${f(150 - Math.cos(a) * 420)},${f(top + Math.sin(a) * 420)} `;
  }
  if (night) {
    let st = '';
    for (let i = 0; i < 26; i++) st += `<circle cx="${f(26 + (i * 71) % 250)}" cy="${f(top + 14 + (i * 53) % 230)}" r="${i % 3 ? 0.9 : 1.5}" fill="${GOLDL}" opacity="0.8"/>`;
    return `<rect x="18" y="${top}" width="264" height="${h}" fill="url(#ng)"/><rect x="18" y="${top}" width="264" height="${h}" fill="url(#hz)" opacity="0.8"/>` +
      `<path d="${rays}" stroke="${GOLDL}" stroke-width="0.5" opacity="0.18"/>` + st;
  }
  return `<rect x="18" y="${top}" width="264" height="${h}" fill="url(#pg)"/><rect x="18" y="${top}" width="264" height="${h}" fill="url(#halo)"/>` +
    `<path d="${rays}" stroke="${GOLD}" stroke-width="0.6" opacity="0.32"/><rect x="18" y="${top}" width="264" height="${h}" fill="url(#hz)"/>`;
}
export function ground(y, fill = PARCH2, o = {}) {
  const { curve = 10, hatch = 'dots' } = o;
  return P(`M10,${y + curve} Q80,${y - curve} 150,${y} T290,${y - curve / 2} V490 H10Z`, fill, { hatch, sw: 1.2 }) + tufts(y + 14, Math.round(y));
}
// 地面的草叢與小石，讓地景更有細節
export function tufts(y, seed = 1) {
  let d = '', stones = '';
  for (let i = 0; i < 9; i++) {
    const x = 26 + ((i * 61 + seed * 7) % 250), yy = y + ((i * 37 + seed) % 50);
    if (yy > 478) continue;
    d += `M${x - 4},${yy} q2,-6 3,-8 M${x},${yy} q0,-7 1,-10 M${x + 4},${yy} q-1,-6 -3,-8 `;
    if (i % 3 === 0) stones += `<ellipse cx="${x + 10}" cy="${yy - 1}" rx="3" ry="1.6" fill="${STONE}" stroke="${INK}" stroke-width="0.5"/>`;
  }
  return line(d, 0.7, '#4f5a30', ' opacity="0.8"') + stones;
}
export function hills(y, fill = GREENL) {
  return P(`M10,${y} Q60,${y - 30} 110,${y - 8} Q170,${y - 40} 220,${y - 10} Q260,${y - 26} 290,${y - 6} V${y + 40} H10Z`, fill, { hatch: 'hl' });
}
export function mountains(y, peaks, fill = STONE, snow = true) {
  let s = '';
  for (const [x, h, w] of peaks) {
    s += P(`M${x - w},${y} L${x},${y - h} L${x + w},${y}Z`, fill, { hatch: 'hl' });
    if (snow) s += P(`M${x - w * 0.28},${y - h * 0.72} L${x},${y - h} L${x + w * 0.28},${y - h * 0.72} L${x + w * 0.1},${y - h * 0.66} L${x - w * 0.05},${y - h * 0.74}Z`, WHITE, { hatch: null, sw: 1 });
  }
  return s;
}
export function sea(y, fill = BLUEL, bottom = 482) {
  return `<rect x="18" y="${y}" width="264" height="${bottom - y}" fill="${fill}" stroke="${INK}" stroke-width="1.1"/><rect x="18" y="${y}" width="264" height="${bottom - y}" fill="url(#wv)"/>`;
}
export function pool(cx, cy, rx, ry) {
  return El(cx, cy, rx, ry, BLUEL, { hatch: 'wv' });
}
export function path(d) { return line(d, 1.1, INK) + line(d, 6, SAND, ' opacity="0.6"'); }
export function cloud(x, y, w = 60, fill = WHITE) {
  const h = w * 0.38;
  return cloudBody(x, y, w, h, fill) + line(`M${x - w * 0.22},${y - h * 0.35} q${w * 0.06},${-h * 0.3} ${w * 0.14},${-h * 0.1} M${x + w * 0.06},${y - h * 0.5} q${w * 0.07},${-h * 0.3} ${w * 0.16},${-h * 0.06}`, 0.7, INK, ' opacity="0.45"');
}
function cloudBody(x, y, w, h, fill) {
  return P(`M${x - w / 2},${y} q${-w * 0.12},${-h * 0.9} ${w * 0.18},${-h * 0.8} q${w * 0.08},${-h * 0.9} ${w * 0.32},${-h * 0.55} q${w * 0.2},${-h * 0.7} ${w * 0.34},${h * 0.1} q${w * 0.25},${h * 0.1} ${w * 0.16},${h * 1.25}Z`, fill, { hatch: 'hl' });
}
export function sun(x, y, r, o = {}) {
  const { face = false, rays = 16 } = o;
  let s = '';
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const r1 = r * 1.08, r2 = r * (i % 2 ? 1.45 : 1.7);
    const ca = Math.cos(a), sa = Math.sin(a);
    if (i % 2) {
      const a1 = a - 0.09, a2 = a + 0.09;
      s += P(`M${x + Math.cos(a1) * r1},${y + Math.sin(a1) * r1} L${x + ca * r2},${y + sa * r2} L${x + Math.cos(a2) * r1},${y + Math.sin(a2) * r1}Z`, GOLDL, { hatch: null, sw: 0.9 });
    } else {
      const mx = x + ca * (r1 + r2) / 2 - sa * r * 0.12, my = y + sa * (r1 + r2) / 2 + ca * r * 0.12;
      s += line(`M${x + ca * r1},${y + sa * r1} Q${mx},${my} ${x + ca * r2},${y + sa * r2}`, 1.6, GOLD);
    }
  }
  s += Ci(x, y, r, 'url(#gold)', { hatch: 'h' });
  if (face) s += faceAt(x, y, r);
  return s;
}
function faceAt(x, y, r) {
  const k = r / 20;
  return line(`M${x - 8 * k},${y - 3 * k} q${3 * k},${-2.5 * k} ${6 * k},0 M${x + 2 * k},${y - 3 * k} q${3 * k},${-2.5 * k} ${6 * k},0`, 1.1) +
    line(`M${x},${y - 1 * k} q${-1.5 * k},${5 * k} ${1.5 * k},${6 * k}`, 1) + line(`M${x - 5 * k},${y + 9 * k} q${5 * k},${3 * k} ${10 * k},0`, 1.1);
}
export function moon(x, y, r, o = {}) {
  const { fill = GOLDL, dir = 1 } = o;
  const d = `M${x},${y - r} A${r},${r} 0 1,${dir > 0 ? 0 : 1} ${x},${y + r} A${r * 0.78},${r * 0.86} 0 1,${dir > 0 ? 1 : 0} ${x},${y - r}Z`;
  return P(d, fill, { hatch: 'h' });
}
export function star(x, y, r, o = {}) {
  const { n = 8, fill = GOLDL, inner = 0.42, sw = 1 } = o;
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ',' + f(y + Math.sin(a) * rr);
  }
  return P(d + 'Z', fill, { hatch: null, sw });
}
export function tree(x, y, s = 1, fill = GREEN) {
  return g(tr(x, y, s), P('M-5,0 L-4,-40 Q-12,-50 -18,-48 M-4,-40 L4,-40 L5,0Z', BROWN, { hatch: 'h' }) +
    P('M0,-96 q-30,0 -32,24 q-14,8 -6,24 q8,14 24,8 q8,8 24,0 q16,6 22,-10 q10,-18 -6,-28 q-4,-18 -26,-18Z', fill, { hatch: 'hl' }) +
    line('M-14,-70 q6,-4 12,0 M2,-80 q6,-4 12,0 M-6,-56 q6,-4 12,0', 0.8));
}
export function pillar(x, top, bottom, w = 30, fill = STONE, o = {}) {
  const { cap = true } = o;
  let s = R(x - w / 2, top, w, bottom - top, fill, { hatch: 'h' });
  s += line(`M${x - w / 4},${top + 6} V${bottom - 6} M${x},${top + 6} V${bottom - 6} M${x + w / 4},${top + 6} V${bottom - 6}`, 0.6, INK, ' opacity="0.5"');
  if (cap) {
    s += R(x - w / 2 - 5, top - 10, w + 10, 10, fill, { hatch: 'hx' });
    s += R(x - w / 2 - 5, bottom - 8, w + 10, 8, fill, { hatch: 'hx' });
  }
  return s;
}
export function tower(x, base, w, h, fill = STONE, o = {}) {
  const { crown = false, windows = 3, crenel = true } = o;
  let s = R(x - w / 2, base - h, w, h, fill, { hatch: 'h' });
  for (let i = 0; i < h / 14; i++) s += line(`M${x - w / 2},${base - h + i * 14} H${x + w / 2}`, 0.5, INK, ' opacity="0.45"');
  if (crenel) {
    const n = 4, cw = w / (n * 2 - 1);
    for (let i = 0; i < n; i++) s += R(x - w / 2 + i * cw * 2, base - h - 8, cw, 8, fill, { hatch: null });
  }
  for (let i = 0; i < windows; i++) {
    const wy = base - h + 22 + i * ((h - 40) / Math.max(1, windows));
    s += P(`M${x - 4},${wy + 12} V${wy + 3} Q${x},${wy - 3} ${x + 4},${wy + 3} V${wy + 12}Z`, DARK, { hatch: null, sw: 0.9 });
  }
  if (crown) s += crownShape(x, base - h - 10, w * 0.7);
  return s;
}
export function castle(x, y, s = 1, fill = STONE) {
  return g(tr(x, y, s), tower(-18, 0, 16, 40, fill, { windows: 1 }) + tower(0, 0, 22, 56, fill, { windows: 2 }) + tower(18, 0, 16, 34, fill, { windows: 1 }));
}
export function crownShape(x, y, w, fill = GOLDL) {
  const h = w * 0.55;
  return P(`M${x - w / 2},${y} L${x - w / 2},${y - h * 0.5} L${x - w / 4},${y - h * 0.15} L${x},${y - h} L${x + w / 4},${y - h * 0.15} L${x + w / 2},${y - h * 0.5} L${x + w / 2},${y}Z`, fill, { hatch: 'h', sw: 1 });
}
export function lemniscate(x, y, w = 30, c = GOLD) {
  const a = w / 2;
  return line(`M${x},${y} C${x - a * 0.4},${y - a * 0.5} ${x - a},${y - a * 0.5} ${x - a},${y} S${x - a * 0.4},${y + a * 0.5} ${x},${y} S${x + a},${y - a * 0.5} ${x + a},${y} S${x + a * 0.4},${y + a * 0.5} ${x},${y}`, 3.4, INK) +
    line(`M${x},${y} C${x - a * 0.4},${y - a * 0.5} ${x - a},${y - a * 0.5} ${x - a},${y} S${x - a * 0.4},${y + a * 0.5} ${x},${y} S${x + a},${y - a * 0.5} ${x + a},${y} S${x + a * 0.4},${y + a * 0.5} ${x},${y}`, 2, c);
}
export function rose(x, y, r = 6, fill = ROSE) {
  return Ci(x, y, r, fill, { hatch: 'h', sw: 1 }) + line(`M${x - r * 0.5},${y} q${r * 0.5},${-r * 0.7} ${r},0 q${-r * 0.5},${r * 0.5} ${-r * 0.9},${-r * 0.2}`, 0.8);
}
export function lily(x, y, s = 1) {
  return g(tr(x, y, s), line('M0,0 V-26', 1.2, GREEN) + P('M0,-26 q-8,-6 -6,-16 q4,6 6,8 q2,-2 6,-8 q2,10 -6,16Z', WHITE, { hatch: null, sw: 0.9 }) +
    P('M0,-10 q-9,-2 -12,-10 q8,2 12,6Z', GREENL, { hatch: null, sw: 0.8 }));
}
export function flowers(y, n = 7, x0 = 30, x1 = 270, kind = 'rose') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i / (n - 1));
    s += kind === 'rose' ? line(`M${x},${y + 14} V${y}`, 1, GREEN) + rose(x, y, 5) : lily(x, y + 14, 0.8);
  }
  return s;
}
export function wheat(x, y, s = 1) {
  let k = line('M0,0 V-40', 1, BROWN);
  for (let i = 0; i < 5; i++) k += El(-3, -24 - i * 4, 2.2, 4, GOLDL, { hatch: null, sw: 0.7, rot: -25 }) + El(3, -24 - i * 4, 2.2, 4, GOLDL, { hatch: null, sw: 0.7, rot: 25 });
  return g(tr(x, y, s), k);
}
export function sunflower(x, y, s = 1) {
  let k = line('M0,0 V-46', 1.6, GREEN) + P('M0,-18 q-12,-6 -16,4 q10,2 16,-4Z', GREENL, { hatch: null, sw: 0.8 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    k += g(`translate(0 -52) rotate(${a})`, El(0, -10, 3, 7, GOLDL, { hatch: null, sw: 0.7 }));
  }
  return g(tr(x, y, s), k + Ci(0, -52, 6, BROWN, { hatch: 'hx', sw: 0.9 }));
}
export function bird(x, y, s = 1, fill = WHITE) {
  return g(tr(x, y, s), P('M0,0 q8,-6 16,-2 q6,-6 12,-6 q-2,4 -6,7 q4,6 -6,8 q-12,2 -16,-7Z', fill, { hatch: 'h', sw: 1 }) + line('M18,-6 q-6,-10 -14,-8', 1));
}
export function birdV(x, y, s = 1) { return line(`M${x - 6 * s},${y - 3 * s} q${3 * s},${-2 * s} ${6 * s},${3 * s} q${3 * s},${-5 * s} ${6 * s},${-3 * s}`, 1.1); }
export function wings(x, y, s = 1, fill = WINE) {
  const w = 'M0,0 C-20,-30 -60,-46 -86,-30 C-70,-26 -66,-18 -74,-10 C-58,-12 -56,-2 -60,8 C-44,2 -36,10 -36,18 C-22,10 -10,10 0,14Z';
  const feathers = line('M-20,-14 L-70,-24 M-18,-4 L-62,-4 M-14,6 L-46,12', 0.8);
  return g(tr(x, y, s), P(w, fill, { hatch: 'hx' }) + feathers + g('scale(-1 1)', P(w, fill, { hatch: 'hx' }) + feathers));
}
export function rainbow(cx, cy, r) {
  return line(`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`, 6, ROSE, ' opacity="0.7"') +
    line(`M${cx - r + 6},${cy} A${r - 6},${r - 6} 0 0,1 ${cx + r - 6},${cy}`, 6, GOLDL, ' opacity="0.8"') +
    line(`M${cx - r + 12},${cy} A${r - 12},${r - 12} 0 0,1 ${cx + r - 12},${cy}`, 6, BLUEL, ' opacity="0.8"') +
    line(`M${cx - r - 3},${cy} A${r + 3},${r + 3} 0 0,1 ${cx + r + 3},${cy} M${cx - r + 15},${cy} A${r - 15},${r - 15} 0 0,1 ${cx + r - 15},${cy}`, 0.9);
}
export function lightning(x, y, s = 1) {
  return g(tr(x, y, s), P('M0,0 L-18,40 L-6,40 L-24,86 L14,30 L0,30 L16,0Z', GOLDL, { hatch: null, sw: 1.2 }));
}
export function flame(x, y, s = 1) {
  return g(tr(x, y, s), P('M0,0 q-10,-8 -6,-20 q2,8 6,6 q-4,-12 4,-22 q0,12 8,18 q4,10 -4,18Z', '#d9823b', { hatch: null, sw: 0.9 }) + P('M1,-3 q-4,-4 -1,-10 q3,5 4,4 q3,4 -3,6Z', GOLDL, { hatch: null, sw: 0.6 }));
}
export function wreath(cx, cy, rx, ry, fill = GREEN) {
  let s = El(cx, cy, rx, ry, 'none', { hatch: null, sw: 5, stroke: GREEN });
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const deg = a * 180 / Math.PI + 90 + (i % 2 ? 30 : -30);
    s += El(x, y, 3.2, 7.5, i % 2 ? fill : GREENL, { hatch: null, sw: 0.7, rot: deg });
  }
  return s;
}
export function ribbon(x, y, w = 18) {
  return P(`M${x - w},${y - 6} q${w / 2},6 ${w},6 q${w / 2},0 ${w},-6 q-4,6 0,12 q${-w / 2},-6 ${-w},-6 q${-w / 2},0 ${-w},6 q4,-6 0,-12Z`, WINE, { hatch: 'h', sw: 1 });
}

// ───── 器物（以握點為原點，朝上） ─────
export const I = {
  wand(len = 90) {
    let s = P(`M-3,${len * 0.25} L-3.5,${-len * 0.75} Q0,${-len * 0.8} 3.5,${-len * 0.75} L3,${len * 0.25}Z`, '#a8774a', { hatch: 'h', sw: 1.1 });
    for (const t of [0.6, 0.35, 0.05]) {
      const yy = -len * t;
      s += El(-7, yy, 2.4, 5, GREENL, { hatch: null, sw: 0.7, rot: -50 }) + El(7, yy - 6, 2.4, 5, GREENL, { hatch: null, sw: 0.7, rot: 50 });
    }
    return s;
  },
  sword(len = 90, hilt = GOLDL) {
    return P(`M-3.2,-8 L-3.2,${-len + 12} L0,${-len} L3.2,${-len + 12} L3.2,-8Z`, '#e8e2d4', { hatch: 'hl', sw: 1.1 }) +
      line(`M0,-10 V${-len + 14}`, 0.6) +
      P('M-13,-10 h26 v-4 h-26Z', hilt, { hatch: null, sw: 1 }) + P('M-2.4,-6 h4.8 v18 h-4.8Z', BROWN, { hatch: 'h', sw: 1 }) + Ci(0, 14, 3.2, hilt, { hatch: null, sw: 0.9 });
  },
  cup(sz = 1, fill = GOLDL) {
    return g(`scale(${sz})`, P('M-11,-30 Q-12,-12 0,-8 Q12,-12 11,-30Z', fill, { hatch: 'h', sw: 1.1 }) + P('M-2,-8 h4 v10 h-4Z', fill, { hatch: null, sw: 1 }) +
      P('M-9,2 q9,-4 18,0 v3 h-18Z', fill, { hatch: 'h', sw: 1 }) + El(0, -30, 11, 2.6, WHITE, { hatch: null, sw: 0.9 }) + Ci(0, -19, 2, ROSE, { hatch: null, sw: 0.6 }));
  },
  pentacle(r = 13, fill = GOLDL) {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      d += (i ? 'L' : 'M') + f(Math.cos(a) * r * 0.72) + ',' + f(Math.sin(a) * r * 0.72);
    }
    return Ci(0, 0, r, fill, { hatch: 'h', sw: 1.2 }) + Ci(0, 0, r * 0.8, 'none', { hatch: null, sw: 0.8 }) + line(d + 'Z', 1.1);
  },
  lantern() {
    return line('M0,0 V8', 1) + P('M-7,8 h14 l-2,20 h-10Z', GOLDL, { hatch: null, sw: 1 }) + star(0, 18, 5, { n: 6, fill: WHITE, sw: 0.6 }) + P('M-8,8 l8,-6 l8,6Z', GOLD, { hatch: null, sw: 0.9 });
  },
  staff(len = 120) { return P(`M-2.5,${len * 0.35} L-2.5,${-len * 0.65} Q0,${-len * 0.68} 2.5,${-len * 0.65} L2.5,${len * 0.35}Z`, BROWN, { hatch: 'h', sw: 1 }); },
  scales() {
    return line('M0,0 V-24 M-22,-22 H22', 1.4, GOLD) + line('M-22,-22 L-28,-6 M-22,-22 L-16,-6 M22,-22 L16,-6 M22,-22 L28,-6', 0.8) +
      P('M-30,-6 q8,8 16,0Z', GOLDL, { hatch: null, sw: 1 }) + P('M14,-6 q8,8 16,0Z', GOLDL, { hatch: null, sw: 1 });
  },
  orb() { return Ci(0, -8, 7, GOLDL, { sw: 1 }) + line('M0,-15 V-21 M-3,-18 H3', 1.2, GOLD); },
  ankh(len = 70) {
    return P(`M-2.2,0 V${-len + 18} H2.2 V0Z`, GOLDL, { hatch: null, sw: 1 }) + line(`M-8,${-len + 18} H8`, 3, GOLD) + El(0, -len + 10, 5, 8, 'none', { hatch: null, sw: 3, stroke: GOLD });
  },
  triplecross(len = 100) {
    return P(`M-2,${len * 0.3} V${-len * 0.7} H2 V${len * 0.3}Z`, GOLDL, { hatch: null, sw: 1 }) +
      line(`M-6,${-len * 0.62} H6 M-9,${-len * 0.54} H9 M-12,${-len * 0.46} H12`, 2.4, GOLD);
  },
  key(s = 1, fill = GOLDL) { return g(`scale(${s})`, Ci(0, -40, 7, 'none', { hatch: null, sw: 3, stroke: fill }) + line('M0,-33 V0 M0,-6 H7 M0,-12 H6', 3, fill)); },
  flag(fill = DARK, emblem = 'rose') {
    let s = I.staff(110) + P('M2,-70 q22,-6 44,2 q-4,16 2,32 q-22,-8 -46,-2Z', fill, { hatch: 'h', sw: 1 });
    if (emblem === 'rose') s += rose(25, -52, 8, WHITE);
    if (emblem === 'cross') s += line('M25,-64 V-42 M14,-53 H36', 3, WINE);
    return s;
  },
  banner(fill = WINE) { return I.staff(110) + P('M2,-70 q30,-8 52,4 q-6,12 2,26 q-26,-10 -54,-2Z', fill, { hatch: 'h', sw: 1 }); },
  trumpet() { return P('M0,0 L-50,-30 L-56,-24 L-6,6Z', GOLDL, { hatch: null, sw: 1 }) + P('M-50,-30 l-14,-14 l8,22Z', GOLDL, { hatch: null, sw: 1 }) + P('M-46,-26 h24 v14 h-24Z', WHITE, { hatch: null, sw: 0.8 }) + line('M-34,-24 V-14 M-40,-19 H-28', 1.6, WINE); },
  jug(fill = GOLDL) { return P('M-7,0 q-4,-10 2,-16 v-6 h10 v6 q6,6 2,16Z', fill, { hatch: 'h', sw: 1 }); },
  rose() { return line('M0,0 V-12', 1, GREEN) + rose(0, -16, 6, WHITE); },
  bindle() { return I.staff(80) + P('M-4,-50 q-12,6 -8,18 q8,6 16,-2 q4,-10 -8,-16Z', WINE, { hatch: 'hx', sw: 1 }); },
  scroll() { return P('M-10,-6 h20 v12 h-20Z', WHITE, { hatch: null, sw: 1 }) + Ci(-10, 0, 3, WHITE, { hatch: null, sw: 0.8 }) + Ci(10, 0, 3, WHITE, { hatch: null, sw: 0.8 }); },
  torch() { return P('M-2,0 V-30 H2 V0Z', BROWN, { hatch: null, sw: 0.9 }) + flame(0, -28, 0.8); },
  globe() { return Ci(0, -10, 10, BLUEL, { hatch: 'hl', sw: 1 }) + line('M-10,-10 H10 M0,-20 Q-6,-10 0,0 Q6,-10 0,-20', 0.7); },
  hoe() { return I.staff(110) + P('M-2,-72 h-14 l-2,8 h16Z', STONED, { hatch: null, sw: 1 }); },
  hammer() { return P('M-1.5,0 V-26 H1.5 V0Z', BROWN, { hatch: null, sw: 0.8 }) + P('M-7,-30 h14 v6 h-14Z', STONED, { hatch: null, sw: 0.9 }); },
  hand() { return P('M-5,4 q-2,-10 2,-14 q2,-4 6,-2 q4,2 4,8 q2,6 -2,10Z', SKIN, { hatch: null, sw: 1 }); }
};

// ───── 人物（正面，腳在原點，高約 120） ─────
const HEADWEAR = {
  crown: () => crownShape(0, -112, 22),
  crownstars: () => {
    let s = '';
    for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 11) * Math.PI; s += star(Math.cos(a) * 17, -100 + Math.sin(a) * 19, 3, { n: 5, fill: GOLDL, sw: 0.5 }); }
    return s;
  },
  triple: () => P('M-10,-110 q10,-34 20,0Z', GOLDL, { hatch: 'h', sw: 1 }) + line('M-9,-117 H9 M-7,-125 H7 M-5,-132 H5', 1.6, GOLD),
  hood: (o) => P('M-15,-96 q-2,-30 15,-30 q17,0 15,30 q-6,-14 -15,-14 q-9,0 -15,14Z', o.robe, { hatch: 'hx' }),
  veil: (o) => P('M-14,-98 q0,-28 14,-28 q14,0 14,28 l6,30 q-6,-8 -10,-6 q-2,-30 -10,-30 q-8,0 -10,30 q-4,-2 -10,6Z', o.veilColor || BLUEL, { hatch: 'hl' }),
  moon: () => P('M-12,-128 q12,10 24,0 q-12,18 -24,0Z', GOLDL, { hatch: null, sw: 0.9 }) + Ci(0, -124, 5, WHITE, { hatch: null, sw: 0.8 }),
  laurel: () => { let s = ''; for (let i = 0; i < 7; i++) { const a = Math.PI * 1.05 + (i / 6) * Math.PI * 0.9; s += El(Math.cos(a) * 13, -106 + Math.sin(a) * 12, 2, 4.4, GREENL, { hatch: null, sw: 0.6, rot: a * 57 + 90 }); } return s; },
  roses: () => { let s = ''; for (let i = 0; i < 5; i++) { const a = Math.PI * 1.1 + (i / 4) * Math.PI * 0.8; s += rose(Math.cos(a) * 13, -106 + Math.sin(a) * 12, 3.2); } return s; },
  feather: () => P('M6,-118 q14,-16 26,-10 q-10,4 -26,10Z', WINE, { hatch: null, sw: 0.9 }) + line('M-10,-116 q10,-6 20,0', 3, GREEN),
  helmet: () => P('M-13,-104 q0,-22 13,-22 q13,0 13,22 h-4 v-6 h-18 v6Z', STONE, { hatch: 'hx' }) + P('M0,-126 q10,-12 20,-6 q-10,0 -20,6Z', WINE, { hatch: null, sw: 0.8 }),
  halo: () => Ci(0, -106, 18, 'none', { hatch: null, sw: 3, stroke: GOLD }),
  horns: () => P('M-8,-116 q-10,-8 -8,-20 q4,10 12,14Z M8,-116 q10,-8 8,-20 q-4,10 -12,14Z', STONED, { hatch: null, sw: 0.9 }),
  sunmark: () => Ci(0, -112, 3, GOLDL, { hatch: null, sw: 0.7 }),
  skull: () => '',
  none: () => ''
};

export function figure(o = {}) {
  const {
    x = 150, y = 400, s: sc = 1, flip = false, rot = 0, robe = WINE, cloak = null, head = 'none', head2 = null,
    armL = 25, armR = 25, holdL = null, holdR = null, pose = 'stand', skin = SKIN, hair = BROWN,
    belt = GOLD, skull = false, rideLeg = true, tilt = 0, hairLong = false, trim = true
  } = o;
  const hs = pose === 'kneel' ? 0.78 : 1;
  const sh = -92 * hs + (1 - hs) * 0; // shoulder y
  const hy = sh - 14; // head center
  let s = '';
  if (head === 'halo') s += g(`translate(0 ${hy + 106})`, HEADWEAR.halo());
  if (cloak) {
    s += P(`M-18,${sh + 2} Q-38,${sh * 0.4} -34,0 L34,0 Q38,${sh * 0.4} 18,${sh + 2}Z`, cloak, { hatch: 'hx' });
    s += line(`M-18,${sh + 4} Q-35,${sh * 0.4} -31,-1 M18,${sh + 4} Q35,${sh * 0.4} 31,-1`, 1.1, GOLDL, ' opacity="0.9"');
  }
  if (hairLong) {
    s += P(`M-12,${hy} q-6,22 -4,34 h32 q2,-12 -4,-34Z`, hair, { hatch: 'h', sw: 1 });
    s += line(`M-10,${hy + 6} q-3,12 -1,24 M10,${hy + 6} q3,12 1,24 M-6,${hy + 12} q-1,10 0,18 M6,${hy + 12} q1,10 0,18`, 0.5, INK, ' opacity="0.55"');
  }
  // legs for walking
  if (pose === 'walk') s += line('M-8,-6 L-14,6 M8,-6 L16,4', 4, INK) + line('M-8,-6 L-14,6 M8,-6 L16,4', 2.4, SKIN);
  // robe
  if (pose === 'ride') {
    s += P(`M-14,${sh} Q-18,${sh + 30} -22,${sh + 52} L22,${sh + 52} Q18,${sh + 30} 14,${sh}Z`, robe);
    if (rideLeg) s += P(`M8,${sh + 48} q6,18 2,36 l8,2 q4,-20 -2,-40Z`, robe, { hatch: 'hx' });
  } else if (pose === 'seat') {
    s += P(`M-14,${sh} Q-20,${sh * 0.55} -24,${sh * 0.38} Q-34,${sh * 0.3} -32,-4 L32,-4 Q34,${sh * 0.3} 24,${sh * 0.38} Q20,${sh * 0.55} 14,${sh}Z`, robe);
    s += line(`M-28,${sh * 0.36} Q0,${sh * 0.3} 28,${sh * 0.36}`, 0.8);
    s += P('M-20,-4 h12 v6 h-12Z M8,-4 h12 v6 h-12Z', DARK, { hatch: null, sw: 0.8 });
    s += `<path d="M8,${sh + 2} Q14,${sh * 0.5} 14,${sh * 0.34} L28,${sh * 0.34} Q34,${sh * 0.3} 32,-4 L14,-4Z" fill="url(#hx)" opacity="0.5"/>`;
    s += line(`M-14,-4 Q-12,${sh * 0.16} -16,${sh * 0.32} M0,-4 Q1,${sh * 0.16} -1,${sh * 0.31} M14,-4 Q12,${sh * 0.16} 16,${sh * 0.32}`, 0.6, INK, ' opacity="0.55"');
  } else {
    s += P(`M-14,${sh} Q-18,${sh * 0.6} -26,0 L26,0 Q18,${sh * 0.6} 14,${sh}Z`, robe);
    // 衣袍右側的雕版陰影與衣褶
    s += `<path d="M6,${sh + 2} Q12,${sh * 0.6} 12,0 L26,0 Q18,${sh * 0.6} 14,${sh}Z" fill="url(#hx)" opacity="0.55"/>`;
    s += line(`M-2,${sh + 34} Q-3,${sh * 0.3} -4,-1 M2,${sh + 34} Q4,${sh * 0.3} 6,-1 M-17,-1 Q-14,${sh * 0.25} -10,${sh * 0.5} M17,-1 Q14,${sh * 0.25} 10,${sh * 0.5}`, 0.6, INK, ' opacity="0.55"');
    if (pose !== 'walk') s += El(-8, 1.5, 6, 2.6, DARK, { hatch: null, sw: 0.6 }) + El(8, 1.5, 6, 2.6, DARK, { hatch: null, sw: 0.6 });
    s += line(`M-6,${sh + 14} Q-8,${sh * 0.4} -12,-2 M6,${sh + 14} Q8,${sh * 0.4} 12,-2`, 0.7, INK, ' opacity="0.6"');
  }
  if (belt) s += line(`M-15,${sh + 30} Q0,${sh + 34} 15,${sh + 30}`, 2.2, belt);
  if (robe !== SKIN && trim) {
    // 華麗金邊：領口、衣襬與胸前寶石
    s += line(`M-12,${sh + 1} Q0,${sh + 9} 12,${sh + 1}`, 2, GOLDL) + `<circle cx="0" cy="${f(sh + 8)}" r="2.3" fill="url(#gem)" stroke="${GOLD}" stroke-width="0.8"/>`;
    if (pose === 'stand' || pose === 'walk' || pose === 'kneel') s += line('M-25,-3 H25', 2.6, GOLDL) + line('M-24,-3 H24', 0.9, GOLD, ' stroke-dasharray="0.1 3.4"');
    else if (pose === 'seat') s += line('M-31,-6 H31', 2.6, GOLDL) + line('M-30,-6 H30', 0.9, GOLD, ' stroke-dasharray="0.1 3.4"');
  }
  // arms
  const arm = (side, ang, hold) => {
    const a = (ang * Math.PI) / 180;
    const sx = side * 13, sy = sh + 5;
    const len = 38;
    const hx = sx + side * Math.sin(a) * len, hy2 = sy + Math.cos(a) * len;
    const ex = sx + side * Math.sin(a) * len * 0.5 + side * 3, ey = sy + Math.cos(a) * len * 0.5;
    let k = line(`M${sx},${sy} Q${ex},${ey} ${hx},${hy2}`, 9, INK) + line(`M${sx},${sy} Q${ex},${ey} ${hx},${hy2}`, 6.6, robe);
    let item = '';
    if (hold) {
      const h = typeof hold === 'string' ? { item: hold } : hold;
      item = g(`translate(${f(hx)} ${f(hy2)}) rotate(${h.rot || 0})`, h.item);
    }
    // 袖口金邊與手
    const cx = sx + side * Math.sin(a) * len * 0.86, cy = sy + Math.cos(a) * len * 0.86;
    k += `<circle cx="${f(cx)}" cy="${f(cy)}" r="3.4" fill="none" stroke="${GOLDL}" stroke-width="1.3"/>`;
    const hand = Ci(hx, hy2, 4, skin, { hatch: null, sw: 1 }) + line(`M${f(hx - 1.6)},${f(hy2 + 1)} q1.6,1.4 3.2,0`, 0.6, INK, ' opacity="0.6"');
    return { k, item, hand };
  };
  const A = arm(-1, armL, holdL), B = arm(1, armR, holdR);
  // neck & head
  s += P(`M-4,${sh + 2} v-6 h8 v6Z`, skin, { hatch: null, sw: 1 });
  if (head === 'veil' || head === 'hood') s += HEADWEAR[head](o);
  if (skull) {
    s += Ci(0, hy, 11, WHITE, { hatch: 'h' }) + Ci(-4, hy - 1, 2.6, DARK, { hatch: null, sw: 0.5 }) + Ci(4, hy - 1, 2.6, DARK, { hatch: null, sw: 0.5 }) + line(`M-4,${hy + 6} H4 M-2,${hy + 5} V${hy + 8} M2,${hy + 5} V${hy + 8}`, 0.8);
  } else {
    s += Ci(0, hy, 11, skin, { hatch: null });
    if (hair && head !== 'hood' && head !== 'helmet') {
      s += P(`M-11,${hy - 1} q1,-12 11,-12 q10,0 11,12 q-4,-6 -11,-6 q-7,0 -11,6Z`, hair, { hatch: 'h', sw: 1 });
      s += line(`M-8,${hy - 4} q3,-6 8,-8 M-3,${hy - 6} q3,-4 7,-6 M3,${hy - 6} q3,-2 6,2`, 0.5, INK, ' opacity="0.6"');
    }
    // 臉部：眉、垂目、鼻、唇與腮紅
    s += line(`M-6.5,${hy - 2.6} q2.2,-1.4 4.4,-0.2 M2.1,${hy - 2.8} q2.2,-1.2 4.4,0.2`, 0.8, BROWN);
    s += line(`M-6,${hy + 0.6} q1.9,1.5 3.8,0 M2.2,${hy + 0.6} q1.9,1.5 3.8,0`, 0.9);
    s += `<circle cx="-4.1" cy="${f(hy + 1.3)}" r="0.7" fill="${INK}"/><circle cx="4.1" cy="${f(hy + 1.3)}" r="0.7" fill="${INK}"/>`;
    s += line(`M0.2,${hy + 1} q-1.2,2.6 0.6,3.4`, 0.6, INK, ' opacity="0.7"');
    s += `<path d="M-2.2,${f(hy + 6.2)} q2.2,1.6 4.4,0 q-2.2,0.4 -4.4,0Z" fill="${ROSE}" stroke="${INK}" stroke-width="0.4"/>`;
    s += `<circle cx="-6.4" cy="${f(hy + 4)}" r="2" fill="${ROSE}" opacity="0.28"/><circle cx="6.4" cy="${f(hy + 4)}" r="2" fill="${ROSE}" opacity="0.28"/>`;
    s += `<path d="M-9,${f(hy + 2)} q1,7 9,9 q8,-2 9,-9" fill="none" stroke="${INK}" stroke-width="0.5" opacity="0.35"/>`;
  }
  if (head !== 'veil' && head !== 'hood' && head !== 'halo' && HEADWEAR[head]) s += g(`translate(0 ${hy + 106})`, HEADWEAR[head](o));
  if (head2 && HEADWEAR[head2]) s += g(`translate(0 ${hy + 106})`, HEADWEAR[head2](o));
  s += A.k + B.k + A.item + B.item + A.hand + B.hand;
  let t = `translate(${f(x)} ${f(y)})`;
  if (rot || tilt) t += ` rotate(${rot || tilt})`;
  t += ` scale(${flip ? -sc : sc} ${sc})`;
  return `<g transform="${t}">${s}</g>`;
}

// 背影小人（只見頭與肩）
export function backFigure(x, y, s = 1, robe = STONE, hair = BROWN) {
  return g(tr(x, y, s), P('M-18,0 q0,-30 18,-32 q18,2 18,32Z', robe) + Ci(0, -40, 10, hair, { hatch: 'h' }));
}

// ───── 動物 ─────
export function lion(x, y, s = 1, flip = false) {
  const k = P('M-50,-30 q-10,-30 20,-34 h40 q22,0 24,26 v6 l-4,32 h-8 l-2,-24 h-36 l-4,24 h-8 l-2,-26 q-12,-2 -20,-4Z', GOLDL, { hatch: 'h' }) +
    line('M-50,-28 q-18,-6 -14,-26 q4,8 -2,14', 2.2) +
    P('M18,-74 l8,8 l10,-6 l2,12 l12,2 l-6,10 l8,10 l-12,4 l0,12 l-10,-6 l-8,8 l-4,-12 l-12,-2 l6,-10 l-6,-10 l12,-2Z', '#c9974b', { hatch: 'hx' }) +
    Ci(30, -48, 12, GOLDL, { hatch: null }) + Ci(34, -51, 1.4, INK, { hatch: null, sw: 0.5 }) + line('M38,-44 q-4,4 -8,2', 1);
  return g(tr(x, y, s, 0, flip), k);
}
export function dog(x, y, s = 1, fill = WHITE, o = {}) {
  const { flip = false, howl = false, ears = 'flop' } = o;
  let k = P('M-22,-14 q-4,-16 12,-18 h18 q10,0 12,8 l-2,24 h-5 l-2,-14 h-20 l-2,14 h-5Z', fill, { hatch: 'h' }) + line('M-22,-14 q-12,-4 -10,-16', 2);
  const hy = howl ? -40 : -32;
  k += P(`M16,-24 q2,${hy + 24 - 8} 10,${hy + 24 - 14} l${howl ? 8 : 14},${howl ? -10 : 2} q2,6 -4,${howl ? 14 : 10} q-2,6 -12,12Z`, fill, { hatch: 'h' });
  k += ears === 'point' ? P(`M18,${hy + 2} l2,-10 l6,8Z`, fill, { hatch: null, sw: 0.9 }) : P(`M20,${hy + 2} q-6,4 -4,12 q4,-2 6,-10Z`, fill, { hatch: 'h', sw: 0.9 });
  return g(tr(x, y, s, 0, flip), k);
}
export function horse(x, y, s = 1, o = {}) {
  const { fill = WHITE, pose = 'stand', flip = false, blanket = WINE, rider = '' } = o;
  const legs = {
    stand: 'M-30,-40 L-31,0 M-20,-40 L-20,0 M22,-40 L22,0 M32,-40 L33,0',
    walk: 'M-30,-40 L-34,0 M-20,-40 L-16,0 M22,-40 L20,0 M32,-40 Q44,-22 38,-14',
    gallop: 'M-30,-40 L-46,-14 M-20,-40 L-32,-6 M22,-40 L44,-22 M32,-40 L54,-30',
    rear: 'M-30,-40 L-31,0 M-20,-40 L-18,0 M22,-40 Q38,-46 34,-62 M32,-40 Q48,-42 46,-58'
  }[pose];
  let k = line(legs, 7.5, INK) + line(legs, 5, fill);
  k += P('M-40,-58 q-14,10 -16,36 q6,-14 14,-20Z', DARK, { hatch: null, sw: 0.8 });
  k += El(0, -56, 42, 19, fill, { hatch: 'h' });
  k += P('M26,-66 Q34,-96 48,-108 L68,-92 Q66,-86 58,-86 L50,-90 Q46,-74 40,-48Z', fill, { hatch: 'h' });
  k += P('M30,-70 Q36,-96 48,-108 q-10,4 -14,0 q-6,10 -12,30Z', DARK, { hatch: null, sw: 0.8, op: 0.8 });
  k += Ci(54, -98, 1.6, INK, { hatch: null, sw: 0.4 }) + line('M48,-108 l2,-8 l4,7', 1);
  // 鬃毛、鼻孔與韁繩
  k += line('M32,-74 q-6,-8 -2,-16 M36,-84 q-6,-8 -1,-15 M40,-94 q-5,-7 0,-13 M44,-102 q-4,-6 1,-10', 0.8, INK, ' opacity="0.7"') +
    `<circle cx="65" cy="-91" r="1" fill="${INK}"/>` + line('M58,-90 Q44,-80 20,-72', 1, BROWN);
  k += P('M-14,-74 h30 l-2,28 h-26Z', blanket, { hatch: 'hx', sw: 1 });
  let inner = k;
  if (rider) inner += rider;
  const rot = pose === 'rear' ? -16 : 0;
  return g(tr(x, y, s, 0, flip) + (rot ? ` rotate(${rot})` : ''), inner);
}
export function sphinx(x, y, s = 1, fill = WHITE, flip = false) {
  return g(tr(x, y, s, 0, flip), P('M-40,0 q-2,-24 18,-26 h28 q6,-22 20,-22 q12,0 12,18 l-4,8 v22Z', fill, { hatch: 'h' }) +
    P('M20,-48 l-4,22 h28 l-4,-22Z', fill === WHITE ? STONE : GOLDL, { hatch: null, sw: 0.9, op: 0.8 }) + Ci(30, -36, 1.4, fill === WHITE ? INK : WHITE, { hatch: null, sw: 0.3 }) +
    line('M-40,-4 q-10,-8 -6,-16', 2));
}
export function crayfish(x, y, s = 1) {
  return g(tr(x, y, s), El(0, 0, 8, 16, '#c56b4c', { hatch: 'h' }) + P('M-6,-14 l-10,-14 l6,2 l0,-6 l4,4Z M6,-14 l10,-14 l-6,2 l0,-6 l-4,4Z', '#c56b4c', { hatch: null, sw: 0.9 }) +
    line('M-7,-4 l-8,4 M-7,4 l-8,4 M7,-4 l8,4 M7,4 l8,4', 1));
}
export function snake(x, y, s = 1) { return g(tr(x, y, s), line('M0,0 q-12,20 0,40 q12,20 0,40 q-12,20 0,40', 5, INK) + line('M0,0 q-12,20 0,40 q12,20 0,40 q-12,20 0,40', 3, GOLDL)); }
export function salamander(x, y, s = 1) { return g(tr(x, y, s), line('M-14,0 q-6,-8 4,-10 q10,-2 16,4 q6,6 -2,10 q-8,2 -10,-4', 3, '#c7703a') + line('M-14,0 q-6,-8 4,-10 q10,-2 16,4 q6,6 -2,10 q-8,2 -10,-4', 1, INK, ' opacity="0.6"')); }

// ───── 家具與建物 ─────
export function throne(x, y, w = 80, h = 120, fill = STONE, o = {}) {
  const { deco = '' } = o;
  return g(tr(x, y), P(`M${-w / 2},0 V${-h + 16} Q${-w / 2},${-h} ${-w / 2 + 16},${-h} H${w / 2 - 16} Q${w / 2},${-h} ${w / 2},${-h + 16} V0Z`, fill, { hatch: 'hx' }) +
    R(-w / 2 - 6, -h * 0.38, 10, h * 0.38, fill, { hatch: 'h' }) + R(w / 2 - 4, -h * 0.38, 10, h * 0.38, fill, { hatch: 'h' }) + deco);
}
export function table(x, y, w = 150, fill = BROWN) {
  return R(x - w / 2, y, w, 10, fill, { hatch: 'h' }) + R(x - w / 2 + 6, y + 10, 8, 40, fill, { hatch: 'h' }) + R(x + w / 2 - 14, y + 10, 8, 40, fill, { hatch: 'h' }) + P(`M${x - w / 2},${y} h${w} l-4,26 h${-w + 8}Z`, WINE, { hatch: 'hx', op: 0.9 });
}
export function boat(x, y, s = 1) { return g(tr(x, y, s), P('M-60,-10 h120 q-8,22 -30,24 h-60 q-22,-2 -30,-24Z', BROWN, { hatch: 'h' })); }
export function ship(x, y, s = 1) { return g(tr(x, y, s), P('M-12,0 h24 q-2,6 -6,6 h-12 q-4,0 -6,-6Z', BROWN, { hatch: null, sw: 0.8 }) + P('M0,0 V-18 L10,-4Z', WHITE, { hatch: null, sw: 0.8 })); }
export function bed(x, y, w = 200) {
  return R(x - w / 2, y, w, 26, BROWN, { hatch: 'h' }) + R(x - w / 2, y - 40, 10, 66, BROWN, { hatch: 'h' }) + P(`M${x - w / 2 + 10},${y} q${w / 2},-30 ${w - 10},-6 v6Z`, WHITE, { hatch: 'hl' });
}
export function coffin(x, y, w = 60) { return P(`M${x - w / 2},${y} l6,-16 h${w - 12} l6,16Z`, STONED, { hatch: 'hx' }); }
export function wall(y, h = 40, fill = STONE) {
  let s = R(18, y, 264, h, fill, { hatch: 'h' });
  for (let r = 0; r < h / 10; r++) for (let c = 0; c < 14; c++) s += R(18 + c * 20 + (r % 2) * 10, y + r * 10, 20, 10, 'none', { hatch: null, sw: 0.5 });
  return s;
}
export function archway(x, y, w, h, fill = STONE) {
  return P(`M${x - w / 2},${y} V${y - h + w / 2} A${w / 2},${w / 2} 0 0,1 ${x + w / 2},${y - h + w / 2} V${y} H${x + w / 2 - 14} V${y - h + w / 2} A${w / 2 - 14},${w / 2 - 14} 0 0,0 ${x - w / 2 + 14},${y - h + w / 2} V${y}Z`, fill, { hatch: 'hx' });
}
export function window(x, y, w = 70, h = 90) {
  return P(`M${x - w / 2},${y} V${y - h + w / 2} A${w / 2},${w / 2} 0 0,1 ${x + w / 2},${y - h + w / 2} V${y}Z`, GOLDL, { hatch: null, sw: 1.4 }) +
    line(`M${x},${y} V${y - h} M${x - w / 2},${y - h / 2} H${x + w / 2}`, 1.4);
}
export function handFromCloud(side, y, item) {
  const cx = side < 0 ? 62 : 238;
  const ax = cx + side * -22;
  return g(`translate(150 ${y})`, item) +
    line(`M${ax},${y + 4} H${150 + side * 2}`, 11, INK) + line(`M${ax},${y + 4} H${150 + side * 2}`, 8.4, WHITE) +
    g(`translate(150 ${y + 2})`, P('M-8,6 q-3,-12 2,-16 q3,-5 8,-2 q6,3 6,10 q2,8 -3,12Z', SKIN, { hatch: null, sw: 1.1 })) +
    cloud(cx, y + 24, 92);
}
// 羅馬數字（以線條繪製，不使用字體）
export function roman(n, cx, cy, h = 13, color = INK, w = 1.6) {
  if (n === 0) return Ci(cx, cy, h * 0.42, 'none', { hatch: null, sw: w, stroke: color });
  const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let str = '';
  let k = n;
  for (const [v, sym] of map) while (k >= v) { str += sym; k -= v; }
  const W = { I: h * 0.32, V: h * 0.72, X: h * 0.72 };
  const gap = h * 0.18;
  const total = [...str].reduce((a, c) => a + W[c], 0) + gap * (str.length - 1);
  let x = cx - total / 2;
  const t = cy - h / 2, b = cy + h / 2;
  let d = '';
  for (const c of str) {
    const w = W[c];
    if (c === 'I') d += `M${x + w / 2},${t} V${b} M${x},${t} H${x + w} M${x},${b} H${x + w} `;
    if (c === 'V') d += `M${x},${t} L${x + w / 2},${b} L${x + w},${t} `;
    if (c === 'X') d += `M${x},${t} L${x + w},${b} M${x + w},${t} L${x},${b} `;
    x += w + gap;
  }
  return line(d, w, color);
}

// ───── 牌框（華麗版） ─────
const SUIT_EMB = {
  wands: () => g('scale(0.85) translate(-8 0) rotate(90)', I.wand(30)),
  cups: () => g('translate(0 7) scale(0.42)', I.cup(1)),
  swords: () => g('scale(0.85) translate(-9 0) rotate(90)', I.sword(32)),
  pentacles: () => I.pentacle(7.5)
};
export function curl(flip = false) {
  // 金色捲草紋
  const d = 'M0,0 C10,-10 28,-8 30,4 C31,12 22,16 17,11 C13,7 17,2 21,5 M8,-4 C4,-12 -4,-12 -6,-6 M14,-7 C16,-15 26,-17 30,-12';
  return g(flip ? 'scale(-1 1)' : '', line(d, 2.6, '#5a3a14', ' opacity="0.55"') + line(d, 1.5, 'url(#gh)') +
    El(25, -15, 2.2, 4.4, GOLDL, { hatch: null, sw: 0.5, rot: 40 }) + El(-7, -10, 2, 4, GOLDL, { hatch: null, sw: 0.5, rot: -30 }));
}
export function gem(x, y, r, kind = 'gem') {
  return `<circle cx="${x}" cy="${y}" r="${r + 1.8}" fill="url(#gv)" stroke="#5a3a14" stroke-width="0.6"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${kind})"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.28}" fill="#fff" opacity="0.7"/>`;
}
export function fleur(x, y, rot) {
  return g(`translate(${x} ${y}) rotate(${rot})`,
    P('M0,0 C2,-6 8,-8 12,-6 C8,-4 6,0 4,4 C8,2 12,4 12,8 C8,8 4,6 0,0Z', 'url(#gv)', { hatch: null, sw: 0.6, stroke: '#5a3a14' }) +
    P('M0,0 C6,-2 8,-8 6,-12 C4,-8 0,-6 -4,-4 C-2,-8 -4,-12 -8,-12 C-8,-8 -6,-4 0,0Z', 'url(#gv)', { hatch: null, sw: 0.6, stroke: '#5a3a14' }) +
    gem(0, 0, 2.6));
}
// 牌框中重複出現的紋飾只定義一次，再以 <use> 引用
function FRAME_SYMBOLS() {
  return `<g id="fl">${fleur(0, 0, 0)}</g><g id="cu">${curl()}</g><g id="gb">${gem(0, 0, 1.6, 'gemb')}</g>` +
    `<path id="dm" d="M0,-7 L3,0 L0,7 L-3,0Z" fill="url(#gv)" stroke="#5a3a14" stroke-width="0.5"/>`;
}
const use = (id, t) => `<use href="#${id}" transform="${t}"/>`;
export function frame(inner, o = {}) {
  const { numeral = null, suit = null, court = false, rev = false } = o;
  // 外框底色與錦緞紋
  let s = `<rect x="0" y="0" width="300" height="500" rx="14" fill="${WINED}"/><rect x="0" y="0" width="300" height="500" rx="14" fill="url(#damask)"/>`;
  s += `<rect x="3.5" y="3.5" width="293" height="493" rx="11.5" fill="none" stroke="url(#gv)" stroke-width="3"/>`;
  s += `<rect x="9" y="9" width="282" height="482" rx="8" fill="none" stroke="${GOLDL}" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 4.2" opacity="0.9"/>`;
  s += `<rect x="13" y="13" width="274" height="474" rx="6" fill="none" stroke="${GOLD}" stroke-width="0.7"/>`;
  // 畫面（縮放進拱形畫框）
  s += `<path d="${ARCH}" fill="${PARCH}"/><g clip-path="url(#panel)"><g transform="${rev ? 'rotate(180 150 239) ' : ''}translate(12 9) scale(0.92)">${inner}</g></g>`;
  // 逆位：只把框內插畫繞畫框中心旋轉 180 度，金框與徽章保持正向
  // 拱框：三重金線
  s += `<path d="${ARCH}" fill="none" stroke="#3a1a0c" stroke-width="5.5" opacity="0.55"/><path d="${ARCH}" fill="none" stroke="url(#gv)" stroke-width="3.6"/>`;
  s += `<path d="M24,452 V102 Q24,50 70,38 Q110,27 150,19 Q190,27 230,38 Q276,50 276,102 V452" fill="none" stroke="${GOLDL}" stroke-width="0.8"/>`;
  // 拱肩捲草紋
  s += use('cu', 'translate(30 28)') + use('cu', 'translate(270 28) scale(-1 1)');
  // 兩側寶石鏈
  for (let y = 128; y <= 430; y += 38) {
    s += use('dm', `translate(19 ${y})`) + use('dm', `translate(281 ${y})`);
    if ((y - 128) % 76 === 0) s += use('gb', `translate(19 ${y + 19})`) + use('gb', `translate(281 ${y + 19})`);
  }
  // 拱頂寶石徽章
  s += `<circle cx="150" cy="24" r="12" fill="${WINED}" stroke="url(#gv)" stroke-width="2.4"/>` + star(150, 24, 9, { n: 8, fill: 'url(#gv)', inner: 0.42, sw: 0.5 }) + gem(150, 24, 3);
  // 四角百合紋
  s += use('fl', 'translate(17 17) rotate(45)') + use('fl', 'translate(283 17) rotate(135)') + use('fl', 'translate(17 483) rotate(-45)') + use('fl', 'translate(283 483) rotate(-135)');
  // 底部徽章匾額
  s += line('M40,471 H96 M204,471 H260', 1.2, 'url(#gh)') + line('M46,476 H96 M204,476 H254', 0.6, GOLD);
  s += use('cu', 'translate(96 473) scale(-0.55 0.55)') + use('cu', 'translate(204 473) scale(0.55)');
  s += `<rect x="104" y="458" width="92" height="30" rx="8" fill="url(#gv)"/><rect x="107" y="461" width="86" height="24" rx="6" fill="${WINE}"/><rect x="107" y="461" width="86" height="24" rx="6" fill="url(#damask)"/><rect x="109.5" y="463.5" width="81" height="19" rx="4.5" fill="none" stroke="${GOLDL}" stroke-width="0.6"/>`;
  let badge = '';
  if (numeral !== null) badge = roman(numeral, 150, 473, 11, GOLDL, 1.7);
  else if (suit) {
    const e = SUIT_EMB[suit]();
    badge = g('translate(150 473)', e) + (court ? g('translate(126 476)', crownShape(0, 0, 12, GOLDL)) + g('translate(174 476)', crownShape(0, 0, 12, GOLDL)) : star(124, 473, 3.5, { n: 4, fill: GOLDL, inner: 0.3, sw: 0.4 }) + star(176, 473, 3.5, { n: 4, fill: GOLDL, inner: 0.3, sw: 0.4 }));
  }
  return s + badge;
}

// 輸出前壓縮：數字取一位小數、移除多餘空白與可繼承的重複屬性
export function minify(svg) {
  return svg
    .replace(/-?\d+\.\d{2,}/g, (m) => { const v = Math.round(parseFloat(m) * 10) / 10; return String(v === 0 ? 0 : v); })
    .replace(/ stroke-linejoin="round"/g, '')
    .replace(/ stroke-linecap="round"/g, '')
    .replace(/ stroke="none"/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\n/g, '')
    .replace(/\s{2,}/g, ' ');
}
export function svgDoc(body) {
  return minify(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500" viewBox="0 0 300 500" stroke-linejoin="round" stroke-linecap="round">${defs()}${body}</svg>`) + '\n';
}
