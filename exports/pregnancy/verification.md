# Final verification

Verified 1 November 2026.

- MP4: exactly 300 seconds, 1920 × 1080, 24 fps, H.264 video and AAC narration.
- Every video and audio packet passed a full FFmpeg decode with errors treated as failures.
- WAV: exactly 300 seconds. Mean level −19.6 dB; peak −1.2 dB, below clipping.
- All 12 individually narrated scene clips are present.
- The Canva ZIP passed its CRC check; every contained file matched the exported file's SHA-256 hash.
- Actual exported frames at 73, 82 and 89 seconds show approach, attachment and embedding. Crops excluding captions showed 50,555 and 37,016 changed pixels between those stages.
- Exported frames at 97, 115, 145, 170, 194, 218, 239, 251 and 270 seconds were reviewed for the microscopic view, embryo, placenta and cord, protective structures, fetal stages, head-down position and gestation timeline.
- Browser checks passed for the Grade 7 dashboard link, subject-resource strand link, full-length video metadata, seeking and playback, English caption-track loading, separate audio playback, expandable transcript and a 390-pixel mobile viewport.
- Five Django curriculum lesson tests passed, including Grade 7 placement, exclusion from other grades, and partial media delivery. Django system checks passed.

Scientific sources, image-generation prompts and teaching-model limits accompany the lesson. Generated images are explanatory medical illustrations rather than clinical scans.
