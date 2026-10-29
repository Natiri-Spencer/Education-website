"""Create the clean Grade 9 handout with a large vector starch-test diagram."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/starch-test-experiment.pdf'
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf'))
NAVY = colors.HexColor('#182f4c')
TEAL = colors.HexColor('#117b79')
MUTED = colors.HexColor('#465d73')
BLUE = colors.HexColor('#22234f')
YELLOW = colors.HexColor('#d5a448')
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('Starch test experiment')
c.setSubject('Grade 9 Integrated Science - light and starch production')
w, h = A4

def text(x, y, value, size=10.5, bold=False, colour=NAVY):
    c.setFillColor(colour)
    c.setFont('Arial-Bold' if bold else 'Arial', size)
    c.drawString(x, y, value)

def paragraph(value, x, top, width=515, size=10.5, leading=14):
    style = ParagraphStyle('body', fontName='Arial', fontSize=size, leading=leading, textColor=NAVY)
    p = Paragraph(value, style)
    _, height = p.wrap(width, 600)
    p.drawOn(c, x, top-height)
    return top-height

def leaf(cx, cy, scale=1, result=False, covered=False):
    c.saveState()
    c.translate(cx, cy)
    c.scale(scale, scale)
    shape = c.beginPath()
    shape.moveTo(0, 110)
    shape.curveTo(72, 88, 98, 30, 68, -33)
    shape.curveTo(50, -72, 20, -98, 0, -110)
    shape.curveTo(-55, -85, -92, -30, -76, 35)
    shape.curveTo(-64, 82, -25, 105, 0, 110)
    shape.close()
    c.setFillColor(BLUE if result else colors.HexColor('#489f60'))
    c.setStrokeColor(colors.HexColor('#74976f'))
    c.setLineWidth(1.5)
    c.drawPath(shape, stroke=1, fill=1)
    if result:
        c.saveState()
        c.clipPath(shape, stroke=0)
        c.setFillColor(YELLOW)
        c.rect(-110, -30, 220, 60, stroke=0, fill=1)
        c.restoreState()
    c.setStrokeColor(colors.HexColor('#c3c8d2') if result else colors.HexColor('#b4d8a3'))
    c.setLineWidth(1.2)
    c.line(0, -103, 0, 96)
    for y, dx in [(55, 35), (10, 57), (-40, 44)]:
        c.line(0, y, dx, y+16)
        c.line(0, y, -dx, y+16)
    if covered:
        c.setFillColor(colors.HexColor('#18202c'))
        c.setStrokeColor(colors.HexColor('#bbc5ce'))
        c.roundRect(-84, -30, 168, 60, 3, stroke=1, fill=1)
        c.setLineWidth(4)
        c.line(-63, -36, -63, 36)
        c.line(63, -36, 63, 36)
    c.restoreState()

text(40, 804, 'Starch test experiment', 25, True)
text(40, 783, 'GRADE 9  |  INTEGRATED SCIENCE  |  PHOTOSYNTHESIS', 9, True, TEAL)
c.setStrokeColor(TEAL)
c.setLineWidth(2)
c.line(40, 771, w-40, 771)
text(40, 751, 'Aim', 11, True, TEAL)
paragraph('Investigate whether light is needed for starch production in a green leaf.', 40, 740)
text(40, 708, 'Requirements', 11, True, TEAL)
paragraph('Green potted plant, opaque black paper, clips, forceps, beaker, hot water, ethanol in a boiling tube, electric hot-water bath, warm rinse water, white tile and iodine solution.', 40, 697)
text(40, 651, 'Procedure', 11, True, TEAL)
steps = [
    'Keep the plant in darkness for 48 hours so stored starch is used up.',
    'Cover a middle strip of one leaf on BOTH surfaces with black paper and clips.',
    'Place the plant in good light for several hours; keep it adequately watered.',
    'Detach the leaf with forceps, remove the paper and note the covered strip.',
    'Immerse the leaf in hot water to kill the tissue and stop chemical reactions.',
    'Warm the leaf in ethanol in a hot-water bath to remove green chlorophyll.',
    'Rinse the leaf in warm water to soften it, then spread it on a white tile.',
    'Add iodine solution to the whole leaf and compare the two areas.'
]
for i, step in enumerate(steps):
    text(40, 632-i*18, f'{i+1}.', 10.2, True)
    text(57, 632-i*18, step, 10.2)
text(40, 485, 'Ethanol is flammable: use indirect heating in a hot-water bath, never a naked flame.', 9.1, True, MUTED)

# Figure 1: the selected leaf is enlarged to show both iodine colours clearly.
c.setFillColor(colors.HexColor('#f5f8fb'))
c.setStrokeColor(colors.HexColor('#d8e2ea'))
c.roundRect(40, 221, 515, 247, 9, stroke=1, fill=1)
text(56, 449, 'Before testing', 10, True)
text(250, 449, 'After iodine: enlarged leaf', 10, True)
c.setStrokeColor(colors.HexColor('#4d965e'))
c.setLineWidth(3)
c.line(120, 286, 120, 387)
c.line(120, 337, 92, 359)
c.line(120, 364, 147, 385)
leaf(91, 369, .24)
leaf(120, 405, .23)
leaf(148, 392, .25, covered=True)
c.setFillColor(colors.HexColor('#c88762'))
pot = c.beginPath()
pot.moveTo(94, 292)
pot.lineTo(147, 292)
pot.lineTo(139, 253)
pot.lineTo(102, 253)
pot.close()
c.drawPath(pot, fill=1, stroke=0)
c.setFillColor(colors.HexColor('#644c3f'))
c.ellipse(93, 287, 148, 298, fill=1, stroke=0)
text(56, 234, 'Black paper on both surfaces', 8.5, colour=MUTED)
c.setStrokeColor(MUTED)
c.setLineWidth(1)
c.line(177, 345, 211, 345)
c.line(211, 345, 204, 350)
c.line(211, 345, 204, 340)
leaf(310, 338, .88, result=True)
for y, label, detail in [(398, 'Exposed area', 'Blue-black: starch present'), (338, 'Previously covered strip', 'Yellow-brown: no starch detected'), (279, 'Exposed area', 'Blue-black: starch present')]:
    start = 360 if y!=338 else 380
    c.setStrokeColor(MUTED)
    c.line(start, y, 411, y)
    text(417, y+4, label, 8.8, True)
    text(417, y-9, detail, 7.8, colour=MUTED)
text(40, 205, 'Figure 1.', 9.4, True)
text(85, 205, 'Starch-test colours in the exposed and covered areas of the same leaf.', 9.4)

text(40, 180, 'Observation', 11, True, TEAL)
paragraph('The exposed areas turn <b>blue-black</b> after iodine is added, showing starch is present. The previously covered strip stays <b>yellow-brown</b>, showing no starch is detected there.', 40, 169)
text(40, 124, 'Conclusion', 11, True, TEAL)
paragraph('Light is needed for starch production in a green leaf. Both areas belonged to the same leaf, but only the areas exposed to light gave a positive starch test.', 40, 113)
text(40, 45, 'Living Things and Their Environment - Photosynthesis', 8.5, colour=MUTED)
text(547, 45, '1', 8.5, colour=MUTED)
c.showPage()
c.save()
reader = PdfReader(OUT)
assert len(reader.pages)==1
content = reader.pages[0].extract_text()
assert 'Figure 1.' in content and 'Yellow-brown' in content and 'Blue-black' in content
assert not any(value in content for value in ['Try Science Kits', 'Study Biology', 'Fig. 9.11'])
print(f'Created {OUT} ({OUT.stat().st_size} bytes)')
