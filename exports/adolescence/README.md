# Video 5: Physical Changes During Adolescence — Grade 7

A five-minute **Integrated Science → Living Things and Environment** lesson with simple English narration, visible captions, fully clothed animated comparisons, and respectful personal-care guidance.

## Deliverables

- `adolescence-grade7-5min.mp4`: complete 1920 × 1080, 24 fps lesson with narration.
- `narration.mp3` and `narration.wav`: complete five-minute audio.
- `adolescence.srt` and `adolescence.vtt`: separate subtitles.
- `transcript.txt`, `chapters.json`, and `poster.png`.
- `canva-scene-clips/`: 12 individual narrated scenes.
- `adolescence-canva-assets.zip`: complete handoff pack.

The MP4 and scene clips already contain narration. Import them into Canva as finished video scenes; do not add the separate narration over them unless replacing their audio. These are local exports, not a hosted or natively editable Canva design.

## What the lesson covers

1. Adolescence, puberty and hormones as chemical messengers.
2. Shared growth, body hair, sweating and skin changes.
3. Typical changes in girls, including breast development, wider hips and periods.
4. Typical changes in boys, including broader shoulders, reproductive development, facial hair and wet dreams.
5. Voice-box and vocal-cord changes.
6. Daily hygiene, sleep, food, water and activity.
7. Menstrual care, personal privacy and trusted support.
8. Normal differences in timing and three review prompts with answers.

Figures remain fully clothed. Changes are described without teasing, ranking bodies, or asking learners to disclose private experiences. See `sources.md` for scientific references and teaching-model limits.

## Website placement

Grade 7 Integrated Science resources and the Grade 7 dashboard both link to this lesson under **Living Things and Environment**. Direct route: `/educations/grade-7/integrated-science/living-things-and-environment/physical-changes-during-adolescence/`.

The page includes video, audio, English captions, downloads, a transcript and review questions. It uses versioned files in this directory and needs no database lesson record after cloning.

## Editing and rebuilding

- Narration: `../../tools/adolescence_story.json`.
- Windows voice recording: `../../tools/narrate_adolescence.ps1`; `-StartScene` can re-record a later section.
- Animation and timing: `../../tools/render_adolescence.cjs`.
- Original body diagrams, skin model and care icons: `../../tools/adolescence_visuals.cjs`.
- Export verification and Canva packaging: `../../tools/package_adolescence.py`.
- Exported-frame review: `../../tools/inspect_adolescence_video.py`.

Authoring uses Windows SAPI, Node.js with `@napi-rs/canvas` and `sharp`, and the configured FFmpeg binary. Temporary recordings and previews belong in ignored `tmp/adolescence/`. The reused adult reproductive-organ illustration is from the academy's earlier lesson; its original built-in ImageGen prompt is retained in `assets/anatomy-visual-prompt.txt`.
