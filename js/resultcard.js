/* 月下占卜：在裝置上繪製分享用結果卡 PNG（離線可用）
 * 結果卡只含：網站名、牌陣名稱、三張牌圖、牌位、牌名、正逆位、一句公開指引。
 * 不含私人提問與感情情境。
 */
(function (root) {
  'use strict';
  var FONT_SERIF = '"Songti TC","Noto Serif TC","Source Han Serif TC","PingFang TC","Heiti TC","Microsoft JhengHei",serif';
  var FONT_SANS = '"PingFang TC","Noto Sans TC","Heiti TC","Microsoft JhengHei",sans-serif';

  var PALETTES = {
    wine: {
      label: '酒紅古金', bgTop: '#5a1424', bgBottom: '#26070f', frame: '#c9a45c', frameSoft: 'rgba(226,201,143,0.55)',
      title: '#ecd08f', text: '#f3e7cc', muted: '#d6bf91', pillUpBg: '#f3e7cc', pillUpFg: '#5a1424', pillRvBg: '#26070f', pillRvFg: '#ecd08f', pillRvLine: '#c9a45c',
      star: 'rgba(236,208,143,0.55)', shadow: 'rgba(0,0,0,0.45)'
    },
    parchment: {
      label: '羊皮紙米白', bgTop: '#f7eed9', bgBottom: '#e6d1a6', frame: '#9c7633', frameSoft: 'rgba(109,26,43,0.4)',
      title: '#6d1a2b', text: '#3a1c17', muted: '#6b5140', pillUpBg: '#6d1a2b', pillUpFg: '#f7eed9', pillRvBg: '#f7eed9', pillRvFg: '#6d1a2b', pillRvLine: '#6d1a2b',
      star: 'rgba(156,118,51,0.45)', shadow: 'rgba(60,30,10,0.3)'
    },
    navy: {
      label: '深藍星空', bgTop: '#1d2a4a', bgBottom: '#0a1020', frame: '#c9b07a', frameSoft: 'rgba(214,222,240,0.45)',
      title: '#efd99a', text: '#eef1f8', muted: '#b9c3dc', pillUpBg: '#eef1f8', pillUpFg: '#1d2a4a', pillRvBg: '#0a1020', pillRvFg: '#efd99a', pillRvLine: '#c9b07a',
      star: 'rgba(238,241,248,0.6)', shadow: 'rgba(0,0,0,0.5)'
    }
  };
  var PALETTE_IDS = ['wine', 'parchment', 'navy'];
  var FORMATS = { portrait: { w: 1080, h: 1920, label: '直式' }, square: { w: 1080, h: 1080, label: '方形' } };

  var imgCache = {};
  function loadImage(src) {
    if (imgCache[src]) return imgCache[src];
    imgCache[src] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { delete imgCache[src]; reject(new Error('無法載入圖片：' + src)); };
      img.src = src;
    });
    return imgCache[src];
  }

  function star(ctx, x, y, r, n, inner) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      var rr = i % 2 ? r * inner : r;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  function crescent(ctx, x, y, r, color, bg) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(x + r * 0.42, y - r * 0.16, r * 0.86, 0, Math.PI * 2); ctx.fill();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(',') + ')';
  }

  var NO_LINE_START = '，。、；：！？」』）》〉…—．,.!?;:)';
  function wrap(ctx, text, maxW) {
    var lines = [], cur = '';
    var chars = Array.from(text);
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) {
        if (NO_LINE_START.indexOf(ch) >= 0) { // 標點不放行首
          var last = Array.from(cur); var moved = last.pop();
          lines.push(last.join('')); cur = moved + ch;
        } else { lines.push(cur); cur = ch; }
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function fitFont(ctx, text, weight, size, family, maxW) {
    var s = size;
    do { ctx.font = weight + ' ' + s + 'px ' + family; s -= 2; } while (ctx.measureText(text).width > maxW && s > 16);
  }

  // 依格式與張數計算版面
  function layout(format, n) {
    if (format === 'square') {
      var sq = { W: 1080, H: 1080, titleY: 190, titleSize: 76, tagY: 0, ribbonY: 256, spreadSize: 40 };
      if (n <= 3) { sq.cw = 210; sq.gap = 40; } else { sq.cw = 176; sq.gap = 18; }
      sq.ch = Math.round(sq.cw * 5 / 3);
      sq.rows = [[0, n, 300]];
      sq.posSize = n <= 3 ? 28 : 24; sq.nameSize = n <= 3 ? 40 : 32; sq.pill = n <= 3 ? [96, 42, 28] : [84, 38, 24];
      sq.guideLabelY = 0; sq.guideY = sq.rows[0][2] + sq.ch + 262; sq.guideSize = 34; sq.guideMax = 900; sq.guideLines = 2;
      sq.dividerY = sq.guideY - 50; sq.footY = 1004; sq.moonY = 96; sq.moonR = 24; sq.stars = [[90, 110], [990, 130], [70, 990], [1010, 960]];
      return sq;
    }
    var L = { W: 1080, H: 1920, titleY: 320, titleSize: 104, tagY: 380, ribbonY: 472, spreadSize: 50, moonY: 165, moonR: 44,
      stars: [[120, 160], [960, 210], [180, 470], [900, 520], [80, 1180], [1000, 1150], [150, 1620], [940, 1700], [540, 1560]] };
    if (n <= 3) {
      L.cw = 300; L.gap = 30; L.rows = [[0, n, 540]];
      L.posSize = 32; L.nameSize = 46; L.pill = [112, 50, 32];
      L.dividerY = 1330; L.guideLabelY = 1410; L.guideY = 1495; L.guideSize = 50; L.guideMax = 860; L.guideLines = 4;
    } else {
      L.cw = 200; L.gap = 40; L.rows = [[0, 3, 510], [3, n, 1050]];
      L.posSize = 28; L.nameSize = 38; L.pill = [96, 42, 28];
      L.dividerY = 1584; L.guideLabelY = 1640; L.guideY = 1700; L.guideSize = 42; L.footAdj = 20; L.guideMax = 880; L.guideLines = 2;
    }
    L.ch = Math.round(L.cw * 5 / 3);
    L.footY = L.H - 100 + (L.footAdj || 0);
    return L;
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }

  /**
   * @param {{spreadName:string, cards:Array<{id:string,rev:boolean,name:string,position:string}>, publicLine:string, ts:number}} data
   * @param {'wine'|'parchment'|'navy'} paletteId
   * @param {{format?:'portrait'|'square', showDate?:boolean}} [opts]
   * @returns {Promise<HTMLCanvasElement>}
   */
  function render(data, paletteId, opts) {
    opts = opts || {};
    var pal = PALETTES[paletteId] || PALETTES.wine;
    var n = data.cards.length;
    var Lo = layout(opts.format === 'square' ? 'square' : 'portrait', n);
    var W = Lo.W, H = Lo.H;
    var srcs = data.cards.map(function (c) { return 'cards/' + c.id + '.svg'; });
    return Promise.all(srcs.map(loadImage)).then(function (imgs) {
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // 背景
      var grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, pal.bgTop); grd.addColorStop(1, pal.bgBottom);
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pal.star;
      Lo.stars.forEach(function (p, i) { star(ctx, p[0], p[1], i % 2 ? 7 : 10, 4, 0.32); });

      // 金框
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 5; roundRect(ctx, 36, 36, W - 72, H - 72, 26); ctx.stroke();
      ctx.strokeStyle = pal.frameSoft; ctx.lineWidth = 2; roundRect(ctx, 56, 56, W - 112, H - 112, 18); ctx.stroke();
      ctx.fillStyle = pal.frame;
      [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]].forEach(function (p) { star(ctx, p[0], p[1], 16, 4, 0.3); });

      // 標題
      crescent(ctx, 540, Lo.moonY, Lo.moonR, pal.title, mix(pal.bgTop, pal.bgBottom, Lo.moonY / H));
      ctx.fillStyle = pal.title; star(ctx, 540 + Lo.moonR * 0.6, Lo.moonY - Lo.moonR * 0.55, Lo.moonR * 0.27, 8, 0.4);
      ctx.fillStyle = pal.title;
      ctx.font = '700 ' + Lo.titleSize + 'px ' + FONT_SERIF;
      ctx.fillText('月下占卜', 540, Lo.titleY);
      if (Lo.tagY) {
        ctx.fillStyle = pal.muted;
        ctx.font = '400 36px ' + FONT_SERIF;
        ctx.fillText('在月光下，聽見自己的答案', 540, Lo.tagY);
      }

      // 牌陣名稱（緞帶）
      var ry = Lo.ribbonY - Lo.spreadSize * 0.34;
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200, ry); ctx.lineTo(370, ry); ctx.moveTo(710, ry); ctx.lineTo(880, ry); ctx.stroke();
      ctx.fillStyle = pal.frame; star(ctx, 190, ry, 8, 4, 0.35); star(ctx, 890, ry, 8, 4, 0.35);
      ctx.fillStyle = pal.text;
      fitFont(ctx, data.spreadName, '700', Lo.spreadSize, FONT_SERIF, 320);
      ctx.fillText(data.spreadName, 540, Lo.ribbonY);

      // 牌
      var cw = Lo.cw, ch = Lo.ch;
      Lo.rows.forEach(function (row) {
        var count = row[1] - row[0];
        var x0 = (W - cw * count - Lo.gap * (count - 1)) / 2, y0 = row[2];
        for (var k = 0; k < count; k++) {
          var i = row[0] + k, c = data.cards[i];
          var x = x0 + k * (cw + Lo.gap);
          ctx.save();
          ctx.shadowColor = pal.shadow; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
          ctx.fillStyle = '#000'; roundRect(ctx, x, y0, cw, ch, 14 * cw / 300); ctx.fill();
          ctx.restore();
          ctx.save();
          roundRect(ctx, x, y0, cw, ch, 14 * cw / 300); ctx.clip();
          if (c.rev) { // 逆位：只旋轉插畫
            ctx.translate(x + cw / 2, y0 + ch / 2); ctx.rotate(Math.PI);
            ctx.drawImage(imgs[i], -cw / 2, -ch / 2, cw, ch);
          } else {
            ctx.drawImage(imgs[i], x, y0, cw, ch);
          }
          ctx.restore();

          var cx = x + cw / 2;
          var ty = y0 + ch + Lo.posSize * 1.7;
          ctx.fillStyle = pal.muted;
          fitFont(ctx, c.position, '600', Lo.posSize, FONT_SANS, cw + Lo.gap - 6);
          ctx.fillText(c.position, cx, ty);
          ty += Lo.nameSize * 1.3;
          ctx.fillStyle = pal.text;
          fitFont(ctx, c.name, '700', Lo.nameSize, FONT_SERIF, cw + Lo.gap - 6);
          ctx.fillText(c.name, cx, ty);
          var label = c.rev ? '逆位' : '正位';
          ctx.font = '700 ' + Lo.pill[2] + 'px ' + FONT_SANS;
          var pw = Lo.pill[0], ph = Lo.pill[1], py = ty + Lo.nameSize * 0.55;
          roundRect(ctx, cx - pw / 2, py, pw, ph, ph / 2);
          ctx.fillStyle = c.rev ? pal.pillRvBg : pal.pillUpBg; ctx.fill();
          if (c.rev) { ctx.strokeStyle = pal.pillRvLine; ctx.lineWidth = 2.5; ctx.stroke(); }
          ctx.fillStyle = c.rev ? pal.pillRvFg : pal.pillUpFg;
          ctx.fillText(label, cx, py + ph * 0.72);
        }
      });

      // 分隔紋飾
      var dy = Lo.dividerY;
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(180, dy); ctx.lineTo(480, dy); ctx.moveTo(600, dy); ctx.lineTo(900, dy); ctx.stroke();
      crescent(ctx, 540, dy, 20, pal.frame, mix(pal.bgTop, pal.bgBottom, dy / H));

      // 整體指引
      if (Lo.guideLabelY) {
        ctx.fillStyle = pal.muted;
        ctx.font = '600 36px ' + FONT_SANS;
        ctx.fillText('整體指引', 540, Lo.guideLabelY);
      }
      ctx.fillStyle = pal.text;
      ctx.font = '700 ' + Lo.guideSize + 'px ' + FONT_SERIF;
      var lines = wrap(ctx, data.publicLine, Lo.guideMax).slice(0, Lo.guideLines);
      lines.forEach(function (ln, i) { ctx.fillText(ln, 540, Lo.guideY + i * Lo.guideSize * 1.56); });

      // 頁尾
      ctx.fillStyle = pal.muted;
      ctx.font = '400 28px ' + FONT_SANS;
      var foot = '月下占卜・' + data.spreadName + (opts.showDate && data.ts ? '・' + fmtDate(data.ts) : '');
      ctx.fillText(foot, 540, Lo.footY);
      return cv;
    });
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('PNG 產生失敗')); }, 'image/png');
      else {
        try {
          var bin = atob(canvas.toDataURL('image/png').split(',')[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (e) { reject(e); }
      }
    });
  }

  root.RESULTCARD = { render: render, toBlob: toBlob, PALETTES: PALETTES, PALETTE_IDS: PALETTE_IDS, FORMATS: FORMATS };
})(typeof self !== 'undefined' ? self : this);
