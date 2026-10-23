# Handwriting accuracy implementation

Updated 22 October 2026. The recognition/review foundation is implemented. General handwriting accuracy and the proposed 99.5% automatic-acceptance precision target remain unproven; automatic replacement is disabled.

## Implemented stages

1. Local export of submitted and original stroke data, raw predictions, grouping diagnostics, engine metadata and editable expected lines. No automatic server-side handwriting collection was added.
2. Conservative separation of repeated equation baselines before fraction/calculus interpretation. Each stroke stays in one source region. Connected strokes are not cut across lines. This is not a general document-layout model; ambiguous blocks need review.
3. PP-FormulaNet_plus-M installed in an isolated Python environment, with official weights and SHA-256 manifest. A persistent bounded worker keeps model dependencies out of Django. Readiness requires a real inference smoke check. UniMERNet is supported by the adapter/provisioning tools as a separately selected benchmark candidate but is not downloaded. TrOCR remains an optional future prose benchmark; Windows Ink/CTC currently handle prose.
4. Independent formula and native readings with visible disagreement alternatives, including case differences. Confidence and syntax validity never approve a correction.
5. Per-line replacement selection, readable dark source previews, retention of unselected ink, save/reload and undo preservation, duplicate-source rejection and stale-response protection. Ordinary arithmetic retains its written order. Equation caches include their explicit representation to prevent stale model output from overriding manual edits.
6. Replay/evaluation tooling, synthetic stroke fixtures and regression tests. Exact text metrics and symbol metrics are separate; maths symbol metrics ignore whitespace only and preserve case, signs, numbers and structure. Algebraic equivalence does not count as a faithful transcription.
7. A conservative fast path handles fully covered, mostly geometric equations with strong native glyphs. The two reported linear samples complete in roughly 0.6–1.1 seconds on this computer. Superscripts, fractions and calculus structures remain on the formula path. Deterministic source glyphs can be fused into formula LaTeX only when token alignment is one-to-one; uncertain case disagreements remain visible alternatives.
8. The whiteboard readiness request starts formula-model loading in a background thread. Ordinary fast-path equations remain available during startup; a later complex expression reuses the persistent warm worker. `WHITEBOARD_FORMULA_PREWARM=false` disables this behavior where background loading is undesirable.

## Reproduce the model setup

From `cbc_env` on Windows:

```powershell
Scripts/python.exe -m venv tmp/formula_runtime
tmp/formula_runtime/Scripts/python.exe -m pip install -r requirements-formula.txt
Scripts/python.exe tools/provision_formula.py
Scripts/python.exe tools/check_formula.py
```

Generated weights are in `models/formula/PP-FormulaNet_plus-M`; the environment is in `tmp/formula_runtime`. Both are ignored generated artifacts. `requirements-formula.lock.txt` records the installed Windows dependency versions. The check verifies file hashes and recognizes the printed equation `2x + 5 = 7` twice before creating `ready.json`. A stale readiness revision prevents activation. Run the check again after replacing weights or runtime dependencies. Optional environment settings are documented in `.env.example`. On Linux, set the worker Python path to the environment's `bin/python` and use an available font for the printed smoke check.

Measured operational smoke checks for PP-FormulaNet_plus-M range from roughly 25–68 seconds cold and 4–7 seconds warm on this computer. The fast layout path returns the reported linear equations in roughly 0.6–1.1 seconds. Serving defaults allow 120 seconds startup and 60 seconds inference; production request timeouts must still accommodate the complex-expression model or use a prewarmed inference service.

PP-FormulaNet_plus-S was also provisioned and benchmarked. It reached about 1.1–1.7 seconds warm, but changed `8` to `z`, `3` to `S`, and failed the integral sample. It therefore remains an inactive benchmark candidate; the medium model stays active for structural accuracy.

## Use and evaluate

Refresh the whiteboard to load asset version 15. Review each source region, edit the reading or choose its alternative, select **Replace this line with the text above**, then **Apply selected lines**. Unselected regions remain ink and stay available for review. **Keep handwriting** preserves the current review's remaining sources. **Save recognition example** downloads a local diagnostic fixture.

For a real labeled example, verify every expected line, mark `verified: true`, and provide pseudonymous `writer` and `session` fields in the exported JSON. Every source stroke must belong to one expected line. Use writer/session-disjoint training, validation and test partitions. Keep downloaded examples in a private location; the app does not upload these files to a third-party service.

```powershell
Scripts/python.exe tools/evaluate_handwriting.py examples --engine legacy --report tmp/handwriting-evaluation/legacy.json
Scripts/python.exe tools/evaluate_handwriting.py examples --engine formula --report tmp/handwriting-evaluation/formula.json --crops tmp/handwriting-evaluation/crops
Scripts/python.exe tools/evaluate_handwriting.py examples --engine configured --report tmp/handwriting-evaluation/configured.json
```

Only verified examples are scored. `--model-dir` selects a separately provisioned model for comparison. Synthetic regression fixtures can be regenerated with `tools/build_ink_regressions.py` and must not be reported as real-writer accuracy data.

The initial synthetic comparison contained only three lines: PP-FormulaNet retained `2x+5=7` twice but changed lowercase `x` to uppercase `X` once. Native recognition preserved the symbols in those examples while adding spacing. This is why both readers and manual review are retained. This small test does not identify a universally best model.

## Still required before automatic replacement

- Replay original strokes from the user's failed example against an author-verified transcription. A screenshot thumbnail is not enough to establish every symbol or recover original strokes.
- Assemble the planned representative 200-500-example pilot; expand it before estimating rare errors. Measure exact-line and structure accuracy, coverage, latency and resource use on held-out writers.
- Choose/fine-tune a model only from those results. Fine-tuning needs correctly labeled data; arbitrary synthetic additions are not evidence of improved classroom accuracy.
- Calibrate an acceptance policy with confidence intervals and coverage. Until the release target is supported, every suggestion continues to require review.
- Perform a visual browser walkthrough on a session with browser access. This session's browser provider was unavailable; automated model and application tests do not substitute for visual QA.
