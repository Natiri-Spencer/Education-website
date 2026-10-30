# CBE STEM ACADEMY


## Current learning features

- CBE STEM ACADEMY branding and an About Us page with the academy mission and vision.
- Classes with lesson modules, diagrams, activities, assessment questions and teacher notes.
- A whiteboard graph plotter for linear, quadratic and cubic functions, including implicit multiplication such as `y = 2x + 5`. Students can enter a function to fill an x–y table or plot from entered table values.
- Image and document uploads, editable graphs, handwriting recognition and concise question-based AI assistance.
- Grade 7–9 science investigations and narrated lesson videos.

## Lesson videos and Canva assets

The [Female Reproductive System lesson](exports/female-reproductive-system/README.md) is a five-minute Grade 7 Integrated Science animation with labelled anatomy, ovulation and egg transport, narration, visible captions and review questions. The exported video is 1920 × 1080 at 24 fps.

- [Play or download the complete video](exports/female-reproductive-system/female-reproductive-system-grade7-5min.mp4).
- [Canva asset pack](exports/female-reproductive-system/female-reproductive-system-canva-assets.zip): complete video, 13 individual scene clips, narration, artwork, captions, transcript and timing notes.
- [Transcript](exports/female-reproductive-system/transcript.txt) and [scientific references](exports/female-reproductive-system/sources.md).

These files were produced locally and can be imported into Canva. They are not a hosted Canva design. Narration uses the installed Windows voice; the illustration was generated with the built-in ImageGen tool, with the prompt preserved in the asset folder.

The [Male Reproductive System lesson](exports/male-reproductive-system/README.md) is a five-minute Grade 7 animation with simple narration, a realistic labelled human pelvic cutaway, sperm transport, captions and review questions. Its Canva handoff includes 12 scene clips and separate audio and subtitle files.

- [Play or download the revised human-anatomy video](exports/male-reproductive-system/male-reproductive-system-grade7-human-anatomy-5min.mp4).
- [Download narration audio](exports/male-reproductive-system/narration.mp3).
- [Download the male-system Canva asset pack](exports/male-reproductive-system/male-reproductive-system-canva-assets.zip).
- [Read the transcript](exports/male-reproductive-system/transcript.txt), [scientific references](exports/male-reproductive-system/sources.md), and [artwork attribution](exports/male-reproductive-system/assets/ATTRIBUTION.md).

The male-system video uses the normal-anatomy panel of a BruceBlaus / Blausen Medical illustration, with labels and animated transport mapped to the depicted organs. The adapted video and scene clips are distributed under CC BY-SA 4.0; retain the included attribution when reusing them. Both reproductive-system lessons are five minutes long, with 1080p video and visible captions.

Additional exports are in `exports/digestion/`, `exports/photosynthesis/` and `exports/branding/`. Editable storyboards and rendering scripts are in `tools/`. Rendering requires Node.js with `sharp`, FFmpeg at the path configured in each script, and Windows SAPI for the narration scripts. These authoring dependencies are separate from the Django website requirements.

Uploaded lesson records and media in the local database are not installed by cloning the repository. Apply migrations and add the exported MP4 to the intended grade/subject through the admin resources interface. Both reproductive-system lessons have already been added to Grade 7 Integrated Science in the development database. Use persistent media storage on a deployed website.

Temporary narration fragments, render previews and QA screenshots under `tmp/` are excluded from Git. Final shareable exports remain versioned.

## Whiteboard handwriting autocorrection

The whiteboard keeps every original pen stroke and proposes editable corrections after a short pause. Ordinary, fully covered equations use a fast geometry and Windows Ink path. Fractions, powers, roots, and calculus notation can use the local PP-FormulaNet_plus-M model; prose uses Windows Ink with the bundled PyTorch recognizer as a fallback. Recognition transcribes the writing without solving or repairing the author's mathematics.

Every suggestion requires review before it replaces ink. The review dialog shows the source handwriting, alternatives, recognition details, and a checkbox for each line. Unselected or unread regions remain as ink. **Undo** and **Restore original handwriting** recover the source strokes, and manual edits are protected from later recognition passes. Boards, source ink, recognition profile, and view positions remain saved in the browser.

The whiteboard also accepts voice equations and interactive function graphs. **Voice equation** starts browser speech recognition directly from the microphone click, keeps listening across short pauses, and preserves the transcript if the browser restarts its speech session. Its live status reports permission, microphone, and speech-service failures instead of leaving an unexplained blank transcript. It converts general linear, quadratic, and cubic equations with a deterministic parser and supports arbitrary coefficients, variables, powers, roots, fractions, decimals, inequalities, and common functions. It shows an editable rendered preview before insertion; unsupported browsers retain the typed-transcript fallback. **Graph** safely parses explicit functions such as `y = x^2` without JavaScript evaluation, plots whitelisted arithmetic and common functions as native SVG, and keeps the graph editable, movable, resizable, undoable, saved, and exportable with the board.

The eraser removes both handwriting and equation elements, including equations created by voice input. Touching the canvas with four or more fingers clears every board element in one undoable action; **Undo** restores the complete board.

### Whiteboard uploads

Uploads accepts multiple PNG/JPEG/WebP images and PDF, Word, Excel, PowerPoint, TXT and CSV documents, up to 10 MB each. Images appear on the canvas. Documents appear as movable file cards; double-click a card or use its download button in Uploads to retrieve the original file. Documents are stored in IndexedDB on the device, keeping large file contents out of the board's localStorage history. Editable board downloads embed attachments for transfer to another browser; importing restores the original bytes under new local attachment IDs. Portable backups support up to 40 MB of document attachments, with a 64 MB board import limit. Download a board backup before clearing browser storage. Documents are attachments, not rendered Office/PDF previews.

### Whiteboard AI Assist

Signed-in learners can open **Ask AI**, type a question, and press **Get answer**. The whiteboard can be empty. Only the typed question is sent; the board and drawings are not automatically included. The assistant is instructed to answer directly in 1–3 short sentences, normally within 80 words, and to ask for essential missing information rather than inventing details. Responses are not guaranteed to be correct.

Answers appear in the dialog first. **Add answer to whiteboard** optionally inserts an AI-labelled note with undo/redo and board persistence. Editing a question invalidates the previous answer and cancels any pending request, preventing stale answers from being inserted. Empty questions, incomplete provider responses, oversized answers, service failures and service limits produce explicit errors. Legacy board-action endpoints remain compatible, but the student interface uses the question-only flow.

AI requests use CSRF protection, sign-in checks, per-minute rate limiting, request-size limits, provider timeouts, and a strict structured-output schema. Board content is treated as untrusted input. The provider key stays on the server. Configure the optional provider in `.env`:

```text
OPENAI_API_KEY=your-server-side-key
WHITEBOARD_AI_ENABLED=true
WHITEBOARD_AI_MODEL=gpt-4o-mini
WHITEBOARD_AI_TIMEOUT=30
WHITEBOARD_AI_RATE_LIMIT=20
```

If no key is configured or the API account has no credits, the rest of the whiteboard continues to work and Ask AI displays an unavailable message. API credits must be available for live answers. Recognition retraining remains a separate measured workflow based on reviewed classroom examples.

To use the project-local alternative instead of the paid API, set `WHITEBOARD_AI_PROVIDER=ollama`, `WHITEBOARD_AI_LOCAL_MODEL=qwen2.5:1.5b`, `WHITEBOARD_AI_LOCAL_URL=http://127.0.0.1:11434`, and `WHITEBOARD_AI_LOCAL_TIMEOUT=120` in `.env`. The model stays in `models/ollama/` and the Windows CPU runtime in `tools/ollama/`; neither belongs in source control. `python manage.py runserver` automatically starts the project-local service when this provider is selected. You can also start it with `tools/start_local_ai.ps1`. On a deployed server, run and supervise the local service alongside Django; the developer's computer does not supply inference to a separately hosted website. The service listens on loopback and cloud inference is disabled. Keep sufficient memory available, and review answers: a small local model may make factual mistakes.


The endpoint is CSRF-protected, size-limited, and caches results by exact strokes and model revision. Recognition timeouts and worker failures retain the original ink. On Windows, the native bridge compiles `educations/HandwritingRecognizer.cs` into the ignored `tmp/whiteboard_ink/` directory. The optional formula model runs locally in the ignored `tmp/formula_runtime/` directory, with weights stored under ignored `models/formula/`. A readiness request prewarms the persistent formula worker in the background.

See [WHITEBOARD_PIPELINE.md](WHITEBOARD_PIPELINE.md) and [HANDWRITING_IMPLEMENTATION_STATUS.md](HANDWRITING_IMPLEMENTATION_STATUS.md) for setup, measured limits, evaluation, and retraining instructions.

Run the whiteboard checks with:

```powershell
node --test educations/js_tests/whiteboard.test.cjs educations/js_tests/whiteboard_rendering.test.cjs educations/js_tests/whiteboard_voice_math.test.cjs educations/js_tests/whiteboard_graph.test.cjs educations/js_tests/whiteboard_ai.test.cjs
.\Scripts\python.exe manage.py test educations.test_handwriting educations.test_ink_accuracy educations.test_whiteboard educations.test_calculus_ink educations.test_math_validation educations.test_neural_ink educations.test_whiteboard_ai
.\Scripts\python.exe tools/check_ink_endpoint.py
```

An online learning website for CBC learners. Students can find learning materials, join Classes, and explore virtual science labs.

## 🚀 Features

- Browse learning materials by grade and subject.
- View PDF, video, and image resources.
- Explore STEM Classes for Grades 7–9 without a payment step.
- Let staff manage courses and learning materials through the admin site.
- Explore virtual labs for Grades 7–9.

## 🧪 Virtual Labs

- Choose Grade 7, 8, or 9 to open its lab dashboard.
- Browse labs grouped by subject and strand.
- Open the Grade 7 **Acids, Bases, and Indicators** lesson.
- Read the lesson sections, then choose **View Experiment** for the hibiscus lab or **Open Commercial Indicators** for a separate investigation.
- In the commercial indicators lab, drag clean beakers, samples, and indicators from the shelf, or click the controls. Compare red and blue litmus paper, methyl orange, and phenolphthalein on fresh sample portions.
- Make a colour prediction, watch the test, and record your conclusion and evidence in the investigation notebook. Notebook entries remain available while navigating between experiments; **Start again** or reloading the page clears them.
- Other labs are marked **Coming soon** until they are ready.

## 🛠️ Tech Stack

- **Python 3.13** and **Django 6.0.9** — website and backend.
- **Django templates, HTML, CSS, and JavaScript** — pages and virtual lab.
- **Bootstrap** through `django-bootstrap5` — website components.
- **PostgreSQL** for deployment and **SQLite** for local development.
- **Gunicorn** — runs the website online.
- **WhiteNoise** — serves CSS, JavaScript, and other static files.
- Legacy Daraja integration remains in the codebase; the current Classes interface has no payment option.

## ⚙️ Setup

1. Clone this repository and open the project folder:

   ```powershell
   git clone https://github.com/Natiri-Spencer/Education-website.git
   cd Education-website
   ```

2. Create and activate a Python environment, then install the requirements:

   ```powershell
   py -3.13 -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Create your local settings file and prepare the database:

   ```powershell
   Copy-Item .env.example .env
   python manage.py migrate
   ```

4. Start the website:

   ```powershell
   python manage.py runserver
   ```

5. Open <http://127.0.0.1:8000/> in your browser.

The example `.env` settings are for local development. Keep keys and credentials in `.env`; never commit them to GitHub.

## 🌍 Deployment

Set these environment variables on your hosting service:

- `DJANGO_SECRET_KEY` — a private production secret.
- `DJANGO_ALLOWED_HOSTS` — your website's hostname.
- `DATABASE_URL` — your hosted PostgreSQL database.
- `CSRF_TRUSTED_ORIGINS` — your website's HTTPS address.
- `DJANGO_DEBUG=False` — turn off debug mode.

Run database migrations and collect static files during deployment:

```sh
python manage.py migrate
python manage.py collectstatic --noinput
```

The included `Procfile` starts the app with Gunicorn. Set up persistent storage for uploaded files if your hosting service does not keep local files between deployments.

### Grade 7 animated separation experiments

Mixtures includes hands-on sublimation, paper chromatography, fractional distillation and filtration alongside evaporation. Learners assemble labelled SVG apparatus from a draggable/clickable shelf and run each animated action. Animations can pause and resume; leaving an experiment pauses it. Each method has a separately saved observation notebook with marks and corrections. Filtration uses three concise questions: residue, filtrate and method, marked out of three. Other methods use two marked choices and optional written notes for teacher review. Browser local storage retains notebook entries across reloads; resetting apparatus does not erase them. Clear this notebook affects only the selected method. Notes are local to the browser, not synced to an account.

The chromatography bands are illustrative, and the distillation model produces an ethanol-rich fraction rather than claiming pure ethanol. Distillation uses electric heating, a packed column, a correctly positioned thermometer, a condenser with lower water inlet and upper outlet, and an open receiver. Sublimation separates ammonium chloride from common salt in a glass beaker, using a visible Bunsen flame and a supported cold-water round-bottom flask to collect a white deposit in a fume cupboard. Reference links are available under About this model on each shelf.

Manual verification: assemble each setup in order; run all actions; pause/resume an action; record correct and incorrect answers; change methods and return; reset apparatus; reload the page and confirm method-specific entries remain.

### Grade 7 electrical energy

Electrical Energy under Force & Energy includes a simple circuit, two bulbs in series or parallel, and dry cells in series or parallel (plus a one-cell comparison). Learners bring apparatus from a shelf, connect pairs of terminals, operate the switch, and measure with an ammeter in series and a voltmeter across the selected source or bulb. Parallel bulb circuits support total-current and individual-branch measurements. A wiring guide is optional; it does not connect wires automatically. Changing topology or ammeter location opens the switch and clears wiring; changing voltage target removes only the voltmeter leads. Notebook entries remain saved separately for each investigation and are marked for current, voltage and brightness.

This guided model validates connections against the selected arrangement, accepting equivalent junction wiring. It uses ideal 1.5 V cells, identical fixed 10-ohm bulbs, ideal meters and zero-resistance wires. Bulb glow follows relative electrical power. Incorrect wiring is blocked rather than simulating a damaging short circuit. Parallel cell discharge time and real filament temperature are not simulated. Source links are available under About this model.

Run the circuit and learner workflow checks with `node --test educations/js_tests/electrical_model.test.cjs educations/js_tests/electrical_ui.test.cjs`.

### Grade 7 lab notebooks

My lab notebooks in the Grade 7 dashboard lists all 15 investigations, including apparatus identification, both indicator experiments, all five separation methods, the three magnetism tests and the four electrical investigations. It reads the existing experiment notebooks without replacing their records. Students can add a written observation or conclusion for teacher review, and print all notebooks with their saved work or blank tables for experiments not yet recorded.

Apparatus choices and hibiscus classifications now have saved marks and corrections. Evaporation and commercial-indicator records also persist across page reloads and apparatus resets. Each notebook has its own storage; clearing one does not clear the others. Storage is local to the browser and is not synced to a learner account. Run notebook checks with `node --test educations/js_tests/lab_notebooks.test.cjs`.

Sources of energy (Electrical Energy): assemble a solar panel and bulb circuit, connect two wires, and compare uncovered, partly covered and fully covered panel observations. The saved notebook checks brightness and conclusions. Shading is a qualitative teaching model.

Grade 7 Mathematics has seven lesson tabs for Geometrical Constructions and Volume and Capacity. Procedure & Experiment opens a native SVG workspace: draggable/rotatable instruments, point/line/angle/circle drawing, measurements, erasing, undo/redo, zoom and guided equilateral triangle, perpendicular bisector and angle bisector constructions. Volume and Capacity uses adjustable inside dimensions and water levels. Experiment notes and pre-assessment ideas are saved separately in this browser for each topic.

Geometry activity menu: basic constructions; 60 and 30 degree angles; isosceles triangles by SSS and equal base angles; an equilateral triangle; scalene triangles by SSS and SAS; circles and concentric circles. Each activity has a procedure checklist and separate browser notebook. Existing free drawing and bisector exercises remain available.

Volume and Capacity now has a three-column workspace and six activities: cubes/cuboids, cylinders (pi = 3.142), fixed measurements, metric unit conversion, choosing measurement units, and volume versus capacity. Measurement buttons align a draggable ruler to edges. Sliders change the solids and water level; student answers are verified and recorded with corrections in separate activity notebooks. The built-in calculator parses arithmetic without evaluating code.

Grade 8 Integrated Science has its own dashboard, seven lesson tabs, procedure/workbench/shelf layout and seven separate notebooks across four experiments. Oxygen is prepared with hydrogen peroxide and manganese(IV) oxide, collected over water after purging air and tested with a glowing splint. Osmosis compares raw/boiled potato cups, salt-permeable Visking tubing, a retained-solute control and tubing in potato holders. Diffusion compares potassium manganate(VII) in cool and uniformly warm still water. Elements and Compounds compares iron, sulfur, their unheated mixture and cooled iron(II) sulfide after Bunsen heating on a tripod and wire gauze. Animations are qualitative, can be paused/replayed, and respect reduced-motion preferences.
