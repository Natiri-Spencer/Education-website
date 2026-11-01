# Export verification

- Final MP4: exactly 300.00 seconds, 1920 × 1080, 24 fps, H.264 video and AAC narration.
- Every video and audio packet passed a full FFmpeg decode with errors treated as failures.
- Full-length WAV: exactly 300 seconds. Audio mean: -19.6 dB; peak: -1.0 dB, below clipping.
- Visible captions and separate SRT/VTT subtitles cover the lesson through 05:00.
- Actual exported frames reviewed at 52, 82 and 110 seconds show the anatomical route; 122 seconds shows the microscopic view.
- Frames at 171, 181, 189 and 199 seconds show the highlighted sperm outside, through the coverings and inside the egg. Other sperm remain outside.
- At 212 seconds, protective changes and two pronuclei are visible in one cell.
- Frames at 230, 238, 244 and 252 seconds show staggered loss of other sperm and the labelled defence-cell clearing example.
- At 260, 268 and 277 seconds, the view progresses from one zygote to two- and four-cell teaching models.
- Canvas-crop differences between 181/189 and 189/199 seconds show 2768 and 2702 changed pixels, excluding captions and the progress bar.
- Grade 7 Integrated Science resource record and resource-page response were verified; stored video bytes match the export.
- The supplied plan reference was inspected: its vagina → cervix → uterus → fallopian tube route and zoom into single-sperm fertilisation are implemented.

The exported-frame montage is a local QA artifact under `tmp/fertilization/final-review/`. Run `tools/inspect_fertilization_video.py` to reproduce it. Run `tools/package_fertilization.py` for full decoding and packaging.
