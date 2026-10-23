# Precise handwriting transcription plan

Prepared 21 October 2026; implementation status updated 22 October 2026.

## Current implementation

The first maths pipeline is now installed. `PP-FormulaNet_plus-M` runs locally in an isolated persistent worker, explicit maths and equation-shaped regions route to it, and Windows Ink remains the prose and failure fallback. Line regions are separated conservatively before structure recognition, source-stroke coverage is checked, literal LaTeX is preserved without solving or reordering, and all suggestions require approval. Worker errors retain the original ink and fall back rather than returning a blank correction. Live vector-stroke checks currently transcribe `2x+y=7` and `3x+2y=12` exactly; these regression samples are useful evidence, not a broad real-world accuracy measurement.

The remaining evaluation and calibration work below still applies. In particular, the project does not yet have the required 200–500 user-verified samples, writer-separated accuracy results, or evidence for silent automatic replacement.

## Required behavior

Transcribe the user's actual strokes, preserving numbers, variable case, operators, equation sides, fractions, powers, line breaks and working order. Do not solve, complete, simplify or repair the user's mathematics. An incorrect written calculation must remain an incorrect calculation. Unreadable marks remain ink and require review. No model can guarantee perfect recognition of ambiguous handwriting.

The supplied screenshot is a failure case: several lines of working appear to have become a long expression with an integral. The small screenshot cannot establish an exact ground-truth transcription. Capture the original stroke JSON and a user-verified transcription before diagnosing the precise failure.

## Findings from this repository

- `educations/handwriting.py` tries Windows Ink first, then the bundled PyTorch recognizer, and sends results through `ink_layout.py` and `math_validation.py`.
- `ink_layout.py` constructs spatial fractions and integrals using geometry before serializing the result. These decisions can produce structurally wrong but renderable formulas. Replaying the failed strokes is needed to confirm which decisions caused this example.
- `WHITEBOARD_PIPELINE.md` documents a CNN/BiGRU CTC fallback trained on UJI isolated characters joined into artificial sequences. Reported exact accuracy is 74.46% on isolated characters and 63.8% on joined sequences. These are not measurements of classroom equation accuracy. The 79-entry vocabulary lacks Greek letters and natural cursive training.
- `math_validation.py` checks supported syntax with SymPy. Successful parsing does not verify a match to the original ink; its LaTeX printer may also change presentation/order.
- The recent SVG rendering fix addresses display clipping. It does not improve transcription accuracy.

## Proposed pipeline

1. Capture immutable stroke IDs, coordinates, source bounds and board revision. Retain original ink through recognition, editing, undo, save and reload. Recognize after a writing pause; cancel stale requests when ink changes.
2. Render tightly cropped black strokes on a white background from the original coordinates. Preserve aspect ratio, small dots and margins. Never use a zoomed-out UI thumbnail as model input. Bound crop dimensions and flag overly dense inputs instead of shrinking them beyond legibility.
3. Segment lines/regions first, keeping a full-block context crop. Use stroke relationships to keep numerators, denominators and exponents together. Distinguish a subtraction/working underline from a fraction bar. Return separate ordered lines; do not flatten a worked solution into one expression.
4. Route maths regions to a formula recognizer and prose lines to a text recognizer. Initially use explicit Maths/Text mode; add automatic routing only after measuring it. Treat geometric symbol detection as supporting evidence, never a forced integral insertion.
5. Return region-level candidates, engine/version, source stroke IDs, crop bounds, raw transcription, structured expression or LaTeX, uncertainty and review reasons. Do not claim token-to-stroke alignment unless an aligner actually produces it. Whole-formula decoders generally need additional alignment work for symbol-level highlights.
6. Compare candidates and check structural consistency: source coverage, ordered lines, equation-side completeness, suspicious repetitions, and unexpected structural changes. Model disagreement requires review. Agreement is evidence, not proof. Calibrate acceptance using held-out real handwriting, not raw softmax scores or a model's self-reported confidence.
7. Keep the transcription authoritative. Use parsing to report syntax issues without rewriting it. Generate preview and saved output from the same approved representation. Syntax validity must never override uncertain visual evidence.
8. Show a readable source crop beside each recognized line, with alternatives where useful. Support approve/edit/keep ink per line and restore original ink. Begin with review required for every recognition. Enable automatic replacement only for a narrowly measured, calibrated subset.

## Models to benchmark

| Role | Candidate | Decision |
| --- | --- | --- |
| Primary maths recognition | PaddleOCR PP-FormulaNet_plus-M | First local benchmark candidate. Its official formula pipeline supports handwritten expressions. Evaluate on this application's strokes before selecting it. |
| Independent maths comparison | UniMERNet | Benchmark against PP-FormulaNet; use as a disagreement checker if its incremental accuracy justifies latency and memory. Avoid running two engines on every line without evidence of benefit. |
| English prose | microsoft/trocr-base-handwritten | Optional text route, using single-line crops. Not the maths parser and not a whole-page recognizer. |
| Existing Windows Ink | Installed English recognizer | Keep as a text baseline/alternative source. Measure separately from the neural fallback. |
| Existing CNN/BiGRU | Bundled ink.pt | Retain for comparison and explicit reviewed fallback; do not treat current metrics as sufficient for automatic replacement. |

No general-purpose language model is required for the first version. Reconsider a vision-language verifier only if held-out evidence shows a benefit and its privacy, cost and latency fit the deployment. It must transcribe rather than infer a plausible solution.

Do not replace `ink.pt` with one of these checkpoints: they have different preprocessing, tokenizers and inference contracts. Add engine adapters and a bounded inference worker, preload models, pin package and model revisions, and include the actual engine/model/preprocessing versions in cache keys and responses. Validate licenses for code, weights and training data before deployment. Benchmark CPU first on the intended server, then decide whether a GPU is needed from measured memory and latency; do not promise hardware capacity without a trial.

## Delivery sequence and acceptance gates

1. **Reproduce and instrument.** Save the failing stroke request as a regression fixture; label its exact lines with the author. Record real engine used, grouping decisions, crops, raw predictions and postprocessing. Keep saved diagnostic ink local and access-controlled. Deliver a replay command and baseline report.
2. **Build the evaluation set.** Start with 200-500 user-verified real examples spanning single equations, multiline working, fractions, powers, calculus, prose, faint strokes and mixed sizes. Include confusion pairs such as 1/l/I, 0/O, x/times, 5/S and 2/Z. Split by writer and writing session; keep a final test set untouched. Expand beyond this pilot before claiming a rare-error rate.
3. **Run model comparison.** Feed identical crops to candidate engines; measure character/symbol error, exact-line match and structure accuracy, plus p50/p95 latency and peak memory. Select the maths engine using local results; add the text engine only if prose is in scope. Deliver a reproducible results table.
4. **Implement preservation and review.** Fix multiline segmentation and geometric overrides; add adapters and source/version metadata; separate syntax validation from transcription. Add per-line review and sufficiently large source crops. Check apply, edit, undo, reload and export preserve every symbol, including the final 7 in `2x + 5 = 7`.
5. **Calibrate and release.** Initially require approval for all results. Proposed future target: at least 99.5% exact-line precision among automatically accepted lines on representative held-out data, reported together with acceptance coverage and a statistical confidence interval. This is a release target, not current performance or a guarantee. A small pilot cannot substantiate it. Keep uncertain cases in review and disable automatic replacement when the evidence is insufficient.
6. **Improve from corrections.** Save explicit approved corrections with their source regions under an agreed retention policy. Track error categories before fine-tuning. Fine-tune the selected model only after baseline evaluation identifies a consistent domain gap and enough correctly labeled data exists. Re-evaluate on untouched writers and sessions after every model change.

Cross-cutting gates: no lost ink on timeout or worker failure; no stale response applied after editing; no missing/duplicated source regions; zero silent invented or dropped symbols in the regression suite. Report those suite results separately from estimated real-world accuracy. Proposed initial UX latency budget: p95 under 2 seconds per ordinary line on the chosen hardware; measure it and revise the worker/UX before committing to live automatic conversion.

## Verified reference documentation

- PaddleOCR formula recognition pipeline: https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/pipeline_usage/formula_recognition.en.md
- UniMERNet implementation and model information: https://github.com/opendatalab/UniMERNet
- Microsoft TrOCR handwritten model card (IAM fine-tuning; single-line input): https://huggingface.co/microsoft/trocr-base-handwritten

These establish candidate capabilities, not accuracy on this user's writing. The recommended first implementation task is the failed-stroke replay and benchmark, followed by selection of the maths model.
