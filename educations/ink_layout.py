"""Spatial ink layout around the installed text recognizer.

Operators and fraction bars are read from their geometry, not guessed by an
English dictionary. Unread operands keep the entire expression as source ink.
This is deliberately a bounded school-maths layout layer, not a CAS/solver.
"""
import math
import re
from statistics import median
from .calculus_ink import calculus_symbol


def box(strokes):
    points = [p for s in strokes for p in s["points"]]
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    return dict(x=min(xs), y=min(ys), w=max(1, max(xs)-min(xs)), h=max(1, max(ys)-min(ys)))


def node(strokes, kind="ink", **extra):
    return dict(strokes=strokes, box=box(strokes), kind=kind, **extra)


def straight(stroke):
    points = stroke["points"]
    a, b = points[0], points[-1]
    length = math.dist(a, b)
    travel = sum(math.dist(p, q) for p, q in zip(points, points[1:]))
    if length < 8 or travel > length * 1.18:
        return None
    deviation = max(abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])) / length for p in points)
    return (a, b) if deviation <= max(3, length * .045) else None


def horizontal(stroke):
    b = box([stroke])
    return straight(stroke) and b["w"] >= 12 and b["h"] < max(4, b["w"] * .12)


def equation_bar(stroke):
    """Allow the small slope and wobble common in handwritten equals bars."""
    points = stroke["points"]
    b = box([stroke])
    if len(points) < 2 or b["w"] < 10 or b["h"] > max(7, b["w"] * .28):
        return False
    travel = sum(math.dist(p, q) for p, q in zip(points, points[1:]))
    return travel <= b["w"] * 1.45 and abs(points[-1][0]-points[0][0]) >= b["w"] * .72


def equals_pair(a, other, strokes):
    """Recognize two aligned pen strokes while excluding bars in letters."""
    if a is other or not equation_bar(a) or not equation_bar(other):
        return False
    b, q = box([a]), box([other])
    gap = abs(q["y"]+q["h"]/2-b["y"]-b["h"]/2)
    widest = max(b["w"], q["w"])
    aligned = (.5 <= q["w"]/b["w"] <= 2 and
               .10*widest <= gap <= .85*widest and
               abs(q["x"]+q["w"]/2-b["x"]-b["w"]/2) < widest*.28)
    if not aligned:
        return False
    # Ignore the partner while checking for an E/F/H-style supporting stem.
    without_partner = [s for s in strokes if s is not other]
    without_a = [s for s in strokes if s is not a]
    return not attached_bar(a, without_partner) and not attached_bar(other, without_a)


def _sample_path(points, count=24):
    lengths = [0.]
    for a, b in zip(points, points[1:]):
        lengths.append(lengths[-1] + math.dist(a, b))
    if lengths[-1] <= 0:
        return []
    result, segment = [], 1
    for index in range(count):
        distance = lengths[-1] * index / (count-1)
        while segment < len(points)-1 and lengths[segment] < distance:
            segment += 1
        a, b = points[segment-1], points[segment]
        ratio = (distance-lengths[segment-1]) / max(1e-9, lengths[segment]-lengths[segment-1])
        result.append((a[0]+(b[0]-a[0])*ratio, a[1]+(b[1]-a[1])*ratio))
    return result


def _simple_math_glyph(strokes):
    """Read a few unambiguous classroom glyphs before the neural fallback."""
    if len(strokes) == 2:
        lines = [straight(stroke) for stroke in strokes]
        if all(lines):
            boxes = [box([stroke]) for stroke in strokes]
            slopes = [(line[1][1]-line[0][1])/(line[1][0]-line[0][0] or 1e-9) for line in lines]
            overlap_x = min(b['x']+b['w'] for b in boxes)-max(b['x'] for b in boxes)
            overlap_y = min(b['y']+b['h'] for b in boxes)-max(b['y'] for b in boxes)
            if (slopes[0]*slopes[1] < -.2 and overlap_x > 0 and overlap_y > 0 and
                    all(.35 <= b['w']/b['h'] <= 2.8 for b in boxes)):
                return 'x'
    if len(strokes) != 1:
        return None
    stroke = strokes[0]; b = box(strokes)
    if b['h'] >= 18 and b['h'] >= b['w']*5 and straight(stroke):
        return '1'
    if len(stroke['points']) < 5 or not .35 <= b['w']/b['h'] <= 1.15 or b['h'] < 18:
        return None
    normalized = [((x-b['x'])/b['w'], (y-b['y'])/b['h']) for x,y in stroke['points']]
    actual = _sample_path(normalized)
    def score(template):
        expected = _sample_path(template)
        return min(math.sqrt(sum(math.dist(a,c)**2 for a,c in zip(candidate,expected))/len(expected))
                   for candidate in (actual,list(reversed(actual))))
    if actual:
        two = [(0,.13),(.18,0),(.62,0),(1,.18),(.94,.38),(.68,.58),(.08,.91),(0,1),(.96,1)]
        seven = [(0,0),(.45,.02),(1,0),(.78,.22),(.58,.5),(.38,.78),(.24,1)]
        if score(two) < .14:
            return '2'
        if score(seven) < .13:
            return '7'
    return None


def _distance(point, a, b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
    return math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy)


def attached_bar(bar, strokes):
    """Crossbars of E/F/H/A/T remain letters, including small pen gaps."""
    b=box([bar]); cy=b['y']+b['h']/2
    ends=[bar['points'][0],bar['points'][-1]]
    for other in strokes:
        if other is bar or horizontal(other):
            continue
        q=box([other]); tolerance=max(5,min(b['w']*.13,q['h']*.15))
        if q['h'] < b['h']*2 or q['h']<b['w']*.3:
            continue
        segments=list(zip(other['points'],other['points'][1:]))
        if any(_distance(p,a,c)<=tolerance for p in ends for a,c in segments):
            return True
        # The top of a T stem can stop just short of its crossbar.
        if abs(q['y']-cy)<=tolerance and b['x']<=q['x']+q['w']/2<=b['x']+b['w']:
            return True
    return False


def _structure(strokes, hint=False, depth=0):
    if depth > 4:
        return [node([s]) for s in strokes]
    remaining = list(strokes)
    nodes = []
    # A square-root gesture has a short descending hook, rising stem and a
    # long horizontal roof. Require actual ink beneath that roof.
    for root in list(remaining):
        points = root['points']; b = box([root])
        if len(points) < 4 or b['w'] < 35 or b['h'] < 15:
            continue
        end = points[-1]; roof = None
        for index in range(2,len(points)-1):
            p = points[index]
            if end[0]-p[0] > b['w']*.48 and abs(end[1]-p[1]) < b['h']*.15 and all(abs(q[1]-p[1]) < b['h']*.18 for q in points[index:]):
                before = points[:index]
                if max(q[1] for q in before)-p[1] > b['h']*.65 and min(q[0] for q in before) < p[0]:
                    roof = p; break
        if roof is None:
            continue
        inside = [s for s in remaining if s is not root and (q:=box([s]))['x'] >= roof[0]-4 and q['x']+q['w'] <= end[0]+5 and q['y'] >= roof[1]-3 and q['y']+q['h'] <= roof[1]+max(b['h']*2,b['w']*1.25)]
        if inside:
            nodes.append(node([root]+inside,'root',inside=_structure(inside,True,depth+1)))
            ids={s['id'] for s in [root]+inside}; remaining=[s for s in remaining if s['id'] not in ids]
    # Both operands must be inside the bar and on opposite sides. Parallel
    # equals strokes, standalone minus signs and underlines are not fractions.
    for bar in sorted((s for s in remaining if horizontal(s)), key=lambda s: -box([s])["w"]):
        if bar not in remaining or attached_bar(bar,remaining):
            continue
        b = box([bar]); axis = b["y"] + b["h"] / 2
        above, below = [], []
        reach = max(65, b["w"] * 2)
        for s in remaining:
            if s is bar:
                continue
            q = box([s]); cx = q["x"] + q["w"] / 2
            if not b["x"]-b["w"]*.12 <= cx <= b["x"]+b["w"]*1.12 or q["w"] > b["w"]*1.35:
                continue
            if q["y"]+q["h"] < axis-3 and axis-reach < q["y"]:
                above.append(s)
            elif q["y"] > axis+3 and q["y"]+q["h"] < axis+reach:
                below.append(s)
        if not above or not below or not any(box([s])['h']>6 for s in above) or not any(box([s])['h']>6 for s in below) or all(horizontal(s) for s in above+below):
            continue
        # Prefer close operands; a distant paragraph should not turn an
        # underline into a fraction.
        if axis-(box(above)["y"]+box(above)["h"]) > reach*.55 or box(below)["y"]-axis > reach*.55:
            continue
        used = above + [bar] + below
        nodes.append(node(used, "fraction", above=_structure(above, True, depth+1), below=_structure(below, True, depth+1), axis=axis))
        ids = {s["id"] for s in used}; remaining = [s for s in remaining if s["id"] not in ids]
    # Only Maths mode (or an existing math operand) uses calculus templates;
    # ordinary S/f/d handwriting remains available to the text recognizer.
    if hint:
        for stroke in list(remaining):
            if stroke not in remaining:
                continue
            symbol = calculus_symbol(stroke)
            if symbol is None:
                continue
            if symbol == '\u222b':
                b = box([stroke])
                # An f crossbar disqualifies an otherwise integral-like stem.
                if any(other is not stroke and horizontal(other) and
                       b['y']+b['h']*.2 < (q:=box([other]))['y'] < b['y']+b['h']*.8 and
                       q['x'] <= b['x']+b['w'] and q['x']+q['w'] >= b['x'] and
                       any(min(a[1],c[1]) <= q['y'] <= max(a[1],c[1]) and
                           q['x']-2 <= a[0]+(c[0]-a[0])*(q['y']-a[1])/(c[1]-a[1] or 1e-9) <= q['x']+q['w']+2
                           for a,c in zip(stroke['points'],stroke['points'][1:]))
                       for other in remaining):
                    continue
                upper, lower = [], []
                for other in remaining:
                    if other is stroke:
                        continue
                    q = box([other]); cy = q['y']+q['h']/2
                    if q['h'] <= b['h']*.3 and b['x']+b['w']*.4 <= q['x'] <= b['x']+b['w']+b['h']*.35:
                        if abs(cy-b['y']) < b['h']*.2: upper.append(other)
                        elif abs(cy-b['y']-b['h']) < b['h']*.2: lower.append(other)
                used = [stroke]+upper+lower
                nodes.append(node(used,'integral',upper=_structure(upper,True,depth+1),lower=_structure(lower,True,depth+1),needsReview=True,axis=b['y']+b['h']/2))
                remaining = [s for s in remaining if s not in used]
            else:
                nodes.append(node([stroke],'operator',text=symbol,needsReview=True))
                remaining.remove(stroke)
    # Equals first; then plus. Test the crossing position to retain the T in
    # ordinary words instead of interpreting it as a plus sign.
    for a in list(remaining):
        if a not in remaining or not equation_bar(a):
            continue
        b = box([a]); cy = b["y"]+b["h"]/2
        dots=[s for s in remaining if s is not a and (q:=box([s]))['w']<max(5,b['w']*.16) and q['h']<max(5,b['w']*.16) and abs(q['x']-b['x']-b['w']/2)<b['w']*.25 and abs(q['y']-cy)<b['w']*.8]
        upper=[s for s in dots if box([s])['y']<cy-4]; lower=[s for s in dots if box([s])['y']>cy+4]
        if upper and lower:
            used=[a,upper[0],lower[0]]; nodes.append(node(used,'operator',text='÷'))
            remaining=[s for s in remaining if s not in used]; continue
        for other in list(remaining):
            if other is a:
                continue
            q = box([other]); symbol = None
            if equation_bar(other):
                if equals_pair(a, other, remaining):
                    symbol = "="
            elif straight(other) and q["w"] < max(4, q["h"]*.14) and .35 < q["h"]/b["w"] < 2.6:
                if b["x"]+.18*b["w"] < q["x"]+q["w"]/2 < b["x"]+.82*b["w"] and q["y"]+.18*q["h"] < cy < q["y"]+.82*q["h"]:
                    symbol = "+"
            if symbol:
                nodes.append(node([a, other], "operator", text=symbol)); remaining.remove(a); remaining.remove(other)
                break
    maths = hint or any(n["kind"] != "ink" for n in nodes)
    for s in remaining:
        b = box([s])
        crossed = attached_bar(s,remaining) or any(other is not s and not horizontal(other) and
                      (q:=box([other]))["x"] <= b["x"]+b["w"]+3 and q["x"]+q["w"] >= b["x"]-3 and
                      q["y"] <= b["y"]+b["h"]+3 and q["y"]+q["h"] >= b["y"]-3 for other in remaining)
        nodes.append(node([s], "operator", text="−") if maths and horizontal(s) and not crossed else node([s]))
    return nodes


def rows(nodes):
    if not nodes:
        return []
    heights = [n["box"]["h"] for n in nodes if n["kind"] == "ink" and n["box"]["h"] > 7]
    typical = median(heights) if heights else 40
    result = []
    def metrics(n):
        b = n["box"]
        # Keep each text line's actual height. A small body font elsewhere on
        # the board must not clip the cap-to-stem tolerance of a large title.
        height=b['h'] if n['kind']=='ink' else min(b['h'],typical*1.4)
        return (n.get("axis", b["y"]+b["h"]/2), height)
    # Tall glyphs establish lines before dots, crossbars and punctuation.
    for n in sorted(nodes, key=lambda n: -metrics(n)[1]):
        cy, height = metrics(n)
        def script_near(r):
            return height < r['height']*.68 and abs(cy-r['cy']) < r['height']*.95 and any(
                -3 <= n['box']['x']-q['box']['x']-q['box']['w'] < r['height']*.7 for q in r['nodes'])
        matches = [(abs(cy-r["cy"]), r) for r in result if abs(cy-r["cy"]) <= max(12, typical*.68, (height+r["height"])*.28) or script_near(r)]
        if matches:
            r = min(matches, key=lambda p: p[0])[1]; r["nodes"].append(n)
        else:
            result.append(dict(cy=cy, height=height, nodes=[n]))
    return [sorted(r["nodes"], key=lambda n: n["box"]["x"]) for r in sorted(result, key=lambda r: r["cy"])]


def components(nodes):
    """Join the pen strokes of a glyph, retaining small superscripts."""
    groups = []
    for n in sorted(nodes, key=lambda n: n["box"]["x"]):
        b = n["box"]
        matches = []
        for group in groups:
            group_strokes=[s for item in group for s in item["strokes"]]
            a = box(group_strokes)
            overlap_y = min(a["y"]+a["h"], b["y"]+b["h"])-max(a["y"], b["y"])
            overlap_x=min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])
            detached_cap=overlap_x>=0 and overlap_y>=-max(5,max(a['h'],b['h'])*.22)
            linked=any(horizontal(s) and attached_bar(s,group_strokes) for s in n['strokes'])
            gap=max(2,min(a['h'],b['h'])*.12,max(a['h'],b['h'])*.15 if linked else 0)
            if b["x"] <= a["x"]+a["w"]+gap and (overlap_y > -3 or detached_cap):
                matches.append(group)
        if matches:
            matches[0].append(n)
            for group in matches[1:]:
                matches[0].extend(group); groups.remove(group)
        else:
            groups.append([n])
    return [node([s for n in group for s in n["strokes"]]) for group in groups]


def _math_string(nodes):
    """Serialize a spatial expression with fractions, powers and subscripts."""
    if not nodes or any(not n.get("text") for n in nodes):
        return None
    heights = [n["box"]["h"] for n in nodes if n["kind"] == "ink" and n["box"]["h"] > 7]
    # A large leading digit must not turn every normal-sized symbol into a
    # superscript. Use the row's typical glyph size and reserve script layout
    # for marks that are clearly smaller than their neighbours.
    height = median(heights) if heights else 40
    normal = [n for n in nodes if n["kind"] == "ink" and n["box"]["h"] >= height*.72]
    baseline = median([n["box"]["y"]+n["box"]["h"] for n in normal]) if normal else 0
    output = ""
    for n in sorted(nodes, key=lambda n: n["box"]["x"]):
        value, b = n["text"], n["box"]
        if output and n["kind"] == "ink" and b["h"] < height*.68 and b["y"]+b["h"] < baseline-height*.25:
            output += "^("+value+")"
        elif output and n["kind"] == "ink" and b["h"] < height*.68 and b["y"] > baseline-height*.2:
            output += "_("+value+")"
        elif n["kind"] == "operator":
            output += " " + value + " "
        else:
            output += value
    # Keep a unary sign attached to its integer; binary operators keep spaces.
    return re.sub(r"(^|[=(])\s*−\s*(?=\w)", r"\1−", output).strip()


def _paragraphs(words):
    """One editable text block per paragraph; consistent font and line gaps."""
    tokens = []
    for w in words:
        if not w.get("text") or not w.get("strokeIds") or not w.get("box"):
            continue
        b = w["box"]
        text = w['text']
        if text in ('.',',',"'") and b['h']>max(15,b['w']*2):
            text=next((a for a in w.get('alternatives',[]) if re.fullmatch(r'[\wπθ]',a)),text)
        tokens.append(dict(w, text=text, kind="ink", strokes=[], box=b))
    lines = []
    for row in rows(tokens):
        # Very wide gaps denote separate board annotations, not one sentence.
        parts, current = [], []
        for w in row:
            if current:
                a, b = current[-1]["box"], w["box"]
                if b["x"]-a["x"]-a["w"] > max(90, max(a["h"], b["h"])*2.4):
                    parts.append(current); current = []
            current.append(w)
        if current:
            parts.append(current)
        for part in parts:
            b = dict(x=min(w["box"]["x"] for w in part), y=min(w["box"]["y"] for w in part))
            b["w"] = max(w["box"]["x"]+w["box"]["w"] for w in part)-b["x"]
            b["h"] = max(w["box"]["y"]+w["box"]["h"] for w in part)-b["y"]
            text = " ".join(w["text"].strip() for w in part)
            text = re.sub(r"\s+([.,;:!?])", r"\1", text)
            lines.append(dict(text=text, box=b, strokeIds=[s for w in part for s in w["strokeIds"]], alternatives=part[0].get("alternatives", []) if len(part)==1 else [], needsReview=any(w.get('confidence','Strong')!='Strong' for w in part)))
    paragraphs = []
    for line in sorted(lines, key=lambda w: (w["box"]["y"], w["box"]["x"])):
        b = line["box"]; last = paragraphs[-1] if paragraphs else None
        if last:
            a = last["lines"][-1]["box"]
            same_column = abs(a["x"]-b["x"]) <= max(35, max(a["h"], b["h"])*.8)
            close = 0 < b["y"]-a["y"] <= max(a["h"], b["h"])*2.6
            similar = .5 < b["h"]/max(1,a["h"]) < 2
            if same_column and close and similar:
                last["lines"].append(line); continue
        paragraphs.append(dict(lines=[line]))
    result = []
    for paragraph in paragraphs:
        lines = paragraph["lines"]
        first = lines[0]
        all_boxes = [w["box"] for w in lines]
        font = max(18, min(96, median(b["h"] for b in all_boxes)*1.1))
        result.append(dict(text="\n".join(w["text"] for w in lines), format="paragraph", fontSize=font,
                           needsReview=any(w['needsReview'] for w in lines),
                           strokeIds=list(dict.fromkeys(s for w in lines for s in w["strokeIds"])),
                           alternatives=first["alternatives"] if len(lines)==1 else [],
                           box=dict(x=min(b["x"] for b in all_boxes), y=min(b["y"] for b in all_boxes),
                                    w=max(b["x"]+b["w"] for b in all_boxes)-min(b["x"] for b in all_boxes),
                                    h=max(b["y"]+b["h"] for b in all_boxes)-min(b["y"] for b in all_boxes))))
    return result


def recognize_layout(strokes, native, mode="auto"):
    # Establish equation baselines before geometric fractions/calculus can
    # consume strokes belonging to adjacent lines of working.
    from .ink_regions import equation_lines
    regions = equation_lines(strokes) if mode != 'text' else [strokes]
    words, unread, diagnostics = [], [], []
    for index, region in enumerate(regions):
        response = _recognize_region(region, native, mode)
        for word in response['words'] + response['unread']:
            word['lineIndex'] = index
        words.extend(response['words']); unread.extend(response['unread'])
        diagnostics.append(dict(lineIndex=index,box=box(region),strokeIds=[s['id'] for s in region],
                                **response.get('diagnostics',{})))
    return dict(words=words, unread=unread,diagnostics=diagnostics)


def _recognize_region(strokes, native, mode="auto"):
    """native accepts a bounded batch, so one request uses one native process."""
    order = {s['id']: i for i,s in enumerate(strokes)}
    nodes = _structure(strokes, mode == "math") if mode != "text" else [node([s]) for s in strokes]
    groups, math_rows, text_keys, ambiguous_text = [], [], [], set()
    def prepare(sequence):
        cooked = []
        # Group only contiguous raw strokes between structural operators.
        pending = []
        def flush():
            for part in components(pending):
                literal = _simple_math_glyph(part['strokes'])
                if literal:
                    part.update(text=literal, geometric=True, needsReview=True)
                    cooked.append(part)
                    continue
                identity = str(len(groups)); part["requestId"] = identity
                part['strokes'].sort(key=lambda s:order[s['id']])
                groups.append(dict(id=identity, strokes=part["strokes"], mode="symbol")); cooked.append(part)
            pending.clear()
        for n in sorted(sequence, key=lambda n: n["box"]["x"]):
            if n["kind"] == "ink":
                pending.append(n); continue
            flush()
            if n["kind"] == "fraction":
                n["numerator"] = prepare(n["above"]); n["denominator"] = prepare(n["below"])
            elif n['kind'] == 'root':
                n['operand'] = prepare(n['inside'])
            elif n['kind'] == 'integral':
                n['upper'] = prepare(n['upper']); n['lower'] = prepare(n['lower'])
            cooked.append(n)
        flush()
        return cooked
    for row in rows(nodes):
        glyphs=components([n for n in row if n['kind']=='ink'])
        scripted=any(9<=b['box']['h']<a['box']['h']*.68 and a['box']['w']>a['box']['h']*.25 and
                     -2<=b['box']['x']-a['box']['x']-a['box']['w']<a['box']['h']*.7 and
                     (b['box']['y']+b['box']['h']<a['box']['y']+a['box']['h']*.75 or b['box']['y']>a['box']['y']+a['box']['h']*.85)
                     for a in glyphs for b in glyphs if a is not b)
        # A dot, short lowercase letter or ascender alone is not enough
        # evidence to reinterpret an ordinary word as a power expression.
        if mode == "math" or any(n["kind"] != "ink" for n in row):
            math_rows.append(prepare(row))
        else:
            glyphs=components(row)
            heights=[n['box']['h'] for n in glyphs if n['box']['h']>7]
            height=median(heights) if heights else 30
            gaps=[b['box']['x']-a['box']['x']-a['box']['w'] for a,b in zip(glyphs,glyphs[1:])]
            positive=[g for g in gaps if g>0]
            threshold=max(10,height*.45,min(median(positive)*1.8,height*.75) if positive else 0)
            words=[]; current=[]
            for n in glyphs:
                if current and n['box']['x']-current[-1]['box']['x']-current[-1]['box']['w'] > threshold:
                    words.append(current); current=[]
                current.append(n)
            if current:
                words.append(current)
            for word in words:
                source=[s for n in word for s in n['strokes']]; source.sort(key=lambda s:order[s['id']])
                identity='text-'+str(len(groups)); text_keys.append(identity)
                if scripted and mode=='auto': ambiguous_text.add(identity)
                groups.append(dict(id=identity,mode='text',strokes=source))
    if not groups:
        responses = {}
    else:
        responses = {g["id"]: g["result"] for g in native(groups)["groups"]}
    def finish(sequence):
        for n in sequence:
            if n["kind"] == "fraction":
                top, bottom = finish(n["numerator"]), finish(n["denominator"])
                n["text"] = "("+top+")/("+bottom+")" if top and bottom else None
            elif n['kind']=='root':
                operand=finish(n['operand']); n['text']='sqrt('+operand+')' if operand else None
            elif n['kind']=='integral':
                upper, lower = finish(n['upper']), finish(n['lower'])
                n['text'] = '\u222b ' if not n['upper'] and not n['lower'] else '\u222b_('+lower+')^('+upper+') ' if upper and lower else None
            elif n["kind"] == "ink":
                if n.get('geometric'):
                    continue
                words = responses.get(n["requestId"], {}).get("words", [])
                covered = {s for w in words for s in w.get("strokeIds", [])}
                # Never discard an unread operand or punctuation stroke.
                if covered == {s["id"] for s in n["strokes"]}:
                    n['needsReview']=any(w.get('confidence','Strong')!='Strong' for w in words)
                    selected = []
                    for w in words:
                        text = w['text'].strip()
                        if text in ('.',',',"'") and n['box']['h'] > max(15,n['box']['w']*2):
                            # A tall glyph cannot be a punctuation dot. Prefer
                            # an actual recognizer alternative (often 1/I/l).
                            text = next((a for a in w.get('alternatives',[]) if re.fullmatch(r'[\wπθ]',a)),text)
                            n['needsReview']=True
                        selected.append(text)
                    n["text"] = "".join(selected).strip()
        return _math_string(sequence)
    output = []
    def review_needed(sequence):
        return any(n.get('needsReview',False) or review_needed(n.get('numerator',[])+n.get('denominator',[])+n.get('operand',[])+n.get('upper',[])+n.get('lower',[])) for n in sequence)
    for row in math_rows:
        text = finish(row)
        if text:
            ink = [s for n in row for s in n["strokes"]]
            # Single operators are useful too; do not require a letter/number.
            sizes = [n["box"]["h"] for n in row if n["kind"] == "ink"]
            font = max(20, min(96, median(sizes)*1.1 if sizes else 40))
            # A confident glyph can still mean 1/l, x/× or 0/O. Review maths
            # before replacing ink so its meaning cannot change silently.
            output.append(dict(text=text, format="math", strokeIds=[s["id"] for s in ink], alternatives=[], fontSize=font, box=box(ink), needsReview=True))
    text_words=[]
    for key in text_keys:
        for w in responses.get(key,{}).get('words',[]):
            mixed_word = bool(re.search(r'[A-Za-z]',w.get('text','')) and re.search(r'[0-9^_]',w.get('text','')))
            if (key in ambiguous_text or mixed_word) and w.get('confidence','Strong')=='Strong':
                w=dict(w,confidence='Intermediate')
            text_words.append(w)
    output.extend(_paragraphs(text_words))
    covered={identity for w in output for identity in w['strokeIds']}
    missing=[s for s in strokes if s['id'] not in covered]
    unread=[]
    if missing:
        unread.append(dict(text='',format='math' if mode=='math' else 'paragraph',needsReview=True,
                           strokeIds=[s['id'] for s in missing],alternatives=[],box=box(missing),fontSize=32))
    def trace(sequence):
        return [dict(kind=n['kind'],box=n['box'],strokeIds=[s['id'] for s in n['strokes']],
                     text=n.get('text'),children=trace(n.get('numerator',[])+n.get('denominator',[])+n.get('operand',[])+n.get('upper',[])+n.get('lower',[]))) for n in sequence]
    return dict(words=output,unread=unread,diagnostics=dict(
        groups=[dict(id=g['id'],mode=g['mode'],strokeIds=[s['id'] for s in g['strokes']],result=responses.get(g['id'])) for g in groups],
        structure=[trace(row) for row in math_rows]))
