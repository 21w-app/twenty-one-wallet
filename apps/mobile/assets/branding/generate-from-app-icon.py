#!/usr/bin/env python3
"""Derive branding assets from app-icon.png (source of truth)."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

APPROVED = Path(__file__).resolve().parent / "approved"
ICON_PATH = APPROVED / "app-icon.png"


def is_white(r: int, g: int, b: int, a: int) -> bool:
    return a > 128 and r > 200 and g > 200 and b > 200


def is_orange(r: int, g: int, b: int, a: int) -> bool:
    return a > 128 and r > 200 and g > 100 and b < 80


def is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 128:
        return True

    return is_white(r, g, b, a)


def flood_background(
    icon: Image.Image,
    seeds: list[tuple[int, int]],
) -> set[tuple[int, int]]:
    w, h = icon.size
    px = icon.load()
    seen: set[tuple[int, int]] = set()
    q: deque[tuple[int, int]] = deque(seeds)

    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        if not is_background_pixel(*px[x, y]):
            continue
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q.append((x + dx, y + dy))

    return seen


def make_app_icon_transparent(icon: Image.Image) -> Image.Image:
    icon = icon.convert("RGBA")
    w, h = icon.size
    background = flood_background(
        icon,
        [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)],
    )

    result = icon.copy()
    out = result.load()
    for x, y in background:
        out[x, y] = (0, 0, 0, 0)

    return result


def extract_logo_mark(icon: Image.Image) -> Image.Image:
    w, h = icon.size
    px = icon.load()
    background = flood_background(
        icon,
        [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)],
    )

    logo_pixels: set[tuple[int, int]] = set()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_orange(r, g, b, a) or (is_white(r, g, b, a) and (x, y) not in background):
                logo_pixels.add((x, y))

    xs = [p[0] for p in logo_pixels]
    ys = [p[1] for p in logo_pixels]
    pad = 18
    bbox = (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + pad + 1),
        min(h, max(ys) + pad + 1),
    )

    cropped = icon.crop(bbox)
    logo_rgba = Image.new("RGBA", cropped.size, (0, 0, 0, 0))
    lm = cropped.load()
    out = logo_rgba.load()
    ox, oy = bbox[0], bbox[1]

    for y in range(cropped.height):
        for x in range(cropped.width):
            if (x + ox, y + oy) in logo_pixels:
                out[x, y] = lm[x, y]

    return logo_rgba


def build_padded_icon_canvas(
    logo: Image.Image,
    canvas_size: int,
    logo_width_fraction: float,
) -> Image.Image:
    logo_w = int(canvas_size * logo_width_fraction)
    scale = logo_w / logo.width
    logo_h = max(1, int(logo.height * scale))
    logo_scaled = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - logo_w) // 2
    y = (canvas_size - logo_h) // 2
    canvas.alpha_composite(logo_scaled, (x, y))
    return canvas


def main() -> None:
    icon = Image.open(ICON_PATH).convert("RGBA")
    transparent = make_app_icon_transparent(icon.copy())

    logo = extract_logo_mark(transparent)
    logo.save(APPROVED / "logo-mark-extracted.png")

    icon_size = 1024
    icon_max_w = int(icon_size * 0.72)
    icon_max_h = int(icon_size * 0.28)
    icon_scale = min(icon_max_w / logo.width, icon_max_h / logo.height)
    icon_logo_w = max(1, int(logo.width * icon_scale))
    icon_logo_h = max(1, int(logo.height * icon_scale))
    icon_logo = logo.resize((icon_logo_w, icon_logo_h), Image.Resampling.LANCZOS)

    app_icon = Image.new("RGB", (icon_size, icon_size), (0, 0, 0))
    app_icon_x = (icon_size - icon_logo_w) // 2
    app_icon_y = (icon_size - icon_logo_h) // 2
    app_icon.paste(icon_logo, (app_icon_x, app_icon_y), icon_logo)
    app_icon.save(APPROVED / "app-icon.png")

    # 50.8% logo width on a 1024 canvas fits Android adaptive-icon and
    # splash-screen circular safe zones (66% inner diameter).
    padded_icon_logo_fraction = 0.508
    padded_icon = build_padded_icon_canvas(logo, icon_size, padded_icon_logo_fraction)
    padded_icon.save(APPROVED / "android-adaptive-icon-foreground.png")
    padded_icon.save(APPROVED / "android-splash-icon.png")

    header_h = 120
    header_w = max(1, int(logo.width * (header_h / logo.height)))
    header_logo = logo.resize((header_w, header_h), Image.Resampling.LANCZOS)
    header = Image.new("RGBA", (header_w, header_h), (0, 0, 0, 255))
    header.paste(header_logo, (0, 0), header_logo)
    header.convert("RGB").save(APPROVED / "logo-header.png")

    splash_w, splash_h = 1284, 2778
    max_w = int(splash_w * 0.52)
    max_h = int(splash_h * 0.16)
    scale = min(max_w / logo.width, max_h / logo.height)
    tw = max(1, int(logo.width * scale))
    th = max(1, int(logo.height * scale))
    logo_scaled = logo.resize((tw, th), Image.Resampling.LANCZOS)

    splash = Image.new("RGB", (splash_w, splash_h), (0, 0, 0))
    x = (splash_w - tw) // 2
    y = (splash_h - th) // 2
    splash.paste(logo_scaled, (x, y), logo_scaled)
    splash.save(APPROVED / "splash-screen.png")


if __name__ == "__main__":
    main()
