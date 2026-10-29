"""Verify the lesson and create narrated scene clips and a Canva handoff ZIP."""
from pathlib import Path
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'exports/male-reproductive-system'
FFMPEG = ROOT / 'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
VIDEO = OUT / 'male-reproductive-system-grade7-human-anatomy-5min.mp4'


def run(*args):
    return subprocess.run([str(FFMPEG), '-hide_banner', *map(str, args)],
                          check=True, capture_output=True, text=True)


def main():
    # Decode every audio and video packet before packaging.
    run('-v', 'error', '-xerror', '-threads', '2', '-i', VIDEO,
        '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-')
    info = run('-i', VIDEO, '-t', '0', '-f', 'null', '-').stderr
    assert 'Duration: 00:05:00.00' in info, info
    assert '1920x1080' in info and '24 fps' in info, info
    assert 'Audio: aac' in info, info
    print('Verified: 300 seconds, 1080p, 24 fps, AAC audio; full decode passed.', flush=True)
    volume = run('-i', OUT / 'narration.wav', '-af', 'volumedetect', '-f', 'null', '-').stderr
    print('\n'.join(line for line in volume.splitlines()
                    if re.search(r'(mean|max)_volume:', line)), flush=True)
    run('-y', '-loglevel', 'error', '-i', OUT / 'narration.wav',
        '-c:a', 'libmp3lame', '-b:a', '128k', OUT / 'narration.mp3')

    scenes = json.loads((OUT / 'chapters.json').read_text())
    clips = OUT / 'canva-scene-clips'
    clips.mkdir(exist_ok=True)
    for index, scene in enumerate(scenes, 1):
        target = clips / f'{index:02}-{scene["id"]}.mp4'
        run('-y', '-loglevel', 'error', '-ss', scene['start'], '-i', VIDEO,
            '-t', scene['end'] - scene['start'], '-map', '0:v:0', '-map', '0:a:0',
            '-c:v', 'libx264', '-threads', '2', '-preset', 'veryfast', '-crf', '20',
            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', target)
        print(f'Packaged scene {index}/{len(scenes)}: {scene["id"]}', flush=True)

    target = OUT / 'male-reproductive-system-canva-assets.zip'
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=5) as archive:
        for file in OUT.rglob('*'):
            if file.is_file() and file != target:
                archive.write(file, file.relative_to(OUT))
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
    print(f'Canva pack verified: {target.stat().st_size / 1024**2:.1f} MB', flush=True)


if __name__ == '__main__':
    main()
