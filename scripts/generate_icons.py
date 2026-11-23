#!/usr/bin/env python3
"""Regenerate every app icon from design/logo-source.png (the Hmm logo: a rounded glass tile on a dark square).

Writes the web/PWA icons into public/icons, the favicons into public/, and the Android icon inputs
(assets/icon-only.png and assets/icon-foreground.png) that .github/workflows/apk.yml feeds to capacitor-assets.
Requires Pillow:  python3 scripts/generate_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "logo-source.png"
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

full = Image.open(SRC).convert("RGB")
BG = full.getpixel((4, 4))  # the logo's own near-black navy
# Crop away the empty glow around the glass tile, so the logo fills the icon instead of floating small in it.
logo = full.crop((80, 60, 1174, 1154))


def square(n: int) -> Image.Image:
    return logo.resize((n, n), Image.LANCZOS)


def padded(n: int, fraction: float, transparent: bool = False) -> Image.Image:
    """Logo centred at `fraction` of the canvas, on the logo's background colour (or transparent)."""
    canvas = Image.new("RGBA", (n, n), (0, 0, 0, 0) if transparent else BG + (255,))
    size = round(n * fraction)
    canvas.paste(square(size), ((n - size) // 2, (n - size) // 2))
    return canvas


for n in (96, 128, 192, 512):
    square(n).save(OUT / f"icon-{n}.png", optimize=True)
square(180).save(OUT / "apple-touch-icon.png", optimize=True)
padded(512, 0.86).convert("RGB").save(OUT / "maskable-512.png", optimize=True)  # Android maskable safe zone
square(32).save(ROOT / "public" / "favicon-32.png", optimize=True)
square(64).save(ROOT / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

assets = ROOT / "assets"
assets.mkdir(exist_ok=True)
square(1024).save(assets / "icon-only.png", optimize=True)
padded(1024, 0.94).save(assets / "icon-foreground.png", optimize=True)
print("icons written; adaptive background colour", "#%02x%02x%02x" % BG)
