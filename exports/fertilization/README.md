# Fertilisation: The Sperm's Journey — Grade 7

A five-minute Integrated Science lesson for CBE STEM ACADEMY, with simple narration, visible captions, a detailed human reproductive-system cutaway and a magnified egg-cell illustration.

## Deliverables

- `fertilization-grade7-5min.mp4`: complete 1920 × 1080, 24 fps H.264 video with AAC narration.
- `narration.mp3` and `narration.wav`: full-length audio without background music.
- `fertilization.srt` and `fertilization.vtt`: separate subtitles.
- `transcript.txt`, `chapters.json`, `poster.png`: teaching and preview materials.
- `canva-scene-clips/`: 12 individually narrated video scenes.
- `fertilization-canva-assets.zip`: complete handoff pack.
- `assets/`: anatomical artwork and the built-in ImageGen prompt.
- `sources.md`: scientific references and teaching-model limits.

## What students see

1. The route through the vagina, cervix, uterus and fallopian tube, following the supplied plan reference.
2. Fewer sperm continuing through the tract; many never reach an egg.
3. A zoom into the wider part of a fallopian tube.
4. Outer cells, the protective zona pellucida and the egg membrane.
5. One highlighted sperm passing the outer layers, joining the egg membrane and entering the egg.
6. Protective changes after entry; additional sperm remain outside.
7. Other sperm losing movement and fading at different times, plus a labelled defence-cell clearing example.
8. A zygote and a simplified model of early division, followed by review questions.

The tracking colour does not imply a biologically superior sperm. The egg does not electrocute other sperm or kill all of them instantly. A small number of drawn sperm represent the many sperm present. Only one sperm enters the egg in the animation.

## Canva handoff

Upload the complete MP4 for a finished lesson. To rearrange the scenes, upload the numbered clips in order. Each clip already contains narration and visible captions. Adding the full narration again over those clips would duplicate the audio. Use the separate audio and subtitle files when rebuilding the lesson with your own visuals.

These are locally produced files ready to import into Canva, not a hosted or natively editable Canva project.

## Editing and rebuilding

Narration: `../../tools/fertilization_story.json`. Windows SAPI recording: `../../tools/narrate_fertilization.ps1`. Design, timing and movement: `../../tools/render_fertilization.cjs`. Verification and packaging: `../../tools/package_fertilization.py`.

Authoring uses Node.js with `sharp`, the configured FFmpeg binary, and an installed Windows speech voice. Narration fragments and QA frames are stored under ignored `tmp/fertilization/`. These authoring tools are separate from the Django website dependencies.

The egg illustration was generated using the built-in ImageGen tool. The anatomical cutaway is reused from the academy's female-system lesson. Both prompts are documented in `assets/visual-prompt.txt`. These are teaching illustrations, not clinical scans.

Website resource records belong to the database. Cloning the repository does not install them: add the completed MP4 to Grade 7 Integrated Science through the resource admin interface on a new server.
