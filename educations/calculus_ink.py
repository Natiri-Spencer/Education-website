"""Conservative, review-required single-stroke calculus glyph templates.

These are geometric helpers for Maths mode, not additions to the trained CTC
vocabulary. They deliberately leave unfamiliar shapes as ink/model candidates.
"""
import math

INTEGRAL = [(0.95,.08),(.8,0),(.62,.03),(.5,.16),(.44,.38),(.39,.64),(.32,.86),(.2,.98),(.08,1),(0,.92)]
PARTIAL = [(.15,.06),(.42,0),(.73,.1),(.94,.3),(1,.55),(.85,.82),(.6,.98),(.3,1),(.08,.85),(0,.65),(.15,.48),(.4,.43),(.7,.48),(.94,.6)]


def _sample(points, count=32):
    lengths = [0.]
    for a, b in zip(points, points[1:]):
        lengths.append(lengths[-1]+math.dist(a,b))
    if lengths[-1] <= 0:
        return []
    output, segment = [], 1
    for i in range(count):
        distance = lengths[-1]*i/(count-1)
        while segment < len(points)-1 and lengths[segment] < distance:
            segment += 1
        a, b = points[segment-1], points[segment]
        t = (distance-lengths[segment-1])/max(1e-12,lengths[segment]-lengths[segment-1])
        output.append((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))
    return output


def calculus_symbol(stroke):
    points = stroke['points']
    if len(points) < 5:
        return None
    left, top = min(p[0] for p in points), min(p[1] for p in points)
    w, h = max(p[0] for p in points)-left, max(p[1] for p in points)-top
    if h < 24 or w < 5:
        return None
    normalized = _sample([((x-left)/w,(y-top)/h) for x,y in points])
    for label, template, ratio in (("\u222b",INTEGRAL,(.12,.55)),("\u2202",PARTIAL,(.45,1.05))):
        if not ratio[0] <= w/h <= ratio[1]:
            continue
        target = _sample(template)
        score = min(math.sqrt(sum(math.dist(a,b)**2 for a,b in zip(normalized, candidate))/len(target)) for candidate in (target,list(reversed(target))))
        if score < .085:
            return label
    return None
