# Whiteboard recognition

The canvas posts stroke IDs and points to `/educations/whiteboard/recognize/`, with `auto`, `text`, or `math` mode. Django groups ink and returns `words` containing `text`, `tokens`, `strokeIds`, `format`, engine information and review reasons. Maths may include literal `latex` or a separate syntax-validation representation. Every result requires approval. Original strokes remain recoverable. Syntax validation does not prove that the transcription matches the ink or that an equation is mathematically true.

KaTeX 0.19.0 scripts, CSS, fonts and license are bundled under `educations/static/educations/vendor/katex/`. MathJax supplies the same self-contained SVG paths for previews, the board and PNG exports. Cache entries include the explicit equation representation so an older model reading cannot override manually edited text. No CDN is needed.

## Recognition engines

On Windows, the server uses the installed English Windows Ink recognizer first. It handles natural classroom handwriting and supplies alternatives for ambiguous characters. The small C# bridge in `educations/HandwritingRecognizer.cs` is compiled on first use into the ignored `tmp/whiteboard_ink/` directory. Coordinates stay on the local server. If Windows Ink is unavailable, the bundled PyTorch model is used as a fallback.

Explicit maths regions and equation-shaped automatic regions use the local `PP-FormulaNet_plus-M` formula model. It reads a tightly cropped equation. The model runs in the isolated `tmp/formula_runtime` environment through a persistent worker. A separate Windows Ink/layout reading supplies alternatives when matching source regions disagree. Every result requires visual review. If the formula worker fails, the fallback suggestion carries an explicit review reason and original strokes remain recoverable. See `HANDWRITING_IMPLEMENTATION_STATUS.md` for setup, measured limitations and remaining accuracy work.

Before invoking the formula model, the layout engine checks whether every source stroke is covered by a flat expression whose glyphs are mostly deterministic geometry and whose remaining native readings are strong. Those ordinary equations use the faster layout result. Fractions, superscripts, subscripts, calculus structures, incomplete coverage and uncertain native groups continue to the formula model. Only one-to-one geometrically proven glyphs may be restored inside LaTeX; all other disagreements remain visible for review.

The recognition status request begins loading the formula model in a background worker by default, so this one-time startup can overlap with drawing. Set `WHITEBOARD_FORMULA_PREWARM=false` to disable it. The worker remains persistent after loading, and unchanged stroke requests use the bounded recognition cache.

## PyTorch fallback model

Install `requirements.txt`. Django includes `models/whiteboard/ink.pt` and `vocabulary.json` for systems without Windows Ink. For another compatible fallback model, set these optional overrides in `.env` and restart Django:

```
WHITEBOARD_MODEL_PATH=C:/models/ink.pt
WHITEBOARD_VOCAB_PATH=C:/models/vocabulary.json
```

A trained CNN + bidirectional GRU CTC checkpoint and 79-entry vocabulary (blank plus 78 ASCII characters) are included. It uses the UJI Pen Characters v2 strokes, with writer-disjoint training, validation and test partitions. Training joins isolated characters into artificial word samples. See `models/whiteboard/evaluation.json` for measured accuracy and `training_data/uji/ATTRIBUTION.md` for source and license.

This is an experimental printed-writing baseline. It has no natural cursive word training, no Greek-letter coverage, and can confuse case and visually similar characters. Suggestions require review before replacing ink. Math operators and spatial structure still come from the layout layer. Spaces between words and paragraph line breaks are reconstructed by that layer; there is no space glyph in this vocabulary.

The exported model scored 74.46% exact isolated-character accuracy on 3,120 held-out samples and 63.8% exact accuracy on 1,000 mixed sequences. These are neural-model measurements before application layout and punctuation recovery. A single tiny trailing baseline dot in text mode is preserved as a period; dots above letters, colons and math decimal points are left to recognition/layout.

The server uses the same rasterizer as training, in `educations/ink_preprocessing.py`. Checkpoint contract:

- Input: float32 `[1, 1, 32, W]` raster, white ink on black, W between 16 and 512. Coordinates are normalized by the shared rasterizer with antialiased strokes and three-pixel padding. Stroke order does not affect this raster model.
- Output: finite logits `[1, T, V]`, with 1–4096 time steps.
- Vocabulary: JSON array of strings, length V; index 0 is the empty-string CTC blank. Greedy decoding collapses consecutive repeats before removing blanks. The embedded metadata binds the checkpoint to its vocabulary using SHA-256 and declares `raster_ctc_v1` format.
- Layout grouping passes text words or math operands to the model; the layout layer assembles fractions, powers and equations. Train with these group types and normalization.
- This checkpoint declares `review_required: true`; confidence does not bypass review. Probabilities have not been calibrated on natural classroom words.

Missing or invalid fallback model files report recognition unavailable only when Windows Ink and the formula engine are also unavailable. GET on the recognition endpoint reports availability, the active engine, formula availability, and review policy.

## Retrain

From `cbc_env`, install `requirements-neural.txt` (adds NumPy for training), then run:

```
Scripts/python.exe tools/download_ink_data.py
Scripts/python.exe tools/train_ink.py --epochs 16 --samples-per-epoch 4000 --batch-size 40
```

The seed is fixed. Five of the published training writers are reserved for validation; all 20 published test writers remain held out. The lowest combined validation character error selects the exported weights. Training emits `training.jsonl`, `evaluation.json`, the checkpoint and vocabulary. `training.pt` and `best_weights.pt` are local resumable artifacts excluded from version control. `--resume --epochs 24` continues a run; pick settings using validation results, not the test set. Evaluation on joined test characters is **not** a measurement of real sentence or cursive accuracy.

SymPy accepts bounded arithmetic, identifiers, roots, trig/log/exp calls and a single equality. It normalizes multiplication signs, minus signs, powers and numeric implicit multiplication. Parsing uses an AST allowlist rather than evaluating input. Unsupported expressions remain available for manual review.

## Calculus

The equation editor and symbol buttons support:

- `integral(x^2,x)` or `∫ x^2 dx` for an indefinite integral.
- `integral(x^2,x,0,1)` or `∫_(0)^(1) x^2 dx` for a definite integral.
- `diff(x^2,x)`, `dy/dx`, or `d/dx(x^2)` for differentiation.
- `diff(x^3,x,2)`, `d^2y/dx^2`, and `f''(x)` for higher derivatives.
- `partial(f(x,y),x)` or `∂y/∂x` for a partial derivative. An optional third argument specifies its order (1–10).
- Nested `integral(...)` calls for iterated integrals; the editor also renders `∬`, `∭`, `∮` and mathematical LaTeX.

SymPy constructs unevaluated Integral/Derivative objects and validates the input; it does not solve or silently replace a calculus expression with an answer. Raw LaTeX and standalone decorative symbols can be rendered without claiming SymPy validation.

For handwriting, choose **Maths & numbers**. Conservative single-stroke geometric templates recognize familiar integral and partial signs, and the layout layer keeps upper/lower integral limits together. Derivative fractions use the existing `d`, variable, fraction and power recognition. These helpers are separate from the unchanged 79-token CTC checkpoint. They have no measured handwriting accuracy claim and always require review; unfamiliar or ambiguous marks retain their original ink. Text mode continues to use the text recognizer.
