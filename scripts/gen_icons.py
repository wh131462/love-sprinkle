#!/usr/bin/env python3
"""Generate perfectly-centred heart-shaped PNG icons for Chrome extension.

Uses the classic implicit heart equation:  (x² + y² − 1)³ − x²·y³ < 0
"""

import struct, zlib, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')


def create_png(width, height, pixels):
    """Encode RGBA pixel rows into valid PNG bytes."""
    def chunk(ctype, data):
        c = ctype + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)

    raw = b''
    for row in pixels:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += struct.pack('BBBB', r, g, b, a)

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', zlib.compress(raw))
            + chunk(b'IEND', b''))


def heart_inside(x, y):
    """Return True if (x,y) is inside the implicit heart shape."""
    return (x * x + y * y - 1) ** 3 - x * x * y * y * y < 0


def find_bounds(step=0.01):
    """Numerically find the bounding box of the heart in math coords."""
    x_min, x_max = 0.0, 0.0
    y_min, y_max = 0.0, 0.0
    first = True
    # Scan a generous region
    for x in (i * step for i in range(int(-2 / step), int(2 / step) + 1)):
        for y in (j * step for j in range(int(-2 / step), int(2.5 / step) + 1)):
            if heart_inside(x, y):
                if first:
                    x_min = x_max = x
                    y_min = y_max = y
                    first = False
                else:
                    if x < x_min: x_min = x
                    if x > x_max: x_max = x
                    if y < y_min: y_min = y
                    if y > y_max: y_max = y
    return x_min, x_max, y_min, y_max


# Compute bounds once — they are the same for all icon sizes.
X_MIN, X_MAX, Y_MIN, Y_MAX = find_bounds()
X_SPAN = X_MAX - X_MIN
Y_SPAN = Y_MAX - Y_MIN
# Heart vertical centre in math coords
Y_CENTRE = (Y_MIN + Y_MAX) / 2.0

print(f'Heart bounds: x=[{X_MIN:.2f}, {X_MAX:.2f}]  y=[{Y_MIN:.2f}, {Y_MAX:.2f}]')
print(f'Spans: {X_SPAN:.2f} × {Y_SPAN:.2f}  y_centre={Y_CENTRE:.3f}')


def render(size):
    """Render a size×size RGBA icon with the heart perfectly centred."""

    # Scale so the heart fills the icon with ~10% margin on each side.
    # Use the wider dimension (x) to determine scale.
    margin = size * 0.10
    scale = (size - 2 * margin) / X_SPAN

    # Centre in pixel space.
    # pixel = centre − math·scale   (because pixel Y goes ↓, math Y goes ↑)
    # So for the heart's vertical centre to land at S/2:
    #   S/2 = cy − Y_CENTRE·scale   →   cy = S/2 + Y_CENTRE·scale
    cx = size / 2.0
    cy = size / 2.0 + Y_CENTRE * scale

    rows = []
    for py in range(size):
        row = []
        for px in range(size):
            hx = (px - cx) / scale
            hy = (cy - py) / scale          # flip Y

            if heart_inside(hx, hy):
                # Gradient: dark rose at bottom → soft pink at top lobes
                t = (hy - Y_MIN) / Y_SPAN    # 0 at bottom, 1 at top
                t = max(0.0, min(1.0, t))

                r = int(200 + 55 * t)
                g = int(50 + 95 * t)
                b = int(70 + 75 * t)
                row.append((r, g, b, 255))
            else:
                # Anti-alias: sample a ~1-pixel neighbourhood
                step = 1.0 / scale
                hits = 0
                for dx in (-step, 0, step):
                    for dy in (-step, 0, step):
                        if dx == 0 and dy == 0:
                            continue
                        if heart_inside(hx + dx, hy + dy):
                            hits += 1
                if 0 < hits < 8:
                    a = int(255 * hits / 8)
                    row.append((220, 80, 100, a))
                else:
                    row.append((0, 0, 0, 0))

        rows.append(row)
    return rows


# ====================================================================
for size in [16, 48, 128]:
    pixels = render(size)
    png    = create_png(size, size, pixels)
    path   = os.path.join(OUT, f'icon{size}.png')
    with open(path, 'wb') as f:
        f.write(png)
    print(f'  → icon{size}.png  ({len(png):>4} bytes)')
