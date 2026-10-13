"""Ember Finance app icon generator (production assets).

Mark: two-tone flame on terracotta. Outputs:
  assets/icon.png            1024x1024 launcher (full-bleed, launcher masks it)
  assets/adaptive-icon.png   1024x1024, mark inside the 432px safe circle
  assets/splash.png          1284x2778 warm background + centered mark
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ACCENT = (200, 110, 75)      # #C86E4B terracotta
CREAM = (250, 247, 242)       # #FAF7F2 warm off-white
INK = (28, 25, 23)

# Outer flame outline as cubic beziers in a 512 box (P0, C1, C2, P1).
# Swept tip + left notch so it reads as fire, not a droplet.
OUTER = [
    ((352, 58), (388, 110), (404, 180), (398, 250)),
    ((398, 250), (394, 330), (380, 395), (335, 415)),
    ((335, 415), (295, 442), (272, 452), (256, 452)),
    ((256, 452), (228, 452), (188, 442), (168, 418)),
    ((168, 418), (132, 375), (112, 335), (112, 295)),
    ((112, 295), (112, 250), (125, 220), (150, 200)),
    ((150, 200), (175, 185), (200, 160), (232, 148)),
    ((232, 148), (265, 132), (300, 100), (352, 58)),
]

# Inner cutout (drawn in background color).
INNER = [
    ((272, 232), (295, 255), (310, 280), (312, 300)),
    ((312, 300), (310, 340), (300, 365), (282, 378)),
    ((282, 378), (258, 390), (240, 392), (228, 392)),
    ((228, 392), (210, 370), (198, 350), (198, 330)),
    ((198, 330), (198, 305), (202, 288), (214, 272)),
    ((214, 272), (226, 258), (248, 244), (272, 232)),
]


def cubic(p0, c1, c2, p1, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t**3 * p1[0]
        y = u**3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t**3 * p1[1]
        pts.append((x, y))
    return pts


def flame_polys():
    outer = []
    for seg in OUTER:
        outer += cubic(*seg)
    inner = []
    for seg in INNER:
        inner += cubic(*seg, n=16)
    return outer, inner


def draw_mark(draw, cx, cy, size, fg, bg):
    """Draw flame centered at (cx, cy) with bounding box `size`."""
    s = size / 512.0
    ox, oy = cx - 256 * s, cy - 256 * s
    outer, inner = flame_polys()
    draw.polygon([(ox + x * s, oy + y * s) for x, y in outer], fill=fg)
    draw.polygon([(ox + x * s, oy + y * s) for x, y in inner], fill=bg)


def wordmark(draw, cx, y, size, color):
    for name in ("arialbd.ttf", "Arial Bold.ttf"):
        p = os.path.join("C:\\Windows\\Fonts", name)
        if os.path.exists(p):
            try:
                f = ImageFont.truetype(p, size)
                draw.text((cx, y), "Ember Finance", font=f, fill=color, anchor="ma")
                return True
            except Exception:
                pass
    return False


def main():
    os.makedirs(HERE, exist_ok=True)

    # 1. Launcher icon - full bleed.
    icon = Image.new("RGB", (1024, 1024), ACCENT)
    d = ImageDraw.Draw(icon)
    draw_mark(d, 512, 540, 560, CREAM, ACCENT)
    icon.save(os.path.join(HERE, "icon.png"))

    # 2. Adaptive foreground - full bleed, mark inside safe circle.
    ad = Image.new("RGB", (1024, 1024), ACCENT)
    d = ImageDraw.Draw(ad)
    draw_mark(d, 512, 512, 400, CREAM, ACCENT)
    ad.save(os.path.join(HERE, "adaptive-icon.png"))

    # 3. Splash - warm bg, centered mark + wordmark.
    sp = Image.new("RGB", (1284, 2778), CREAM)
    d = ImageDraw.Draw(sp)
    draw_mark(d, 642, 1260, 420, ACCENT, CREAM)
    wordmark(d, 642, 1560, 92, INK)
    sp.save(os.path.join(HERE, "splash.png"))

    print("wrote icon.png, adaptive-icon.png, splash.png")


if __name__ == "__main__":
    main()
