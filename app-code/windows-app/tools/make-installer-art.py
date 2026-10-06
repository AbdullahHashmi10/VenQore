"""
Branded Windows-installer art, V6 palette. Writes:
  build/installerSidebar.bmp    164x314, 24-bit  (Welcome + Finish pages)
  build/uninstallerSidebar.bmp  same
NSIS only accepts 24-bit BMPs. Needs: pip install pillow fonttools brotli
Fonts are the bundled V6 families (woff2 -> ttf on the fly). Run: python3 tools/make-installer-art.py
"""
import io, os, math
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 164, 314
S = 4                                   # draw at 4x, then downsample for crisp edges
TEAL300, TEAL400, TEAL500 = (89, 219, 192), (35, 196, 166), (11, 170, 143)
INK950, TEAL950, TEAL900 = (13, 20, 18), (6, 36, 33), (11, 58, 53)

def font(woff2, weight, size):
    f = TTFont(os.path.join(ROOT, 'assets/fonts', woff2)); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    ft = ImageFont.truetype(buf, size * S)
    ft.set_variation_by_axes([weight])
    return ft

img = Image.new('RGB', (W * S, H * S), INK950)
px = img.load()
# vertical gradient ink -> deep teal
for y in range(H * S):
    t = y / (H * S - 1)
    c = tuple(int(INK950[i] + (TEAL950[i] - INK950[i]) * (t ** 1.4)) for i in range(3))
    for x in range(W * S):
        px[x, y] = c

# soft teal glow behind the mark
glow = Image.new('RGB', img.size, (0, 0, 0))
ImageDraw.Draw(glow).ellipse([(W * S * 0.5 - 70 * S), (74 * S - 70 * S), (W * S * 0.5 + 70 * S), (74 * S + 70 * S)], fill=(10, 120, 102))
glow = glow.filter(ImageFilter.GaussianBlur(34 * S))
img = Image.blend(img, Image.composite(glow, img, glow.convert('L')), 0.9)
img = Image.eval(img, lambda v: v)  # keep as RGB
from PIL import ImageChops
img = ImageChops.add(Image.new('RGB', img.size, (0, 0, 0)), img)

# faint isometric grid, fading toward the bottom
d = ImageDraw.Draw(img, 'RGBA')
step = 22 * S
for k in range(-20, 40):
    x0 = k * step
    a = 18
    d.line([(x0, 0), (x0 + H * S * 0.577, H * S)], fill=(89, 219, 192, a), width=S)
    d.line([(x0 + H * S * 0.577, 0), (x0, H * S)], fill=(89, 219, 192, a), width=S)

# the mark
icon = Image.open(os.path.join(ROOT, 'assets/icon.png')).convert('RGBA')
size = 92 * S
icon = icon.resize((size, size), Image.LANCZOS)
img.paste(icon, ((W * S - size) // 2, 30 * S), icon)

# wordmark
d = ImageDraw.Draw(img)
def centered(text, y, ft, fill, tracking=0):
    wid = sum(d.textlength(ch, font=ft) + tracking for ch in text) - tracking
    x = (W * S - wid) / 2
    for ch in text:
        d.text((x, y * S), ch, font=ft, fill=fill)
        x += d.textlength(ch, font=ft) + tracking

centered('VenQore', 140, font('bricolage-grotesque-latin-wght-normal.woff2', 700, 27), (241, 245, 242))
centered('STATION', 177, font('plus-jakarta-sans-latin-wght-normal.woff2', 700, 11), TEAL300, tracking=4 * S)
# hairline
d.line([(62 * S, 202 * S), (102 * S, 202 * S)], fill=TEAL500, width=2 * S)
tag = font('plus-jakarta-sans-latin-wght-normal.woff2', 500, 10)
centered('Printers, scanners,', 214, tag, (180, 192, 186))
centered('scales and drawers.', 229, tag, (180, 192, 186))
centered('One bridge to your POS.', 244, tag, (139, 154, 147))
centered('venqore.com', 290, font('plus-jakarta-sans-latin-wght-normal.woff2', 600, 9), TEAL400, tracking=S)

out = img.resize((W, H), Image.LANCZOS)
for name in ('installerSidebar.bmp', 'uninstallerSidebar.bmp'):
    out.save(os.path.join(ROOT, 'build', name), 'BMP')
out.save('/tmp/sidebar-preview.png')
print('written', out.size)
