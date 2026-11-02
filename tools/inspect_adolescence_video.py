"""Extract real exported frames for human review of the adolescence sequence."""
from pathlib import Path
import subprocess
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'exports/adolescence'
WORK = ROOT / 'tmp/adolescence/final-review'
FFMPEG = ROOT / 'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
TIMES = [12, 30, 46, 60, 78, 98, 110, 128, 143, 156, 172, 191, 216, 240, 266, 292]


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    images = []
    for time in TIMES:
        target = WORK / f'{time:03}.png'
        subprocess.run([str(FFMPEG), '-y', '-v', 'error', '-ss', str(time), '-i',
                        str(OUT / 'adolescence-grade7-5min.mp4'), '-frames:v', '1', str(target)], check=True)
        with Image.open(target) as frame:
            tile = frame.convert('RGB').resize((480, 270))
        draw = ImageDraw.Draw(tile)
        draw.rectangle((0, 0, 88, 20), fill='#071323')
        draw.text((7, 3), f'{time:03} seconds', fill='white')
        images.append(tile)
    montage = Image.new('RGB', (1920, 270 * ((len(images) + 3) // 4)), '#071323')
    for index, tile in enumerate(images):
        montage.paste(tile, ((index % 4) * 480, (index // 4) * 270))
    montage.save(WORK / 'final-review-montage.png')

    # Crop excludes captions and progress bar, so differences reflect animation.
    for start, end in [(46, 60), (98, 110)]:
        frames = [Image.open(WORK / f'{time:03}.png').convert('RGB').crop((340, 220, 1220, 840))
                  for time in [start, end]]
        before, after = frames
        changed = sum(max(pixel) > 24 for pixel in ImageChops.difference(before, after).get_flattened_data())
        assert changed > 100, 'Growth diagrams must visibly change in the exported video.'
        print('Visible growth motion:', changed, 'changed pixels', flush=True)
    print('Human-review montage:', WORK / 'final-review-montage.png', flush=True)


if __name__ == '__main__':
    main()

