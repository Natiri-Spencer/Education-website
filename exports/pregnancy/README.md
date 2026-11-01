# Implantation and Pregnancy — Grade 7

A five-minute Integrated Science lesson for **Living Things and Environment**, with simple English narration, visible captions, human reproductive anatomy, microscopic implantation animation, and development through the three trimesters.

## Files

- `pregnancy-grade7-5min.mp4`: 1920 × 1080, 24 fps, with AAC narration.
- `narration.mp3` and `narration.wav`: complete five-minute audio.
- `pregnancy.srt` and `pregnancy.vtt`: subtitles.
- `transcript.txt`, `chapters.json`, and `poster.png`.
- `canva-scene-clips/`: 12 individually narrated scenes.
- `pregnancy-canva-assets.zip`: complete handoff pack for importing into Canva.

These are locally authored exports ready to import into Canva, rather than a hosted Canva project. The complete MP4 and scene clips already contain narration; do not overlay the separate narration again unless replacing their audio.

## Lesson sequence

Human organs → zygote division and transport → blastocyst → attachment and embedding in the uterine lining → embryo and early organs → placenta and cord → amniotic sac and fluid → three trimesters → gestation counting → review questions and answers.

The baby develops **in the uterus**. “Embryo” and “fetus” describe stages of the developing human, not organs in which the baby grows. Implantation involves a blastocyst, not an unchanged single-cell zygote.

## Website

Available from Grade 7 Integrated Science resources and the Grade 7 dashboard, under **Living Things and Environment**. Direct route: `/educations/grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/`.

The page provides video, audio, captions, downloads and a transcript. Files are served from this versioned export folder with seeking support; no database lesson record is required.

## Artwork and rebuilding

The implantation, pregnant uterus and developmental illustrations were generated with built-in ImageGen and reviewed as teaching models. The earlier female anatomy artwork is reused from the academy's female-system lesson. Final prompts are in `assets/visual-prompts.md`; scientific references and model limits are in `sources.md`.

Editable story: `../../tools/pregnancy_story.json`. Windows voice recording: `../../tools/narrate_pregnancy.ps1`. Animation: `../../tools/render_pregnancy.cjs`. Verification and Canva packaging: `../../tools/package_pregnancy.py`. Exported-frame review: `../../tools/inspect_pregnancy_video.py`.

Authoring requires Windows SAPI, Node.js with `@napi-rs/canvas` and `sharp`, and the configured FFmpeg binary. Temporary recordings and previews are stored under ignored `tmp/pregnancy/`.
