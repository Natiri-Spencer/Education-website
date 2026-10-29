# Male Reproductive System — Grade 7

A five-minute narrated lesson for CBE STEM ACADEMY, using simple language, a realistic human pelvic cutaway illustration and animated sperm transport.

## Files

- `male-reproductive-system-grade7-human-anatomy-5min.mp4`: 1920 × 1080, 24 fps, H.264/AAC, visible captions.
- `narration.wav` and `narration.mp3`: full-length narration, without background music.
- `male-reproductive-system.vtt` and `.srt`: separate subtitles.
- `transcript.txt` and `chapters.json`: narration and scene timings.
- `poster.png`: labelled lesson preview.
- `canva-scene-clips/`: 12 individual narrated MP4 scenes.
- `male-reproductive-system-canva-assets.zip`: complete handoff pack.
- `sources.md`: scientific references and model limits.

## Lesson content

Names and jobs of the testes, scrotum, epididymis, sperm ducts, seminal vesicles, prostate, penis and urethra; sperm versus semen; the route sperm take; basic sperm-cell structure; puberty and respectful healthy habits; three review questions.

New terms are explained in the narration. The script contains about 606 words across five minutes. Pauses and clear visual labels support learners encountering the vocabulary for the first time.

## Edit or use in Canva

Upload the complete MP4 to use the finished lesson. For scene-based editing, upload the numbered clips in order. Each clip already includes narration and visible captions: avoid adding the full WAV over those clips, which would duplicate the audio. Use the separate WAV and subtitle files only when rebuilding the lesson with your own visuals.

The files are locally produced assets that can be imported into Canva. They are not a hosted or natively editable Canva design. Edit the artwork placement, labels and animation in `../../tools/render_male_reproductive.cjs`; edit narration in `../../tools/male_reproductive_story.json`. Record the Windows SAPI voice with `../../tools/narrate_male_reproductive.ps1`, then run the renderer with Node.js and `sharp` available. FFmpeg must exist at the configured renderer path. The narration fragments are local build files under ignored `tmp/`.

## Anatomical visual revision

The simplified floating-organ drawing has been replaced by a detailed human pelvic cutaway from the normal-anatomy panel of **Varicocele** by **BruceBlaus / Blausen Medical**. The sperm-pathway coordinates and label endpoints have been remapped to the organs in this illustration. The bladder, surrounding tissue and pelvic context are visible. Only the normal left panel is shown; the condition comparison is excluded.

See [artwork attribution and reuse license](assets/ATTRIBUTION.md). The revised video, scene clips and visual adaptations are available under **CC BY-SA 4.0**. The original source artwork and metadata are included for attribution and reproducibility. No AI-generated anatomy is used.
