# Whiteboard UJI CNN/GRU baseline

This locally trained PyTorch model recognizes rasterized pen strokes using a
convolutional encoder, two bidirectional GRU layers and CTC decoding. Its
vocabulary contains 78 ASCII characters plus the CTC blank. Layout, word spaces,
fractions and math operators are handled separately by the whiteboard.
Integral and partial-derivative glyph templates are also handled by that layout
layer in Maths mode. They are not newly trained CTC classes and are not covered
by the neural accuracy measurements below.

Data credit: Prat, F., Castro, M., Llorens, D., Marzal, A., & Vilar, J. (2008).
UJI Pen Characters (Version 2), UCI Machine Learning Repository.
https://doi.org/10.24432/C5FG8S — CC BY 4.0.
https://creativecommons.org/licenses/by/4.0/

Changes: ASCII subset selection, stroke rasterization, geometry augmentation,
artificial word composition and neural network training. Source attribution is
also retained in `training_data/uji/ATTRIBUTION.md`.

Evaluation results, split writer identities, source digest and sample
predictions are in `evaluation.json`. Writers never cross the training,
validation and test boundaries. Artificial test words are assembled from held
out characters; they do not establish accuracy on natural words or sentences.
The composed sequence evaluation mixes single characters, dictionary words and
random character/digit strings, using the same generator as training.
The neural checkpoint scored 74.46% exact accuracy on 3,120 held-out isolated
characters and 63.8% on 1,000 mixed sequences. These measurements precede the
application's layout and punctuation recovery. The lower test accuracy than
validation accuracy is a reason to retain mandatory review.

This is an experimental baseline for separated printed writing. Natural cursive,
Greek letters and arbitrary mathematical notation are outside the training
coverage. Similar glyphs and letter case can be ambiguous. Every prediction
requires review; original strokes remain available. The model does not certify
mathematical correctness. SymPy performs a separate bounded syntax check.

Reproduction and serving details: `../../WHITEBOARD_PIPELINE.md`.
The checkpoint and vocabulary are bound by SHA-256 in embedded metadata.
