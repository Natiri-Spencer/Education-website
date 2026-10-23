"""Conservative line boundaries before any fraction/calculus interpretation."""
from statistics import median
from .ink_layout import box, equation_bar, equals_pair

VERSION = "equation-lines-v1"


def equation_lines(strokes):
    """Use repeated equals signs as baselines; never cut a crossing stroke.

    Without two separated baselines, keep the full region for spatial parsing.
    Fractions and scripts are therefore not split just because they have gaps.
    """
    bars = [s for s in strokes if equation_bar(s)]
    anchors = []
    for i, a in enumerate(bars):
        for b in bars[i+1:]:
            if equals_pair(a, b, strokes):
                bounds = box([a, b])
                cy = bounds['y'] + bounds['h']/2
                if not any(abs(cy-y) < max(8, bounds['h']) for y in anchors):
                    anchors.append(cy)
    heights = [box([s])['h'] for s in strokes if box([s])['h'] > 12]
    typical = median(heights) if heights else 30
    anchors.sort()
    if len(anchors) < 2 or any(b-a < typical*1.1 for a, b in zip(anchors, anchors[1:])):
        return [strokes]
    boundaries = [(a+b)/2 for a,b in zip(anchors,anchors[1:])]
    groups = [[] for _ in anchors]
    for stroke in strokes:
        b = box([stroke])
        # Ambiguous connected working must stay intact for manual review.
        if any(b['y']+2 < y < b['y']+b['h']-2 for y in boundaries):
            return [strokes]
        cy = b['y']+b['h']/2
        groups[sum(cy > y for y in boundaries)].append(stroke)
    return [group for group in groups if group]


def formula_crop(strokes):
    """Black ink, white background, aspect preserved; reject unreadable scale."""
    from PIL import Image, ImageDraw
    import math
    b = box(strokes)
    scale = min(3., 160/b['h'])
    if b['w']*scale > 3000:
        raise ValueError('This region is too wide. Review smaller groups of lines.')
    pad = 16
    image = Image.new('RGB', (math.ceil(b['w']*scale)+pad*2, math.ceil(b['h']*scale)+pad*2), 'white')
    draw = ImageDraw.Draw(image)
    width = max(2, round(scale*1.5))
    for stroke in strokes:
        points = [((x-b['x'])*scale+pad,(y-b['y'])*scale+pad) for x,y in stroke['points']]
        if len(points)>1:
            draw.line(points,fill='black',width=width,joint='curve')
        for x,y in (points[0],points[-1]):
            draw.ellipse((x-width/2,y-width/2,x+width/2,y+width/2),fill='black')
    return image
