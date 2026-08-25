#!/usr/bin/env python3
"""Иконка, adaptive-icon и splash из одного исходника scripts/brand.html.

    python3 scripts/shoot-brand.py

Кладёт PNG в assets/images/. Дев-сервер не нужен — страница открывается как file://.
"""

import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "scripts" / "brand.html"
OUT = ROOT / "assets" / "images"

# variant -> (файл, сторона, прозрачность)
VARIANTS = [
    ("icon", "icon.png", 1024, False),
    ("adaptive", "adaptive-icon.png", 1024, True),
    ("splash", "splash-icon.png", 512, True),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for variant, name, side, alpha in VARIANTS:
            page = browser.new_context(
                viewport={"width": 1024, "height": 1024},
                device_scale_factor=1,
            ).new_page()
            page.goto(f"{PAGE.as_uri()}?v={variant}")
            page.wait_for_timeout(200)
            path = OUT / name
            page.screenshot(path=str(path), omit_background=alpha)
            img = Image.open(path)
            img = img.convert("RGBA" if alpha else "RGB").resize((side, side), Image.LANCZOS)
            img.save(path, "PNG")
            print("✓", name, img.size, img.mode)
        browser.close()


if __name__ == "__main__":
    main()
