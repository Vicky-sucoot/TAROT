"""產生網站專用的子集字型（思源宋體 Noto Serif TC，SIL OFL 1.1）。

只保留網站文字實際用到的字元，合併成每個字重一個 WOFF2 檔：
  fonts/yuexia-serif-400.woff2、fonts/yuexia-serif-700.woff2

用法：python3 tools/build-font.py <@fontsource/noto-serif-tc 的 files 資料夾>
需要 fonttools 與 brotli（pip install fonttools brotli）。
新增或修改網站文字後請重新執行，再執行 node tools/build-manifest.mjs。
"""
import glob
import os
import sys

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SOURCES = ['index.html', 'docs/credits.html'] + sorted(glob.glob(os.path.join(ROOT, 'js', '*.js')))


def used_chars():
    text = ''
    for f in SOURCES:
        with open(os.path.join(ROOT, f), encoding='utf-8') as fh:
            text += fh.read()
    chars = {c for c in text if ord(c) >= 0x20}
    chars |= {chr(c) for c in range(0x20, 0x7F)}  # 英數與符號
    chars |= set('０１２３４５６７８９％／：，。、；！？「」『』（）《》〈〉…—・')
    return chars


def build(src_dir, weight, chars):
    files = sorted(glob.glob(os.path.join(src_dir, 'noto-serif-tc-*-%d-normal.woff2' % weight)))
    if not files:
        sys.exit('找不到字重 %d 的字型檔' % weight)
    parts, covered = [], set()
    tmp_dir = os.path.join(ROOT, 'fonts', '.tmp')
    os.makedirs(tmp_dir, exist_ok=True)
    for i, f in enumerate(files):
        font = TTFont(f)
        cmap = font.getBestCmap() or {}
        want = [ord(c) for c in chars if ord(c) in cmap and c not in covered]
        if not want:
            continue
        opts = subset.Options()
        opts.flavor = None
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=want)
        sub.subset(font)
        covered |= {chr(u) for u in want}
        out = os.path.join(tmp_dir, 'part-%d-%03d.ttf' % (weight, i))
        font.flavor = None
        font.save(out)
        parts.append(out)
    merged = Merger().merge(parts)
    merged.flavor = 'woff2'
    dest = os.path.join(ROOT, 'fonts', 'yuexia-serif-%d.woff2' % weight)
    merged.save(dest)
    for p in parts:
        os.remove(p)
    missing = sorted(c for c in chars if c not in covered and ord(c) > 0x2E80)
    print('weight %d: %d chars, %d bytes, %d CJK chars not in font: %s' % (
        weight, len(covered), os.path.getsize(dest), len(missing), ''.join(missing[:40])))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    chars = used_chars()
    for w in (400, 700):
        build(sys.argv[1], w, chars)
    os.rmdir(os.path.join(ROOT, 'fonts', '.tmp'))
