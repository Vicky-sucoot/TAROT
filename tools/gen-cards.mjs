// 產生 78 張原創牌圖與牌背：node tools/gen-cards.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from './art-lib.mjs';

const { C, g, tr, P, Ci, El, L, R, line, sky, ground, hills, mountains, sea, pool, path, cloud, sun, moon, star, tree, pillar, tower, castle,
  crownShape, lemniscate, town, vines, swag, fence, islands, farHills, rose, lily, flowers, wheat, sunflower, bird, birdV, wings, rainbow, lightning, flame, wreath, ribbon, I, figure, backFigure,
  lion, dog, horse, sphinx, crayfish, snake, salamander, throne, table, boat, ship, bed, coffin, wall, archway, window, handFromCloud, frame, svgDoc } = A;
const { INK, WINE, WINED, GOLD, GOLDL, PARCH, PARCH2, SKIN, WHITE, DARK, BLUE, BLUEL, GREEN, GREENL, STONE, STONED, BROWN, ROSE, SAND, NIGHT } = C;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'cards');
mkdirSync(join(out, 'rv'), { recursive: true });

const stars = (pts, r = 4) => pts.map(([x, y]) => star(x, y, r, { n: 8, fill: GOLDL, sw: 0.6 })).join('');

// ───────────── 大阿爾克那 ─────────────
const MAJOR = {
  m00: () => sky() + sun(232, 96, 24) + mountains(330, [[70, 110, 60], [140, 80, 50], [220, 130, 70]]) +
    P('M10,380 Q120,350 200,372 L214,380 L222,482 H10Z', PARCH2, { hatch: 'dots' }) + P('M200,372 L214,380 L232,482 H290 V420 Q250,420 214,380Z', STONED, { hatch: 'hx' }) +
    figure({ x: 150, y: 384, s: 1.05, robe: WINE, cloak: GOLDL, head: 'feather', armL: 150, armR: 70, holdL: { item: I.bindle(), rot: 20 }, holdR: I.rose(), pose: 'walk', tilt: 6 }) +
    dog(196, 400, 0.8, WHITE, { howl: true }),
  m01: () => sky() + flowers(44, 8, 34, 266) + lemniscate(150, 74, 36) +
    figure({ x: 150, y: 360, s: 1.15, robe: WHITE, cloak: WINE, armL: 160, armR: 30, holdL: { item: I.wand(56), rot: 0 }, head: 'none' }) +
    table(150, 350, 190) + g('translate(92 350)', I.cup(0.8)) + g('translate(130 348)', I.sword(40)) + g('translate(170 340)', I.pentacle(10)) + g('translate(208 350) rotate(70)', I.wand(36)) +
    flowers(462, 6, 40, 260, 'lily'),
  m02: () => sky({ night: true }) + `<rect x="60" y="80" width="180" height="360" fill="${GOLDL}" opacity="0.85"/>` +
    [...Array(18)].map((_, i) => Ci(76 + (i % 6) * 30, 110 + Math.floor(i / 6) * 70, 7, ROSE, { sw: 0.8 })).join('') +
    pillar(50, 70, 470, 38, DARK) + pillar(250, 70, 470, 38, WHITE) +
    figure({ x: 150, y: 440, s: 1.2, pose: 'seat', robe: BLUE, head: 'veil', head2: 'moon', veilColor: WHITE, armL: 40, armR: 40, holdL: { item: I.scroll(), rot: 0 } }) +
    line('M150,345 V375 M140,358 H160', 2.4, WHITE) + moon(150, 456, 16, { fill: GOLDL, dir: -1 }),
  m03: () => sky() + mountains(300, [[60, 60, 50]], STONE, false) + tree(70, 320, 1.2) + tree(240, 316, 1.4) +
    `<path d="M30,300 q8,60 -4,180" stroke="${BLUEL}" stroke-width="12" fill="none"/>` +
    throne(150, 420, 100, 150, WINE) +
    figure({ x: 150, y: 420, s: 1.2, pose: 'seat', robe: WHITE, head: 'crownstars', armL: 40, armR: 150, holdR: { item: I.ankh(60) } }) +
    [...Array(9)].map((_, i) => wheat(40 + i * 28, 482, 1.1)).join('') +
    P('M214,400 q-14,-18 0,-28 q14,10 28,0 q14,10 0,28 l-14,18Z', GOLDL, { hatch: 'h' }) + Ci(228, 392, 5, 'none', { hatch: null, sw: 1.4 }) + line('M228,397 V408 M223,403 H233', 1.4),
  m04: () => sky() + mountains(330, [[50, 150, 60], [150, 120, 70], [250, 160, 60]], '#b06a4f', false) +
    throne(150, 450, 150, 230, STONE, { deco: line('M-64,-210 q-16,-6 -12,-20 q10,2 12,12 M64,-210 q16,-6 12,-20 q-10,2 -12,12', 3, GOLD) + line('M-75,-40 q-14,-4 -10,-14 M75,-40 q14,-4 10,-14', 3, GOLD) }) +
    figure({ x: 150, y: 450, s: 1.35, pose: 'seat', robe: WINE, head: 'crown', armL: 60, armR: 130, holdL: { item: I.orb() }, holdR: { item: I.ankh(60) } }) +
    R(100, 450, 100, 32, STONED, { hatch: 'hx' }),
  m05: () => sky() + pillar(50, 60, 440, 40, STONE) + pillar(250, 60, 440, 40, STONE) +
    throne(150, 420, 110, 170, STONED) +
    figure({ x: 150, y: 420, s: 1.3, pose: 'seat', robe: WINE, cloak: WHITE, head: 'triple', armL: 40, armR: 150, holdL: { item: I.triplecross(110), rot: 0 } }) +
    g('translate(140 460) rotate(-35)', I.key(0.9)) + g('translate(160 460) rotate(35)', I.key(0.9, WHITE)) +
    backFigure(88, 482, 1.1, WINE) + backFigure(212, 482, 1.1, WHITE),
  m06: () => sky() + sun(150, 76, 24) + cloud(150, 168, 170, WHITE) +
    wings(150, 150, 0.9, WINE) + figure({ x: 150, y: 220, s: 0.75, robe: '#8a5e8f', head: 'none', armL: 120, armR: 120, hair: '#c57a3a' }) +
    mountains(370, [[150, 120, 50]], STONE) + hills(400, GREENL) +
    tree(55, 400, 0.9, GREEN) + `<path d="M48,330 q-8,20 6,40" stroke="${GREEN}" stroke-width="4" fill="none"/>` +
    [...Array(5)].map((_, i) => flame(238 + (i % 3) * 14 - 14, 330 + Math.floor(i / 3) * 16, 0.6)).join('') + line('M245,400 V360', 4, BROWN) +
    figure({ x: 96, y: 470, s: 0.9, robe: SKIN, belt: null, armL: 20, armR: 40 }) + figure({ x: 204, y: 470, s: 0.9, robe: SKIN, belt: null, armL: 40, armR: 20, hairLong: true }),
  m07: () => sky() + castle(60, 300, 1.2) + castle(240, 300, 1.3) + sea(300, BLUEL, 330) + ground(330, PARCH2) +
    P('M80,180 Q150,150 220,180 V196 Q150,166 80,196Z', BLUE, { hatch: 'hx' }) + stars([[110, 178], [150, 168], [190, 178]], 4) +
    line('M84,192 V330 M216,192 V330', 4, GOLD) +
    figure({ x: 150, y: 320, s: 1.1, robe: STONE, head: 'crown', armL: 40, armR: 60, holdR: { item: I.wand(60) } }) +
    R(78, 290, 144, 90, STONE, { hatch: 'hx' }) + P('M140,320 q10,-14 20,0 q-10,12 -20,0Z', GOLDL, { hatch: null }) + wings(150, 336, 0.25, GOLDL) +
    Ci(86, 384, 14, BROWN, { hatch: 'hx' }) + Ci(214, 384, 14, BROWN, { hatch: 'hx' }) +
    sphinx(104, 450, 0.9, DARK) + sphinx(196, 450, 0.9, WHITE, true),
  m08: () => sky() + mountains(320, [[150, 110, 90]], BLUEL) + hills(380, GREENL) + lemniscate(118, 120, 34) +
    figure({ x: 118, y: 450, s: 1.3, robe: WHITE, head: 'roses', armL: 30, armR: 80, belt: ROSE, hairLong: true }) +
    lion(205, 455, 1.05, true) + flowers(470, 4, 40, 110),
  m09: () => sky({ night: true }) + stars([[60, 70], [250, 90], [210, 50], [90, 140]], 3) +
    P('M10,430 L120,380 L170,400 L290,360 V490 H10Z', WHITE, { hatch: 'hl' }) +
    figure({ x: 150, y: 430, s: 1.45, robe: STONE, cloak: STONED, head: 'hood', armL: 20, armR: 125, holdL: { item: I.staff(150), rot: -4 }, holdR: { item: I.lantern(), rot: -125 }, hair: WHITE }),
  m10: () => sky() + cloud(56, 70, 60) + cloud(244, 70, 60) + cloud(56, 450, 60) + cloud(244, 450, 60) +
    Ci(48, 54, 9, SKIN) + wings(48, 60, 0.2, WHITE) + P('M236,50 q8,-10 16,0 l-8,10Z', BROWN, { hatch: 'h' }) + wings(244, 58, 0.2, BROWN) +
    El(48, 436, 12, 9, BROWN, { hatch: 'h' }) + line('M38,430 q-6,-6 -2,-10 M58,430 q6,-6 2,-10', 2) + Ci(244, 436, 11, GOLDL, { hatch: 'hx' }) +
    Ci(150, 260, 100, GOLDL, { hatch: 'h' }) + Ci(150, 260, 78, BLUEL, { hatch: 'hl' }) + Ci(150, 260, 38, GOLDL, { hatch: 'h' }) + Ci(150, 260, 12, WINE) +
    [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return L(150 + Math.cos(a) * 12, 260 + Math.sin(a) * 12, 150 + Math.cos(a) * 100, 260 + Math.sin(a) * 100, 1.6); }).join('') +
    [...Array(4)].map((_, i) => { const a = i * Math.PI / 2 + Math.PI / 4; return star(150 + Math.cos(a) * 89, 260 + Math.sin(a) * 89, 6, { n: 4, fill: WINE }); }).join('') +
    sphinx(150, 162, 0.55, STONE) + g('translate(166 136)', I.sword(30)) + snake(52, 200, 0.9) +
    figure({ x: 250, y: 400, s: 0.6, robe: '#b0603e', head: 'none', armL: 120, armR: 30 }) + P('M244,320 l2,-14 l6,10 l12,2 l-6,6Z', '#b0603e', { hatch: null, sw: 0.8 }),
  m11: () => sky() + `<rect x="40" y="70" width="220" height="340" fill="${WINE}"/><rect x="40" y="70" width="220" height="340" fill="url(#hx)"/>` +
    pillar(46, 60, 420, 30, STONE) + pillar(254, 60, 420, 30, STONE) + R(18, 410, 264, 72, STONE, { hatch: 'hx' }) +
    throne(150, 420, 110, 170, STONED) +
    figure({ x: 150, y: 420, s: 1.3, pose: 'seat', robe: WINE, cloak: GREEN, head: 'crown', armL: 75, armR: 170, holdL: { item: I.scales(), rot: -75 }, holdR: { item: I.sword(110), rot: -170 + 180 } }),
  m12: () => sky() + hills(470, GREENL) + P('M60,480 V60 M240,480 V60', 'none', { hatch: null, sw: 1 }) +
    R(55, 60, 14, 420, BROWN, { hatch: 'h' }) + R(231, 60, 14, 420, BROWN, { hatch: 'h' }) + R(50, 60, 200, 14, BROWN, { hatch: 'h' }) +
    El(62, 120, 6, 12, GREENL, { hatch: null, rot: -30 }) + El(238, 160, 6, 12, GREENL, { hatch: null, rot: 30 }) + El(120, 56, 6, 12, GREENL, { hatch: null, rot: 70 }) + El(200, 56, 6, 12, GREENL, { hatch: null, rot: -60 }) +
    line('M150,74 V96', 1.6) +
    figure({ x: 150, y: 96, s: 1.6, rot: 180, robe: BLUE, head: 'halo', armL: -10, armR: -10, belt: GOLD }) +
    line('M146,100 L134,124 L150,130', 6, INK) + line('M146,100 L134,124 L150,130', 3.6, WINE),
  m13: () => sky() + sun(220, 300, 26) + tower(196, 320, 22, 60, STONED) + tower(250, 320, 22, 60, STONED) + sea(318, BLUEL, 344) + ground(344, PARCH2) +
    horse(140, 440, 1.25, { fill: WHITE, pose: 'walk', flip: true, blanket: DARK, rider: figure({ x: 0, y: -40, s: 0.85, pose: 'ride', robe: DARK, skull: true, head: 'none', armL: 60, armR: 30, holdL: { item: I.flag(DARK, 'rose'), rot: 0 } }) }) +
    figure({ x: 228, y: 476, s: 0.85, rot: -90, robe: WINE, head: 'crown', armL: 30, armR: 30 }) + figure({ x: 220, y: 466, s: 0.6, pose: 'kneel', robe: WHITE, head: 'none', armL: 150, armR: 150 }),
  m14: () => sky() + path('M150,470 Q220,420 210,360 T250,300') + mountains(310, [[250, 70, 40]], STONE, false) + sun(250, 236, 14) +
    pool(84, 456, 70, 20) + [...Array(3)].map((_, i) => lily(220 + i * 18, 470, 0.9)).join('') +
    wings(150, 230, 1.1, WINE) +
    figure({ x: 150, y: 450, s: 1.45, robe: WHITE, head: 'sunmark', armL: 80, armR: 50, holdL: { item: I.cup(0.7), rot: -20 }, holdR: { item: I.cup(0.7), rot: 40 }, hair: GOLDL }) +
    P('M150,298 l-10,18 h20Z', GOLDL, { hatch: null }) + line('M110,370 Q140,380 160,404', 2.4, BLUE, ' opacity="0.9"'),
  m15: () => sky({ night: true }) + `<rect x="18" y="18" width="264" height="464" fill="${DARK}" opacity="0.5"/>` +
    star(150, 82, 20, { n: 5, fill: GOLDL, inner: 0.38, sw: 1.2 }) + wings(150, 200, 1.2, '#4a3a3a') +
    figure({ x: 150, y: 300, s: 1.25, robe: '#7d5a42', head: 'horns', armL: 150, armR: 30, holdR: { item: I.torch(), rot: 180 }, belt: null }) +
    R(100, 300, 100, 60, STONED, { hatch: 'hx' }) + line('M110,330 Q80,380 84,420 M190,330 Q220,380 216,420', 1.6, GOLDL, ' stroke-dasharray="3 2"') +
    figure({ x: 84, y: 470, s: 0.85, robe: SKIN, belt: null, head: 'horns', armL: 20, armR: 20 }) + figure({ x: 216, y: 470, s: 0.85, robe: SKIN, belt: null, head: 'horns', armL: 20, armR: 20, hairLong: true }),
  m16: () => sky({ night: true }) + cloud(70, 70, 80, STONE) + cloud(220, 56, 90, STONE) +
    P('M80,482 L110,420 L150,410 L190,420 L220,482Z', STONED, { hatch: 'hx' }) + tower(150, 420, 74, 290, STONE, { windows: 3 }) +
    lightning(210, 60, 1) + crownShape(196, 120, 40) +
    flame(132, 200, 1) + flame(168, 250, 1) + flame(130, 330, 1.1) + flame(150, 128, 1.3) +
    [...Array(8)].map((_, i) => flame(40 + (i % 4) * 66, 160 + Math.floor(i / 4) * 140, 0.5)).join('') +
    figure({ x: 60, y: 330, s: 0.7, rot: 160, robe: WINE, head: 'crown', armL: 150, armR: 120 }) + figure({ x: 246, y: 380, s: 0.7, rot: -150, robe: BLUE, armL: 120, armR: 150 }),
  m17: () => sky({ night: true }) + star(150, 100, 42, { n: 8, fill: GOLDL, inner: 0.36 }) +
    stars([[60, 60], [240, 60], [50, 150], [250, 150], [80, 220], [220, 220], [150, 190]], 9) +
    hills(380, GREEN) + tree(240, 370, 0.7) + bird(236, 300, 0.7) + pool(110, 450, 100, 30) +
    figure({ x: 160, y: 430, s: 1.15, pose: 'kneel', robe: SKIN, belt: null, armL: 60, armR: 70, holdL: { item: I.jug(), rot: -100 }, holdR: { item: I.jug(), rot: 110 }, hairLong: true, hair: GOLDL }) +
    line('M108,370 q-12,30 -16,70', 2, BLUE) + line('M212,386 q12,30 20,56', 2, BLUE),
  m18: () => sky({ night: true }) + sun(150, 130, 46, { rays: 32 }) + moon(150, 130, 38, { fill: WHITE }) +
    [...Array(9)].map((_, i) => P(`M${70 + i * 20},${210 + (i % 3) * 10} q-4,6 0,10 q4,-4 0,-10Z`, GOLDL, { hatch: null, sw: 0.6 })).join('') +
    tower(48, 330, 34, 110, STONE, { windows: 2 }) + tower(252, 330, 34, 110, STONE, { windows: 2 }) + mountains(330, [[150, 50, 70]], BLUEL, false) + ground(330, GREENL) +
    path('M150,450 Q120,400 160,370 T150,320') + dog(90, 410, 0.9, WHITE, { howl: true }) + dog(210, 410, 0.9, STONED, { howl: true, flip: true, ears: 'point' }) +
    pool(150, 466, 120, 26) + crayfish(150, 452, 0.9),
  m19: () => sky() + sun(150, 130, 54, { face: true, rays: 24 }) + wall(300, 50) +
    sunflower(54, 300, 1) + sunflower(98, 300, 1.1) + sunflower(206, 300, 1.1) + sunflower(250, 300, 1) + ground(350, GREENL) +
    horse(150, 470, 1.3, { fill: WHITE, pose: 'walk', blanket: null, rider: figure({ x: 0, y: -40, s: 0.7, pose: 'ride', robe: SKIN, belt: null, head: 'roses', armL: 150, armR: 60, holdL: { item: I.banner(WINE), rot: 30 }, hair: GOLDL }) }),
  m20: () => sky() + mountains(380, [[50, 80, 40], [250, 90, 40]], WHITE, false) + sea(380, BLUEL) +
    cloud(150, 200, 200) + wings(150, 150, 1.2, WINE) + figure({ x: 150, y: 230, s: 0.85, robe: WHITE, head: 'none', armL: 30, armR: 80, holdR: { item: I.trumpet(), rot: -60 }, hair: GOLDL }) +
    g('translate(196 140) rotate(-30)', P('M0,0 h30 v20 h-30Z', WHITE, { hatch: null }) + line('M15,2 V18 M5,10 H25', 2.6, WINE)) +
    coffin(80, 450, 70) + coffin(220, 450, 70) + coffin(150, 470, 70) +
    figure({ x: 80, y: 440, s: 0.7, robe: STONE, belt: null, armL: 150, armR: 150 }) + figure({ x: 220, y: 440, s: 0.7, robe: SKIN, belt: null, armL: 150, armR: 150, hairLong: true }) + figure({ x: 150, y: 462, s: 0.6, robe: SKIN, belt: null, armL: 160, armR: 160 }),
  m21: () => sky() + cloud(52, 76, 60) + cloud(248, 76, 60) + cloud(52, 452, 60) + cloud(248, 452, 60) +
    Ci(52, 60, 10, SKIN) + wings(52, 66, 0.18, WHITE) + P('M240,54 q8,-12 16,0 l-8,14Z', BROWN, { hatch: 'h' }) + wings(248, 62, 0.18, BROWN) +
    El(52, 438, 12, 9, BROWN, { hatch: 'h' }) + line('M42,432 q-6,-6 -2,-10 M62,432 q6,-6 2,-10', 2) + Ci(248, 438, 11, GOLDL, { hatch: 'hx' }) +
    wreath(150, 262, 78, 168) + ribbon(150, 96, 16) + ribbon(150, 430, 16) +
    figure({ x: 150, y: 360, s: 1.15, robe: SKIN, cloak: '#7a4e8a', belt: null, armL: 120, armR: 60, holdL: { item: I.wand(46) }, holdR: { item: I.wand(46) }, hairLong: true, hair: BROWN }) +
    line('M150,360 L138,386 M150,360 L170,370 L160,388', 4, INK) + line('M150,360 L138,386 M150,360 L170,370 L160,388', 2.4, SKIN)
};

// ───────────── 小阿爾克那 ─────────────
const EMB = { wands: (s = 1) => I.wand(80 * s), cups: (s = 1) => I.cup(0.9 * s), swords: (s = 1) => I.sword(80 * s), pentacles: (s = 1) => I.pentacle(13 * s) };
const place = (suit, x, y, s = 1, rot = 0) => g(`translate(${x} ${y}) rotate(${rot})`, EMB[suit](s));

const BG = {
  wands: () => sky() + mountains(360, [[80, 50, 40], [190, 70, 50]], SAND, false) + ground(370, SAND),
  cups: () => sky() + sea(360, BLUEL) + ground(400, GREENL),
  swords: () => sky() + cloud(60, 90, 70) + cloud(240, 120, 80) + birdV(200, 70) + birdV(220, 84, 0.8) + ground(380, PARCH2),
  pentacles: () => sky() + hills(380, GREENL) + ground(410, GREENL) + tree(50, 400, 0.6) + tree(250, 404, 0.7)
};

const MINOR = {
  // ── 權杖 ──
  w01: () => sky() + mountains(380, [[90, 80, 60], [200, 100, 70]], STONE) + castle(220, 380, 0.7) + hills(420, GREENL) + handFromCloud(-1, 250, I.wand(190)),
  w02: () => sky() + sea(330, BLUEL, 360) + ground(360, PARCH2) + R(18, 380, 264, 102, STONE, { hatch: 'hx' }) +
    place('wands', 60, 470, 2.1) + figure({ x: 160, y: 420, s: 1.3, robe: BROWN, head: 'feather', cloak: WINE, armL: 50, armR: 30, holdL: { item: I.globe(), rot: -50 }, holdR: { item: I.wand(150) } }),
  w03: () => sky() + sea(300, GOLDL) + ship(110, 330, 1.2) + ship(200, 320) + mountains(300, [[250, 50, 40]], STONE, false) + P('M10,400 Q150,360 290,400 V490 H10Z', STONED, { hatch: 'hx' }) +
    place('wands', 60, 470, 2) + place('wands', 240, 470, 2) + backFigureLarge(150, 470, 1.6, WINE) + g('translate(184 420)', I.wand(160)),
  w04: () => sky() + castle(150, 360, 1.3) + ground(370, PARCH2) + figure({ x: 120, y: 420, s: 0.8, robe: WINE, armL: 150, armR: 150, holdL: { item: rose(0, -6, 6) } }) + figure({ x: 180, y: 420, s: 0.8, robe: BLUE, armL: 150, armR: 150, hairLong: true }) +
    place('wands', 40, 480, 2.2) + place('wands', 90, 480, 2.2) + place('wands', 210, 480, 2.2) + place('wands', 260, 480, 2.2) +
    line('M40,320 Q65,350 90,320 M210,320 Q235,350 260,320 M90,320 Q150,350 210,320', 4, GREEN) + [60, 150, 240].map((x) => rose(x, 336, 5)).join(''),
  w05: () => BG.wands() + [70, 115, 160, 205, 245].map((x, i) => figure({ x, y: 460, s: 0.8, robe: [WINE, BLUE, GREEN, BROWN, STONE][i], armL: 140, armR: 140, holdR: { item: I.wand(110), rot: (i % 2 ? 1 : -1) * 30 } })).join(''),
  w06: () => sky() + ground(420, PARCH2) + figure({ x: 60, y: 482, s: 0.8, robe: STONE, armL: 160, armR: 10, holdL: { item: I.wand(110) } }) + figure({ x: 250, y: 482, s: 0.8, robe: BROWN, armL: 10, armR: 160, holdR: { item: I.wand(110) } }) +
    horse(150, 470, 1.25, { fill: WHITE, pose: 'walk', blanket: GREEN, rider: figure({ x: 0, y: -40, s: 0.8, pose: 'ride', robe: WINE, head: 'laurel', armL: 40, armR: 170, holdR: { item: I.wand(110) + wreath(0, -82, 12, 12) } }) }) +
    place('wands', 40, 470, 1.7) + place('wands', 270, 470, 1.7) + place('wands', 100, 470, 1.6),
  w07: () => sky() + hills(360, GREENL) + P('M120,380 L200,330 L290,350 V490 H120Z', GREEN, { hatch: 'hl' }) +
    figure({ x: 200, y: 340, s: 1.2, robe: GREEN, cloak: WINE, armL: 110, armR: 120, holdL: { item: I.wand(150), rot: 60 } }) +
    [30, 60, 90, 120, 150, 180].map((x, i) => g(`translate(${x} ${490 - (i % 2) * 20}) rotate(${-20 + i * 3})`, I.wand(110))).join(''),
  w08: () => sky() + hills(380, GREENL) + `<path d="M30,440 q100,-30 240,0" stroke="${BLUE}" stroke-width="10" fill="none"/>` + castle(220, 400, 0.6) +
    [...Array(8)].map((_, i) => g(`translate(${60 + i * 22} ${120 + i * 26}) rotate(55)`, I.wand(150))).join(''),
  w09: () => sky() + ground(420, PARCH2) + [...Array(8)].map((_, i) => place('wands', 40 + i * 30, 470, 2.1)).join('') +
    figure({ x: 210, y: 460, s: 1.2, robe: BROWN, head: 'none', armL: 30, armR: 140, holdL: { item: I.wand(140) } }) + line('M196,334 q14,-8 28,0', 4, WHITE),
  w10: () => sky() + castle(240, 360, 0.8) + hills(370, GREENL) + ground(410, PARCH2) +
    figure({ x: 130, y: 460, s: 1.2, robe: BROWN, armL: 150, armR: 150, tilt: -8 }) +
    [...Array(10)].map((_, i) => g(`translate(${86 + i * 8} ${300 + Math.abs(i - 4.5) * 4}) rotate(${-12 + i * 3})`, I.wand(120))).join(''),
  w11: () => BG.wands() + salamander(80, 440) + salamander(220, 460) + figure({ x: 150, y: 450, s: 1.4, robe: GOLDL, cloak: WINE, head: 'feather', armL: 60, armR: 20, holdL: { item: I.wand(170) } }),
  w12: () => BG.wands() + horse(150, 470, 1.4, { fill: '#c78a4a', pose: 'rear', blanket: WINE, rider: figure({ x: 0, y: -40, s: 0.85, pose: 'ride', robe: GOLDL, head: 'helmet', armL: 60, armR: 30, holdL: { item: I.wand(130), rot: 20 } }) }) + salamander(60, 470),
  w13: () => sky() + mountains(360, [[60, 60, 40], [250, 80, 50]], SAND, false) +
    throne(150, 450, 120, 220, GOLDL, { deco: lion(-30, -150, 0.35) + lion(30, -150, 0.35, true) }) + sunflower(150, 300, 0.8) +
    figure({ x: 150, y: 450, s: 1.35, pose: 'seat', robe: GOLDL, head: 'crown', armL: 60, armR: 130, holdL: { item: sunflower(0, 0, 0.6) }, holdR: { item: I.wand(150) } }) + dog(150, 482, 0.6, DARK, { ears: 'point' }),
  w14: () => sky() + mountains(340, [[60, 60, 40]], SAND, false) +
    throne(150, 450, 130, 240, WINE, { deco: [...Array(6)].map((_, i) => salamander(-40 + (i % 3) * 40, -200 + Math.floor(i / 3) * 40, 0.8)).join('') }) +
    figure({ x: 150, y: 450, s: 1.4, pose: 'seat', robe: '#b0603e', cloak: GOLDL, head: 'crown', armL: 40, armR: 140, holdR: { item: I.wand(160) } }) + salamander(230, 476),

  // ── 聖杯 ──
  c01: () => sky() + pool(150, 450, 140, 30) + [...Array(5)].map((_, i) => line(`M${120 + i * 15},300 Q${100 + i * 25},380 ${90 + i * 30},440`, 1.6, BLUE)).join('') +
    [...Array(8)].map((_, i) => lily(40 + i * 32, 482, 0.8)).join('') + handFromCloud(1, 250, I.cup(2.4)) + g('translate(150 160)', bird(-14, 0, 0.9) + line('M2,4 v10', 1)),
  c02: () => sky() + hills(380, GREENL) + castle(150, 380, 0.8) +
    figure({ x: 90, y: 460, s: 1.3, robe: BLUE, head: 'laurel', armL: 20, armR: 70, holdR: { item: I.cup(0.9) } }) + figure({ x: 210, y: 460, s: 1.3, robe: WINE, head: 'roses', armL: 70, armR: 20, holdL: { item: I.cup(0.9) }, hairLong: true }) +
    line('M150,120 V240', 3, GOLD) + snake(150, 124, 0.3) + wings(150, 160, 0.3, WINE) + Ci(150, 120, 12, GOLDL),
  c03: () => sky() + ground(430, GREENL) + [...Array(5)].map((_, i) => wheat(40 + i * 55, 482, 1)).join('') +
    figure({ x: 95, y: 440, s: 1.1, robe: WINE, head: 'roses', armL: 160, armR: 80, holdL: { item: I.cup(0.8) }, hairLong: true }) +
    figure({ x: 150, y: 450, s: 1.1, robe: GOLDL, head: 'roses', armL: 150, armR: 150, holdR: { item: I.cup(0.8) }, hairLong: true }) +
    figure({ x: 205, y: 440, s: 1.1, robe: WHITE, head: 'roses', armL: 80, armR: 160, holdR: { item: I.cup(0.8) }, hairLong: true }),
  c04: () => sky() + hills(380, GREENL) + tree(110, 420, 1.6) + handFromCloud(1, 190, I.cup(1.3)) +
    figure({ x: 130, y: 450, s: 1.2, pose: 'seat', robe: GREEN, armL: 10, armR: 10 }) + line('M116,382 L144,390 M144,382 L116,390', 4, GREEN) +
    place('cups', 190, 470, 1.4) + place('cups', 225, 470, 1.4) + place('cups', 260, 470, 1.4),
  c05: () => sky() + castle(240, 320, 0.8) + `<path d="M18,350 q140,-20 264,10" stroke="${BLUEL}" stroke-width="30" fill="none"/>` + archway(200, 360, 60, 30, STONE) + ground(380, PARCH2) +
    figure({ x: 130, y: 450, s: 1.4, robe: DARK, cloak: DARK, head: 'hood', armL: 10, armR: 10 }) +
    g('translate(64 470) rotate(-80)', I.cup(1.2)) + g('translate(108 476) rotate(70)', I.cup(1.2)) + g('translate(150 476) rotate(-90)', I.cup(1.2)) + place('cups', 210, 470, 1.3) + place('cups', 252, 470, 1.3),
  c06: () => sky() + castle(230, 320, 1) + ground(340, PARCH2) + R(18, 400, 264, 82, STONE, { hatch: 'hx' }) +
    figure({ x: 170, y: 420, s: 0.95, robe: WINE, head: 'none', armL: 60, armR: 20, holdL: { item: I.cup(0.7) + rose(0, -32, 5, WHITE) } }) + figure({ x: 110, y: 420, s: 0.8, robe: GOLDL, armL: 20, armR: 50, hairLong: true }) +
    [50, 90, 210, 250].map((x) => place('cups', x, 470, 1.2) + rose(x, 438, 5, WHITE)).join('') + place('cups', 70, 405, 1.2) + rose(70, 373, 5, WHITE),
  c07: () => sky() + cloud(150, 330, 260, WHITE) + [[60, 150], [110, 150], [160, 150], [210, 150], [70, 270], [140, 270], [210, 270]].map(([x, y], i) =>
    place('cups', x + 16, y + 50, 1.3) + [Ci(x + 16, y + 6, 6, SKIN), I.wand(0) && g(`translate(${x + 16} ${y + 6})`, snake(0, -10, 0.15)), g(`translate(${x + 16} ${y + 8})`, castle(0, 6, 0.3)), g(`translate(${x + 16} ${y + 10})`, I.pentacle(6)), g(`translate(${x + 16} ${y + 10})`, crownShape(0, 0, 14)), wreath(x + 16, y + 6, 6, 6), g(`translate(${x + 16} ${y + 6})`, star(0, 0, 6))][i]).join('') +
    backFigure(150, 482, 1.6, DARK),
  c08: () => sky({ night: true }) + sun(150, 90, 26, { face: false }) + moon(150, 90, 22, { fill: WHITE }) + mountains(340, [[100, 80, 60], [220, 110, 70]], STONE) + ground(350, PARCH2) + `<path d="M18,420 q140,-20 264,10" stroke="${BLUEL}" stroke-width="20" fill="none"/>` +
    figure({ x: 200, y: 380, s: 0.9, robe: WINE, head: 'hood', armL: 10, armR: 20, holdR: { item: I.staff(90) } }) +
    [[40, 470], [75, 470], [110, 470], [145, 470], [180, 470], [57, 440], [92, 440], [127, 440]].map(([x, y]) => place('cups', x, y, 1.2)).join(''),
  c09: () => sky() + `<rect x="30" y="230" width="240" height="40" fill="${BLUE}"/><rect x="30" y="230" width="240" height="40" fill="url(#hx)"/>` +
    [...Array(9)].map((_, i) => place('cups', 46 + i * 26, 230 - Math.sin((i / 8) * Math.PI) * 24, 1)).join('') +
    figure({ x: 150, y: 430, s: 1.4, pose: 'seat', robe: WHITE, cloak: WINE, head: 'crown', armL: 70, armR: 70 }) + line('M122,370 L178,374 M178,370 L122,374', 5, WHITE) + R(110, 430, 80, 52, BROWN, { hatch: 'h' }),
  c10: () => sky() + rainbow(150, 230, 120) + [...Array(10)].map((_, i) => { const a = Math.PI + (i / 9) * Math.PI; return place('cups', 150 + Math.cos(a) * 104, 240 + Math.sin(a) * 104, 0.9); }).join('') +
    hills(360, GREENL) + `<path d="M18,380 q140,-20 264,10" stroke="${BLUEL}" stroke-width="12" fill="none"/>` + castle(220, 370, 0.6) + ground(400, GREENL) +
    figure({ x: 70, y: 470, s: 1.05, robe: BLUE, armL: 150, armR: 80 }) + figure({ x: 120, y: 470, s: 1.05, robe: WINE, armL: 80, armR: 150, hairLong: true }) +
    figure({ x: 200, y: 474, s: 0.65, robe: GOLDL, armL: 150, armR: 40 }) + figure({ x: 240, y: 474, s: 0.6, robe: WHITE, armL: 40, armR: 150, hairLong: true }),
  c11: () => BG.cups() + figure({ x: 150, y: 460, s: 1.4, robe: '#8ea6b0', cloak: WINE, head: 'feather', armL: 40, armR: 60, holdR: { item: I.cup(1.2) + g('translate(-2 -40)', P('M0,0 q6,-10 12,-4 q4,-4 6,2 q-6,8 -18,2Z', '#c5875a', { hatch: null, sw: 0.8 })) } }),
  c12: () => sky() + hills(360, GREENL) + `<path d="M18,420 q140,-10 264,6" stroke="${BLUEL}" stroke-width="16" fill="none"/>` + tree(250, 360, 0.6) + ground(430, GREENL) +
    horse(150, 470, 1.4, { fill: STONE, pose: 'walk', blanket: BLUE, rider: figure({ x: 0, y: -40, s: 0.85, pose: 'ride', robe: STONE, head: 'helmet', armL: 20, armR: 70, holdR: { item: I.cup(1) } }) }),
  c13: () => BG.cups() + throne(150, 440, 120, 200, STONE, { deco: Ci(-40, -170, 8, WHITE) + Ci(40, -170, 8, WHITE) }) +
    figure({ x: 150, y: 440, s: 1.35, pose: 'seat', robe: '#8ea6b0', cloak: WHITE, head: 'crown', armL: 50, armR: 50, holdL: { item: g('translate(14 -6)', I.cup(1.2)) } }) +
    `<rect x="18" y="440" width="264" height="42" fill="${STONED}"/><rect x="18" y="440" width="264" height="42" fill="url(#dots)"/>`,
  c14: () => sky() + sea(260, BLUEL) + ship(60, 290, 1.2) + P('M240,300 q10,-20 20,0 q-10,10 -20,0Z', DARK, { hatch: null }) +
    R(90, 400, 120, 82, STONE, { hatch: 'hx' }) + throne(150, 410, 110, 190, STONE) +
    figure({ x: 150, y: 410, s: 1.35, pose: 'seat', robe: BLUE, cloak: GOLDL, head: 'crown', armL: 140, armR: 40, holdL: { item: I.ankh(60) }, holdR: { item: I.cup(1.1) } }),

  // ── 寶劍 ──
  s01: () => sky() + mountains(440, [[80, 120, 70], [220, 90, 60]], STONE) + handFromCloud(-1, 300, I.sword(230) + crownShape(0, -196, 40) + line('M-20,-196 q-16,10 -12,34 M20,-196 q16,10 12,34', 2, GREEN)),
  s02: () => sky({ night: true }) + moon(232, 80, 18, { fill: WHITE }) + sea(330, BLUEL) + R(110, 440, 80, 42, STONE, { hatch: 'hx' }) +
    figure({ x: 150, y: 440, s: 1.3, pose: 'seat', robe: WHITE, head: 'none', armL: 150, armR: 150, holdL: { item: I.sword(150), rot: 40 }, holdR: { item: I.sword(150), rot: -40 } }) +
    R(136, 291, 28, 7, WHITE, { hatch: null, sw: 1 }),
  s03: () => sky({ night: true }) + cloud(80, 90, 100, STONE) + cloud(220, 80, 110, STONE) +
    [...Array(18)].map((_, i) => L(30 + (i % 9) * 30, 120 + Math.floor(i / 9) * 30, 26 + (i % 9) * 30, 140 + Math.floor(i / 9) * 30, 1, BLUEL)).join('') +
    P('M150,380 L70,290 Q40,250 64,220 Q100,190 150,240 Q200,190 236,220 Q260,250 230,290Z', WINE, { hatch: 'hx' }) +
    g('translate(150 400) rotate(0)', I.sword(230)) + g('translate(250 380) rotate(-62)', I.sword(200)) + g('translate(50 380) rotate(62)', I.sword(200)),
  s04: () => sky() + window(220, 200, 60, 120) + R(18, 400, 264, 82, STONE, { hatch: 'hx' }) + R(40, 360, 220, 40, STONE, { hatch: 'h' }) +
    figure({ x: 70, y: 360, s: 1.2, rot: 90, robe: GOLDL, head: 'none', armL: 170, armR: 170, belt: null }) + g('translate(60 440) rotate(-90)', I.sword(180)) +
    g('translate(50 180) rotate(180)', I.sword(130)) + g('translate(80 180) rotate(180)', I.sword(130)) + g('translate(110 180) rotate(180)', I.sword(130)),
  s05: () => sky() + cloud(80, 100, 90, STONE) + cloud(220, 120, 80, STONE) + sea(330, BLUEL, 360) + ground(360, PARCH2) +
    figure({ x: 140, y: 440, s: 1.3, robe: WINE, head: 'none', armL: 60, armR: 30, holdL: { item: I.sword(100), rot: -40 + 0 }, holdR: { item: I.sword(100), rot: 20 } }) +
    g('translate(160 470) rotate(-50)', I.sword(90)) + g('translate(110 474) rotate(70)', I.sword(90)) + g('translate(185 456) rotate(30)', I.sword(80)) +
    figure({ x: 230, y: 390, s: 0.7, robe: BLUE, armL: 20, armR: 30 }) + figure({ x: 262, y: 400, s: 0.6, robe: GREEN, armL: 20, armR: 20 }),
  s06: () => sky() + sea(260, BLUEL) + P('M210,262 q30,-30 72,-10 v10Z', GREENL, { hatch: 'hl' }) +
    boat(150, 400, 1.4) + [...Array(6)].map((_, i) => g(`translate(${84 + i * 22} 390)`, I.sword(110))).join('') +
    figure({ x: 130, y: 398, s: 0.8, pose: 'seat', robe: WHITE, head: 'hood', armL: 20, armR: 20 }) + figure({ x: 160, y: 398, s: 0.45, pose: 'seat', robe: WINE, armL: 20, armR: 20 }) +
    figure({ x: 220, y: 398, s: 0.9, robe: DARK, armL: 160, armR: 20, holdL: { item: I.staff(120), rot: 10 } }),
  s07: () => sky() + ground(400, PARCH2) + `<path d="M30,320 l20,-40 l20,40Z M90,320 l20,-50 l20,50Z M220,320 l20,-40 l20,40Z" fill="${WINE}" stroke="${INK}"/>` +
    figure({ x: 160, y: 450, s: 1.3, robe: GOLDL, head: 'feather', armL: 70, armR: 70, holdL: { item: g('rotate(-60)', I.sword(110) + g('rotate(8)', I.sword(110)) + g('rotate(16)', I.sword(110))) }, holdR: { item: g('rotate(60)', I.sword(110) + g('rotate(-8)', I.sword(110))) }, tilt: 10 }) +
    g('translate(250 470)', I.sword(100)) + g('translate(270 470)', I.sword(100)),
  s08: () => sky() + castle(240, 260, 1) + ground(270, PARCH2) + pool(150, 470, 120, 14) +
    [40, 62, 84, 216, 238, 260, 106, 194].map((x, i) => g(`translate(${x} ${470 - (i >= 6 ? 10 : 0)})`, I.sword(140))).join('') +
    figure({ x: 150, y: 460, s: 1.4, robe: WINE, head: 'none', armL: 6, armR: 6 }) + line('M128,350 Q150,360 172,350 M126,380 Q150,390 174,380 M128,410 Q150,420 172,410', 3, WHITE) + R(136, 299, 28, 7, WHITE, { hatch: null, sw: 1 }),
  s09: () => sky({ night: true }) + [...Array(9)].map((_, i) => g(`translate(40 ${70 + i * 30}) rotate(90)`, I.sword(220))).join('') +
    bed(150, 420, 220) + figure({ x: 150, y: 440, s: 1.2, pose: 'seat', robe: WHITE, head: 'none', armL: 165, armR: 165, belt: null }) + R(40, 446, 220, 36, BROWN, { hatch: 'hx' }),
  s10: () => sky({ night: true }) + `<rect x="18" y="320" width="264" height="40" fill="${GOLDL}" opacity="0.8"/>` + sea(340, BLUE) + mountains(342, [[230, 30, 50]], DARK, false) + ground(420, DARK) +
    figure({ x: 60, y: 430, s: 1.3, rot: 90, robe: WINE, head: 'none', armL: 20, armR: 20 }) +
    [...Array(10)].map((_, i) => g(`translate(${100 + i * 15} 420)`, I.sword(110))).join(''),
  s11: () => BG.swords() + figure({ x: 150, y: 460, s: 1.4, robe: '#8a6a9a', head: 'none', armL: 40, armR: 150, holdR: { item: I.sword(150), rot: -20 }, tilt: 3 }),
  s12: () => BG.swords() + tree(250, 380, 0.7) + horse(150, 470, 1.4, { fill: WHITE, pose: 'gallop', blanket: BLUE, rider: figure({ x: 0, y: -40, s: 0.85, pose: 'ride', robe: STONE, head: 'helmet', armL: 40, armR: 160, holdR: { item: I.sword(130), rot: 40 } }) }),
  s13: () => BG.swords() + throne(140, 460, 100, 190, STONE, { deco: wings(0, -150, 0.25, WHITE) }) +
    figure({ x: 140, y: 460, s: 1.35, pose: 'seat', robe: WHITE, cloak: BLUEL, head: 'crown', armL: 110, armR: 175, holdR: { item: I.sword(150) } }),
  s14: () => BG.swords() + throne(150, 460, 120, 230, STONE, { deco: wings(0, -200, 0.3, WHITE) + moon(-20, -170, 8) + moon(20, -170, 8, { dir: -1 }) }) +
    figure({ x: 150, y: 460, s: 1.4, pose: 'seat', robe: BLUE, cloak: WINE, head: 'crown', armL: 40, armR: 170, holdR: { item: I.sword(150), rot: 6 } }),

  // ── 錢幣 ──
  p01: () => sky() + ground(400, GREENL) + archway(150, 470, 90, 120, GREEN) + path('M150,480 V380') + mountains(380, [[150, 60, 40]], STONE) +
    flowers(420, 6, 40, 110, 'lily') + flowers(420, 4, 200, 260, 'lily') + handFromCloud(1, 200, g('translate(0 -44)', I.pentacle(44))),
  p02: () => sky() + sea(250, BLUEL, 340) + `<path d="M18,280 Q80,230 150,290 T282,270" stroke="${INK}" stroke-width="1" fill="none"/>` + ship(70, 260, 1.4) + ship(230, 300, 1.2) + ground(340, PARCH2) +
    figure({ x: 150, y: 460, s: 1.4, robe: WINE, head: 'feather', armL: 70, armR: 70, holdL: { item: I.pentacle(18) }, holdR: { item: I.pentacle(18) }, tilt: -4 }) + lemniscate(150, 360, 120),
  p03: () => sky() + archway(150, 482, 200, 420, STONE) + [[150, 140], [110, 200], [190, 200]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(18))).join('') +
    R(90, 380, 120, 30, STONE, { hatch: 'hx' }) + figure({ x: 150, y: 380, s: 0.9, robe: WINE, armL: 150, armR: 80, holdR: { item: I.hammer() } }) +
    figure({ x: 90, y: 482, s: 0.85, robe: BLUE, armL: 60, armR: 20, holdL: { item: I.scroll() } }) + figure({ x: 210, y: 482, s: 0.85, robe: '#8a6a9a', head: 'hood', armL: 20, armR: 30 }),
  p04: () => sky() + castle(60, 360, 0.9) + castle(240, 360, 0.9) + ground(380, PARCH2) + throne(150, 450, 100, 120, STONE) +
    figure({ x: 150, y: 450, s: 1.4, pose: 'seat', robe: WINE, cloak: DARK, head: 'crown', armL: 20, armR: 20 }) + g('translate(150 360)', I.pentacle(22)) + g('translate(150 248)', I.pentacle(18)) +
    g('translate(110 470)', I.pentacle(14)) + g('translate(190 470)', I.pentacle(14)),
  p05: () => sky({ night: true }) + [...Array(40)].map((_, i) => Ci((i * 47) % 264 + 18, (i * 83) % 420 + 30, 1.6, WHITE, { hatch: null, sw: 0.3 })).join('') + R(18, 80, 120, 330, STONED, { hatch: 'hx' }) +
    window(78, 280, 80, 170) + [[60, 150], [96, 150], [60, 200], [96, 200], [78, 250]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(12))).join('') + ground(420, WHITE) +
    figure({ x: 190, y: 470, s: 1.1, robe: STONE, head: 'hood', armL: 20, armR: 20 }) + line('M178,470 l-6,10 M202,470 l4,10', 3) + figure({ x: 245, y: 470, s: 1, robe: STONED, head: 'hood', armL: 40, armR: 20, holdL: { item: I.staff(100) } }),
  p06: () => sky() + castle(150, 320, 0.8) + ground(340, PARCH2) +
    figure({ x: 150, y: 440, s: 1.35, robe: WINE, cloak: BLUE, head: 'none', armL: 80, armR: 120, holdL: { item: I.scales(), rot: -80 }, holdR: { item: Ci(0, 8, 2, GOLDL) + Ci(4, 14, 2, GOLDL) } }) +
    figure({ x: 70, y: 482, s: 0.9, pose: 'kneel', robe: STONE, armL: 140, armR: 140 }) + figure({ x: 240, y: 482, s: 0.9, pose: 'kneel', robe: STONED, armL: 140, armR: 140 }) +
    [[40, 80], [80, 80], [120, 80], [180, 80], [220, 80], [260, 80]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(14))).join(''),
  p07: () => sky() + hills(380, GREENL) + ground(430, GREENL) +
    P('M150,440 q-60,-20 -70,-120 q30,-60 70,-90 q40,30 70,90 q-10,100 -70,120Z', GREEN, { hatch: 'hl' }) +
    [[120, 260], [150, 240], [180, 260], [110, 310], [150, 300], [190, 310], [150, 360]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(13))).join('') +
    figure({ x: 240, y: 470, s: 1.15, robe: '#8a6a4a', head: 'none', armL: 120, armR: 60, holdL: { item: I.hoe(), rot: 30 } }),
  p08: () => sky() + castle(240, 300, 0.7) + path('M240,300 Q200,350 160,420') + ground(320, PARCH2) +
    pillar(40, 140, 430, 14, BROWN, { cap: false }) + [[40, 160], [40, 200], [40, 240], [40, 280], [40, 320], [40, 360]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(13))).join('') +
    R(120, 400, 100, 14, BROWN, { hatch: 'h' }) + g('translate(170 386)', I.pentacle(13)) + g('translate(250 470)', I.pentacle(13)) +
    figure({ x: 150, y: 470, s: 1.15, pose: 'seat', robe: BLUE, armL: 120, armR: 110, holdR: { item: I.hammer(), rot: -30 } }),
  p09: () => sky() + castle(60, 300, 0.9) + ground(330, GREENL) +
    [...Array(6)].map((_, i) => g(`translate(${40 + (i % 2) * 22} ${340 + Math.floor(i / 2) * 44})`, I.pentacle(11))).join('') +
    [...Array(3)].map((_, i) => g(`translate(${236 + (i % 2) * 22} ${340 + i * 44})`, I.pentacle(11))).join('') +
    [...Array(12)].map((_, i) => Ci(90 + (i % 4) * 8 + 140 * (i >= 8 ? 0 : 0), 280 + Math.floor(i / 4) * 8, 4, '#7a4e8a', { hatch: null, sw: 0.5 })).join('') +
    figure({ x: 150, y: 470, s: 1.45, robe: GOLDL, cloak: null, head: 'veil', veilColor: WINE, armL: 120, armR: 30, holdL: { item: bird(-4, -6, 0.6, BROWN) } }),
  p10: () => sky() + archway(150, 482, 150, 300, STONE) + castle(150, 300, 0.7) +
    [[60, 100], [36, 150], [84, 150], [60, 200], [36, 250], [84, 250], [60, 300], [240, 160], [240, 220], [240, 280]].map(([x, y]) => g(`translate(${x} ${y})`, I.pentacle(13))).join('') +
    figure({ x: 70, y: 470, s: 1.1, pose: 'seat', robe: WINE, cloak: GOLDL, head: 'none', armL: 60, armR: 50, hair: WHITE }) + dog(60, 482, 0.7) + dog(110, 482, 0.6) +
    figure({ x: 150, y: 450, s: 0.95, robe: BLUE, armL: 20, armR: 50 }) + figure({ x: 200, y: 450, s: 0.95, robe: WINE, armL: 50, armR: 20, hairLong: true }) + figure({ x: 178, y: 460, s: 0.55, robe: GOLDL, armL: 30, armR: 30 }),
  p11: () => BG.pentacles() + figure({ x: 150, y: 460, s: 1.4, robe: GREEN, cloak: BROWN, head: 'feather', armL: 120, armR: 120 }) + g('translate(150 260)', I.pentacle(22)),
  p12: () => BG.pentacles() + `<path d="M18,420 h264" stroke="${BROWN}" stroke-width="3" stroke-dasharray="6 4"/>` +
    horse(150, 470, 1.4, { fill: DARK, pose: 'stand', blanket: WINE, rider: figure({ x: 0, y: -40, s: 0.85, pose: 'ride', robe: STONED, head: 'helmet', armL: 70, armR: 20, holdL: { item: I.pentacle(14) } }) }),
  p13: () => BG.pentacles() + flowers(80, 7, 30, 270) + throne(150, 450, 120, 200, STONE, { deco: g('translate(-40 -170)', P('M0,0 l-6,-10 l6,-4 l6,4Z', GOLDL, { hatch: null })) + g('translate(40 -170)', P('M0,0 l-6,-10 l6,-4 l6,4Z', GOLDL, { hatch: null })) }) +
    figure({ x: 150, y: 450, s: 1.35, pose: 'seat', robe: WINE, cloak: GREEN, head: 'crown', armL: 30, armR: 30 }) + g('translate(150 370)', I.pentacle(18)) +
    P('M230,480 q4,-14 16,-12 q10,0 10,12Z', WHITE, { hatch: 'h' }),
  p14: () => BG.pentacles() + castle(240, 330, 0.8) + throne(150, 450, 130, 230, DARK, { deco: P('M-50,-200 q-10,-14 0,-22 q10,8 6,22Z M50,-200 q10,-14 0,-22 q-10,8 -6,22Z', GOLDL, { hatch: null }) }) +
    [...Array(10)].map((_, i) => Ci(60 + (i % 5) * 10, 410 + Math.floor(i / 5) * 10, 5, '#7a4e8a', { hatch: null, sw: 0.5 })).join('') +
    figure({ x: 150, y: 450, s: 1.4, pose: 'seat', robe: DARK, cloak: GREEN, head: 'crown', armL: 140, armR: 40, holdL: { item: I.ankh(60) }, holdR: { item: I.pentacle(18), rot: -40 } })
};

// 把天空裝飾插在第一個背景圖層之後
function injectSky(body, deco) {
  // 白天與夜空的排線底紋屬性不同，找到底紋後的第一個結尾再插入
  const i = body.indexOf('fill="url(#hz)"');
  if (i < 0) return deco + body;
  const j = body.indexOf('/>', i) + 2;
  return body.slice(0, j) + deco + body.slice(j);
}

function backFigureLarge(x, y, s, robe) {
  return g(tr(x, y, s), P('M-20,0 Q-22,-50 -14,-70 Q0,-78 14,-70 Q22,-50 20,0Z', robe) + Ci(0, -80, 10, BROWN, { hatch: 'h' }));
}

// ───────────── 牌背 ─────────────
function back() {
  const { gem, fleur, curl } = A;
  let s = `<rect x="0" y="0" width="300" height="500" rx="14" fill="${WINED}"/><rect x="0" y="0" width="300" height="500" rx="14" fill="url(#damask)"/>`;
  s += `<rect x="3.5" y="3.5" width="293" height="493" rx="11.5" fill="none" stroke="url(#gv)" stroke-width="3"/>`;
  s += `<rect x="9" y="9" width="282" height="482" rx="8" fill="none" stroke="${GOLDL}" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 4.2"/>`;
  s += `<rect x="20" y="20" width="260" height="460" rx="6" fill="${WINE}" stroke="url(#gv)" stroke-width="3"/><rect x="20" y="20" width="260" height="460" rx="6" fill="url(#damask)"/>`;
  s += `<rect x="27" y="27" width="246" height="446" rx="4" fill="none" stroke="${GOLDL}" stroke-width="0.8"/>`;
  // 中央光芒
  let rays = '';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, r2 = i % 2 ? 112 : 150;
    rays += `M${(150 + Math.cos(a) * 84).toFixed(1)},${(250 + Math.sin(a) * 84).toFixed(1)} L${(150 + Math.cos(a) * r2).toFixed(1)},${(250 + Math.sin(a) * r2).toFixed(1)} `;
  }
  s += `<clipPath id="backclip"><rect x="28" y="28" width="244" height="444" rx="4"/></clipPath><path d="${rays}" stroke="url(#gv)" stroke-width="1.3" clip-path="url(#backclip)"/>`;
  // 花瓣環
  for (let i = 0; i < 12; i++) s += g(`translate(150 250) rotate(${i * 30})`, El(0, -84, 9, 18, WINED, { hatch: null, sw: 1.4, stroke: GOLDL }) + Ci(0, -88, 2.2, GOLDL, { hatch: null, sw: 0.4 }));
  s += `<circle cx="150" cy="250" r="72" fill="${WINED}" stroke="url(#gv)" stroke-width="3.5"/><circle cx="150" cy="250" r="65" fill="none" stroke="${GOLDL}" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 5.1"/>`;
  s += star(150, 250, 60, { n: 8, fill: '#5a1424', inner: 0.62, sw: 0.8 });
  s += `<circle cx="150" cy="250" r="40" fill="${WINED}" stroke="url(#gv)" stroke-width="2"/>`;
  s += moon(150, 250, 28, { fill: 'url(#gv)' }) + star(163, 239, 7, { n: 8, fill: GOLDL });
  // 上下徽章（180 度對稱）
  for (const [y, r] of [[78, 0], [422, 180]]) {
    s += g(`translate(150 ${y}) rotate(${r})`,
      line('M-90,0 H-22 M22,0 H90', 1.2, 'url(#gh)') + g('translate(-22 2) scale(0.6)', curl(true)) + g('translate(22 2) scale(0.6)', curl()) +
      `<circle cx="0" cy="0" r="15" fill="${WINED}" stroke="url(#gv)" stroke-width="2.4"/>` + star(0, 0, 11, { n: 8, fill: 'url(#gv)', inner: 0.4, sw: 0.5 }) + gem(0, 0, 3.4) +
      line('M0,15 V44', 1.4, 'url(#gv)') + P('M0,44 l5,8 l-5,8 l-5,-8Z', 'url(#gv)', { hatch: null, sw: 0.5, stroke: '#5a3a14' }));
  }
  // 左右寶石
  for (const x of [44, 256]) s += gem(x, 250, 4, 'gemb') + line(`M${x},214 V236 M${x},264 V286`, 1, 'url(#gv)');
  // 星點
  for (const [x, y] of [[60, 140], [240, 140], [70, 190], [230, 190], [96, 120], [204, 120]]) {
    s += star(x, y, 4.5, { n: 4, fill: GOLDL, inner: 0.3, sw: 0.4 }) + star(300 - x, 500 - y, 4.5, { n: 4, fill: GOLDL, inner: 0.3, sw: 0.4 });
  }
  s += fleur(34, 34, 45) + fleur(266, 34, 135) + fleur(34, 466, -45) + fleur(266, 466, -135);
  return svgDoc(s);
}

// 各張牌的背景場景（插在天空之後、主體之前）
const EXTRA = {
  m01: () => vines('both', 70, 360),
  m03: () => farHills(300, GREENL),
  m08: () => castle(48, 300, 0.55) + birdV(230, 90) + birdV(246, 100, 0.8),
  m11: () => '',
  m14: () => vines('left', 120, 400),
  c02: () => farHills(345, GREENL) + tree(40, 372, 0.55) + tree(262, 370, 0.6) + birdV(70, 90) + birdV(86, 82, 0.8),
  c03: () => farHills(400, GREENL) + town(408, 150, 280) + sun(56, 80, 18, { rays: 16 }) + cloud(220, 110, 70),
  c04: () => farHills(368, BLUEL) + birdV(200, 120) + birdV(216, 130, 0.8),
  c09: () => swag(WINE) + town(232, 20, 280),
  c11: () => islands(358),
  c13: () => islands(400),
  s02: () => islands(330),
  s05: () => town(330, 160, 280, STONE),
  w02: () => farHills(332, BLUEL),
  w07: () => farHills(360, BLUEL) + castle(250, 350, 0.45),
  w09: () => town(420, 20, 280, STONE) + farHills(410, SAND),
  w11: () => farHills(368, '#c9a26a'),
  p03: () => vines('both', 120, 470),
  p06: () => town(330, 20, 120) + town(330, 190, 280),
  p07: () => farHills(380, BLUEL) + fence(436, 20, 160) + town(380, 200, 280, STONE),
  p11: () => fence(470, 20, 280),
  p12: () => farHills(380, BLUEL)
};

const SPARSE = ['w02', 'w03', 'w04', 'w05', 'w06', 'w09', 'w10', 'w11', 'w12', 'w13', 'w14', 's11', 's12', 's13', 's14', 'c11', 'c12', 'c13', 'p02', 'p04', 'p07', 'p08', 'p09', 'p11', 'p12', 'p14', 's08', 'c06', 'c04'];
function skyDeco(id) {
  const n = parseInt(id.slice(1), 10) + id.charCodeAt(0);
  const sx = 60 + (n * 37) % 180;
  let s = '';
  if (id[0] === 's') s += cloud(70 + (n % 3) * 10, 74, 70, WHITE) + cloud(228, 104 + (n % 4) * 6, 80, WHITE) + birdV(150, 62) + birdV(168, 76, 0.8);
  else s += sun(sx, 78, 16, { rays: 16 }) + cloud(sx < 150 ? 220 : 80, 110, 76, WHITE) + birdV(150, 150, 0.9) + birdV(166, 140, 0.7);
  return s;
}

let count = 0;
for (const [id, fn] of Object.entries(MAJOR)) {
  const body = EXTRA[id] ? injectSky(fn(), EXTRA[id]()) : fn(), opt = { numeral: parseInt(id.slice(1), 10) };
  writeFileSync(join(out, id + '.svg'), svgDoc(frame(body, opt)));
  writeFileSync(join(out, 'rv', id + '.svg'), svgDoc(frame(body, { ...opt, rev: true })));
  count++;
}
for (const [id, fn] of Object.entries(MINOR)) {
  const deco = (SPARSE.includes(id) ? skyDeco(id) : '') + (EXTRA[id] ? EXTRA[id]() : '');
  const body = deco ? injectSky(fn(), deco) : fn();
  const opt = { suit: { w: 'wands', c: 'cups', s: 'swords', p: 'pentacles' }[id[0]], court: parseInt(id.slice(1), 10) >= 11 };
  writeFileSync(join(out, id + '.svg'), svgDoc(frame(body, opt)));
  writeFileSync(join(out, 'rv', id + '.svg'), svgDoc(frame(body, { ...opt, rev: true })));
  count++;
}
writeFileSync(join(out, 'back.svg'), back());
console.log('generated', count, 'cards (upright + reversed) + back');
