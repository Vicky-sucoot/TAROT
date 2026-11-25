/* 月下占卜：在裝置上繪製分享用結果卡 PNG（離線可用）
 * 結果卡只含：網站名、牌陣名稱、三張牌圖、牌位、牌名、正逆位、一句公開指引。
 * 不含私人提問與感情情境。
 */
(function (root) {
  'use strict';
  var W = 1080, H = 1920;
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
    }
  };

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

  /**
   * @param {{spreadName:string, cards:Array<{id:string,rev:boolean,name:string,position:string}>, publicLine:string}} data
   * @param {'wine'|'parchment'} paletteId
   * @returns {Promise<HTMLCanvasElement>}
   */
  function render(data, paletteId) {
    var pal = PALETTES[paletteId] || PALETTES.wine;
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
      var seeds = [[120, 160], [960, 210], [180, 470], [900, 520], [80, 1180], [1000, 1150], [150, 1620], [940, 1700], [540, 1560]];
      seeds.forEach(function (p, i) { star(ctx, p[0], p[1], i % 2 ? 7 : 10, 4, 0.32); });

      // 金框
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 5; roundRect(ctx, 36, 36, W - 72, H - 72, 26); ctx.stroke();
      ctx.strokeStyle = pal.frameSoft; ctx.lineWidth = 2; roundRect(ctx, 56, 56, W - 112, H - 112, 18); ctx.stroke();
      ctx.fillStyle = pal.frame;
      [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]].forEach(function (p) { star(ctx, p[0], p[1], 16, 4, 0.3); });

      // 標題
      crescent(ctx, 540, 165, 44, pal.title, mix(pal.bgTop, pal.bgBottom, 165 / H));
      ctx.fillStyle = pal.title; star(ctx, 566, 140, 12, 8, 0.4);
      ctx.fillStyle = pal.title;
      ctx.font = '700 104px ' + FONT_SERIF;
      ctx.fillText('月下占卜', 540, 320);
      ctx.fillStyle = pal.muted;
      ctx.font = '400 36px ' + FONT_SERIF;
      ctx.fillText('在月光下，聽見自己的答案', 540, 380);

      // 牌陣名稱（緞帶）
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200, 455); ctx.lineTo(380, 455); ctx.moveTo(700, 455); ctx.lineTo(880, 455); ctx.stroke();
      ctx.fillStyle = pal.frame; star(ctx, 190, 455, 8, 4, 0.35); star(ctx, 890, 455, 8, 4, 0.35);
      ctx.fillStyle = pal.text;
      fitFont(ctx, data.spreadName, '700', 50, FONT_SERIF, 300);
      ctx.fillText(data.spreadName, 540, 472);

      // 三張牌
      var cw = 300, ch = 500, gap = 30, x0 = (W - cw * 3 - gap * 2) / 2, y0 = 540;
      data.cards.forEach(function (c, i) {
        var x = x0 + i * (cw + gap);
        ctx.save();
        ctx.shadowColor = pal.shadow; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#000'; roundRect(ctx, x, y0, cw, ch, 14); ctx.fill();
        ctx.restore();
        ctx.save();
        roundRect(ctx, x, y0, cw, ch, 14); ctx.clip();
        if (c.rev) { // 逆位：只旋轉插畫
          ctx.translate(x + cw / 2, y0 + ch / 2); ctx.rotate(Math.PI);
          ctx.drawImage(imgs[i], -cw / 2, -ch / 2, cw, ch);
        } else {
          ctx.drawImage(imgs[i], x, y0, cw, ch);
        }
        ctx.restore();

        var cx = x + cw / 2;
        ctx.fillStyle = pal.muted;
        fitFont(ctx, c.position, '600', 32, FONT_SANS, cw - 6);
        ctx.fillText(c.position, cx, y0 + ch + 58);
        ctx.fillStyle = pal.text;
        fitFont(ctx, c.name, '700', 46, FONT_SERIF, cw - 6);
        ctx.fillText(c.name, cx, y0 + ch + 120);
        // 正逆位標籤
        var label = c.rev ? '逆位' : '正位';
        ctx.font = '700 32px ' + FONT_SANS;
        var pw = 112, ph = 50, py = y0 + ch + 146;
        roundRect(ctx, cx - pw / 2, py, pw, ph, 25);
        ctx.fillStyle = c.rev ? pal.pillRvBg : pal.pillUpBg; ctx.fill();
        if (c.rev) { ctx.strokeStyle = pal.pillRvLine; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.fillStyle = c.rev ? pal.pillRvFg : pal.pillUpFg;
        ctx.fillText(label, cx, py + 36);
      });

      // 分隔紋飾
      var dy = 1330;
      ctx.strokeStyle = pal.frame; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(180, dy); ctx.lineTo(480, dy); ctx.moveTo(600, dy); ctx.lineTo(900, dy); ctx.stroke();
      crescent(ctx, 540, dy, 20, pal.frame, mix(pal.bgTop, pal.bgBottom, dy / H));

      // 整體指引
      ctx.fillStyle = pal.muted;
      ctx.font = '600 36px ' + FONT_SANS;
      ctx.fillText('整體指引', 540, 1410);
      ctx.fillStyle = pal.text;
      ctx.font = '700 50px ' + FONT_SERIF;
      var lines = wrap(ctx, data.publicLine, 860).slice(0, 4);
      lines.forEach(function (ln, i) { ctx.fillText(ln, 540, 1495 + i * 78); });

      // 頁尾
      ctx.fillStyle = pal.muted;
      ctx.font = '400 28px ' + FONT_SANS;
      ctx.fillText('月下占卜・' + data.spreadName, 540, H - 100);
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

  root.RESULTCARD = { render: render, toBlob: toBlob, PALETTES: PALETTES };
})(typeof self !== 'undefined' ? self : this);
