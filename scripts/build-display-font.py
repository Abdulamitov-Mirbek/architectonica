"""
Build the display font: Unbounded plus the Kyrgyz letters it lacks.

Unbounded (OFL) has no Ү ү Ө ө Ң ң, so browsers fill them in from Arial and the
Kyrgyz headings look uneven. This script makes static instances of Unbounded at
the weights the site uses and adds the six letters as composites of Unbounded's
own glyphs, so they share its stroke weight and width:

  Ү = Y            Ө / ө = O / o with a hyphen stretched across as the bar
  ү = v + a stem from the baseline down to the descender
  Ң / ң = Н / н with the descender tail measured from Ц / ц

The pieces are drawn into plain outlines (not composites), because the bar of Ө
needs a horizontal stretch beyond the 2x a TrueType component allows.

Usage (needs fonttools and brotli):
  curl -L -o Unbounded.ttf "https://github.com/google/fonts/raw/main/ofl/unbounded/Unbounded%5Bwght%5D.ttf"
  python scripts/build-display-font.py Unbounded.ttf src/fonts
"""

import io
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.varLib.instancer import instantiateVariableFont

WEIGHTS = [400, 500, 600]
FAMILY = 'Architectonica Display'
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + list(range(0x400, 0x460))
    + [0x490, 0x491, 0x4A2, 0x4A3, 0x4AE, 0x4AF, 0x4E8, 0x4E9]
    + list(range(0x2010, 0x2027)) + [0x2030, 0x2039, 0x203A, 0x20AC, 0x2116, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2248]
)


def bounds(font, name):
    gs = font.getGlyphSet()
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    return pen.bounds  # xMin, yMin, xMax, yMax


def points_below(font, name, y=0):
    glyf = font['glyf']
    coords, _, _ = glyf[name].getCoordinates(glyf)
    return [(px, py) for px, py in coords if py < y]


def comp(name, x=0, y=0, sx=1.0, sy=1.0):
    return name, (sx, 0, 0, sy, x, y)


def add(font, name, code, components, advance, lsb_from):
    """Draw the components (glyph name + affine transform) into one outline glyph."""
    gs = font.getGlyphSet()
    pen = TTGlyphPen(gs)
    for base, t in components:
        gs[base].draw(TransformPen(pen, t))
    g = pen.glyph()
    font['glyf'][name] = g
    order = font.getGlyphOrder()
    if name not in order:
        font.setGlyphOrder(order + [name])
        font['glyf'].glyphOrder = font.getGlyphOrder()
    g.recalcBounds(font['glyf'])
    font['hmtx'][name] = (advance, g.xMin if g.numberOfContours else 0)
    for table in font['cmap'].tables:
        if table.isUnicode():
            table.cmap[code] = name


def build(src: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    for w in WEIGHTS:
        font = TTFont(src)
        cm = font.getBestCmap()
        g = lambda ch: cm[ord(ch)]
        instantiateVariableFont(font, {'wght': w}, inplace=True)
        hmtx = font['hmtx']

        stem_x0, _, stem_x1, stem_top = bounds(font, 'l')
        stem_w = stem_x1 - stem_x0
        hy = bounds(font, 'hyphen')

        # Ө, ө: the round letter with a hyphen stretched across its middle
        for code, base in ((0x4E8, 'O'), (0x4E9, 'o')):
            x0, y0, x1, y1 = bounds(font, base)
            inset = stem_w * 0.5
            sx = (x1 - x0 - 2 * inset) / (hy[2] - hy[0])
            bar = comp('hyphen', x=x0 + inset - hy[0] * sx, y=(y0 + y1) / 2 - (hy[1] + hy[3]) / 2, sx=sx)
            add(font, f'uni{code:04X}', code, [comp(base), bar], hmtx[base][0], hmtx[base][1])

        # Ү is the Latin Y
        add(font, 'uni04AE', 0x4AE, [comp('Y')], *hmtx['Y'])

        # ү: v on top of a stem that runs from the baseline to the descender of р
        vx0, _, vx1, _ = bounds(font, 'v')
        desc = bounds(font, g('р'))[1]
        top = stem_w * 0.8
        sy = (top - desc) / stem_top
        stem = comp('l', x=(vx0 + vx1) / 2 - (stem_x0 + stem_x1) / 2, y=desc, sy=sy)
        add(font, 'uni04AF', 0x4AF, [comp('v'), stem], *hmtx['v'])

        # Ң, ң: Н / н plus the descender tail of Ц / ц
        for code, base_ch, tail_ch in ((0x4A2, 'Н', 'Ц'), (0x4A3, 'н', 'ц')):
            base, tail = g(base_ch), g(tail_ch)
            pts = points_below(font, tail)
            tx0, tx1 = min(p[0] for p in pts), max(p[0] for p in pts)
            tdepth = min(p[1] for p in pts)
            txmax = bounds(font, tail)[2]
            bx1 = bounds(font, base)[2]
            right = bx1 + (tx1 - txmax)
            sx = (tx1 - tx0) / stem_w
            sy = (top - tdepth) / stem_top
            piece = comp('l', x=right - (tx1 - tx0) - stem_x0 * sx, y=tdepth, sx=sx, sy=sy)
            adv = hmtx[base][0] + max(0, round(right - bx1))
            add(font, f'uni{code:04X}', code, [comp(base), piece], adv, hmtx[base][1])

        for rec in font['name'].names:
            if rec.nameID in (1, 16):
                rec.string = FAMILY
            elif rec.nameID in (4,):
                rec.string = f'{FAMILY} {w}'
            elif rec.nameID == 6:
                rec.string = f'ArchitectonicaDisplay-{w}'

        # round-trip so every table agrees on the new glyph order before subsetting
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        font = TTFont(buf)

        opts = Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        sub = Subsetter(opts)
        sub.populate(unicodes=UNICODES)
        sub.subset(font)
        font.flavor = 'woff2'
        out = out_dir / f'display-{w}.woff2'
        font.save(out)
        print(out, out.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    build(Path(sys.argv[1]), Path(sys.argv[2]))
