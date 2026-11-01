"""Extract real exported frames for human review of the fertilisation sequence."""
from pathlib import Path
import subprocess
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'exports/fertilization'
WORK = ROOT / 'tmp/fertilization/final-review'
FFMPEG = ROOT / 'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
TIMES = [52, 82, 110, 122, 155, 171, 181, 189, 199, 212, 230, 238, 244, 252, 260, 268, 277, 298]


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    images = []
    for time in TIMES:
        target = WORK / f'{time:03}.png'
        subprocess.run([str(FFMPEG), '-y', '-v', 'error', '-ss', str(time), '-i',
                        str(OUT / 'fertilization-grade7-5min.mp4'), '-frames:v', '1', str(target)], check=True)
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
    frames = [Image.open(WORK / f'{time:03}.png').convert('RGB').crop((340, 220, 1220, 840))
              for time in [181, 189, 199]]
    for before, after in zip(frames, frames[1:]):
        changed = sum(max(pixel) > 24 for pixel in ImageChops.difference(before, after).get_flattened_data())
        assert changed > 100, 'Entry scene must visibly move in the exported video.'
        print('Visible entry motion:', changed, 'changed pixels', flush=True)
    print('Human-review montage:', WORK / 'final-review-montage.png', flush=True)


if __name__ == '__main__':
    main()
