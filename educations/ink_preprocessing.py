"""Rasterization shared by training and inference (white ink on black)."""
import math
from PIL import Image, ImageDraw

HEIGHT = 32
MAX_WIDTH = 512


def rasterize(strokes, thickness=1.5):
    points = [point for stroke in strokes for point in stroke]
    if not points:
        raise ValueError("Empty ink")
    left, top = min(p[0] for p in points), min(p[1] for p in points)
    width = max(1., max(p[0] for p in points) - left)
    height = max(1., max(p[1] for p in points) - top)
    scale = min((HEIGHT - 6) / height, (MAX_WIDTH - 6) / width)
    target_width = max(16, min(MAX_WIDTH, math.ceil(width * scale) + 6))
    # Supersampling removes sensitivity to device pixel density and point rate.
    image = Image.new("L", (target_width * 3, HEIGHT * 3))
    draw = ImageDraw.Draw(image)
    pen_width = max(2, round(thickness * 3))
    for stroke in strokes:
        line = [((x-left)*scale*3+9, (y-top)*scale*3+9) for x, y in stroke]
        if len(line) > 1:
            draw.line(line, fill=255, width=pen_width, joint="curve")
        for x, y in (line[0], line[-1]):
            r = pen_width / 2
            draw.ellipse((x-r, y-r, x+r, y+r), fill=255)
    return image.resize((target_width, HEIGHT), Image.Resampling.LANCZOS)
