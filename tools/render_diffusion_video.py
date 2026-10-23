"""Render the diffusion demonstration. Requires Pillow and imageio-ffmpeg."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'educations/static/educations'
source = Image.open(ASSETS / 'images/diffusion-cold-water-stages.png').convert('RGB')
photos = [source.crop(box).resize((378, 420), Image.Resampling.LANCZOS)
          for box in [(50, 145, 450, 595), (600, 145, 950, 595), (1105, 145, 1465, 595)]]
output = ASSETS / 'videos/diffusion-cold-water-30s.mp4'
output.parent.mkdir(exist_ok=True)
font_dir = Path('C:/Windows/Fonts')
font = lambda size: ImageFont.truetype(str(font_dir / 'arial.ttf'), size)
title_font, heading_font, body_font = font(26), font(23), font(18)
random.seed(7)
particles = [(random.uniform(530, 865), random.uniform(220, 425), random.random()*6.28)
             for _ in range(48)]
writer = imageio_ffmpeg.write_frames(str(output), (960, 600), fps=15,
                                    codec='libx264', pix_fmt_in='rgb24',
                                    pix_fmt_out='yuv420p', macro_block_size=8,
                                    output_params=['-movflags', '+faststart', '-crf', '21'])
writer.send(None)
for frame in range(450):
    elapsed = frame / 15
    seconds = elapsed * 40 / 30
    progress = elapsed / 30
    image = Image.new('RGB', (960, 600), '#f6fbff')
    draw = ImageDraw.Draw(image)
    draw.text((35, 22), 'DIFFUSION OF POTASSIUM MANGANATE(VII)', font=title_font, fill='#25104f')
    draw.text((35, 57), 'Cold, still water — no stirring or heating', font=body_font, fill='#345471')
    if seconds < 20:
        photo = Image.blend(photos[0], photos[1], min(1, seconds / 20))
    else:
        photo = Image.blend(photos[1], photos[2], min(1, (seconds - 20) / 15))
    image.paste(photo, (40, 95))
    stage = 0 if seconds < 8 else 1 if seconds < 35 else 2
    headings = ['1. CRYSTAL DISSOLVES', '2. COLOUR SPREADS', '3. UNIFORMLY PURPLE']
    draw.text((465, 110), headings[stage], font=heading_font, fill='#24104f')
    draw.text((465, 150), 'Dissolved-particle view (enlarged)', font=body_font, fill='#345471')
    draw.rounded_rectangle((475, 195, 900, 445), radius=12, fill='#e5d5f4' if stage == 2 else '#e4f2fc', outline='#819bb5', width=2)
    spread = min(1, seconds / 35)
    for index, (end_x, end_y, phase) in enumerate(particles):
        start_x = 687 + math.sin(phase)*22
        start_y = 422 + math.cos(phase)*8
        x = start_x + (end_x-start_x)*spread + math.sin(seconds*1.4+phase)*3
        y = start_y + (end_y-start_y)*spread + math.cos(seconds*1.7+phase)*3
        draw.ellipse((x-3, y-3, x+3, y+3), fill='#8426ba')
    lines = [('Colour is concentrated near the crystal.', 'The crystal begins dissolving.'),
             ('Dissolved particles spread from higher', 'to lower concentration.'),
             ('The solution becomes uniformly purple.', 'Particles continue moving randomly.')][stage]
    for line_index, line in enumerate(lines):
        draw.text((465, 465+line_index*27), line, font=body_font, fill='#243852')
    draw.rounded_rectangle((35, 555, 925, 563), radius=4, fill='#d9d1e7')
    draw.rounded_rectangle((35, 555, 35+max(8, 890*progress), 563), radius=4, fill='#8a34bd')
    draw.text((35, 573), f'{min(30, math.ceil(elapsed)):02d} / 30 seconds', font=font(15), fill='#304b67')
    draw.text((490, 573), 'Diffusion: particle motion is continuous.', font=font(15), fill='#304b67')
    writer.send(image.tobytes())
writer.close()
print(f'Rendered {output}: 30 seconds, 960x600, 15 fps')
