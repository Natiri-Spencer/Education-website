# CBE STEM ACADEMY

## Deployment preparation

The portable Docker deployment is documented in [DEPLOYMENT.md](DEPLOYMENT.md). It provides HTTPS through Caddy, non-root Gunicorn, persistent PostgreSQL and uploads, shared Redis caches/request limits, readiness checks, and a private content-transfer command. The image includes the five curated Grade 7 lessons, private-work storage, consent-aware accounts, class submissions and the CPU handwriting recognizer. Ask AI has been removed. Secrets, local databases, uploads and authoring workspaces are excluded from the build. Copy `.env.production.example` to a private `.env.production` and supply the server domain and fresh secrets before launching.

`python manage.py export_deployment deployment-backups/classroom-transfer.zip` exports accounts, classes, resources and uploaded files for a fresh deployment. Keep this archive private; it contains account password hashes. Browser-only whiteboards and lab notebooks need separate learner exports. GitHub Actions checks application behavior and the Linux deployment stack; the website has not yet been published.



## Accounts, private work and teacher review

- Public signup starts with an age band and recovery email. Under-18 requests require an explicit guardian acknowledgement before collecting a new learner username or password. Email possession alone does not establish legal guardianship; disputes require staff review. Links expire after 24 hours. Existing accounts and hashes are preserved and complete verification before new online saving.
- Forgotten-password pages use username plus verified recovery email, one-hour one-use reset links, CSRF protection and request limits. Staff recovery records the identity-check method and requires the learner to change the temporary password.
- **My Learning** includes grade, recent lessons, explicit self-reported completion, classes, drafts, submissions and feedback. Practice marks are distinct from teacher assessments.
- Whiteboards, document attachments and Grade 7–9 notebook/reflection/drawing keys use an explicit account-scoped storage adapter. Verified accounts autosave online; offline edits stay queued locally. Concurrent revisions retain both copies until the learner chooses. Old unowned work is never assigned automatically: My Learning offers previewed opt-in import, including legacy whiteboard documents where present.
- Private files are outside public media. Each learner has a 50 MB allowance and a 10 MB document limit. Export online work, delete drafts and remove unused documents from My Learning. Submitted copies retain their attachments. The current item limits are 400 saved-work keys and 200 private documents per account.
- Administrators approve users as teachers through the user-list action, then assign them to grade-based class groups. Teachers have no administrator access by default. Learners request membership using class codes; assigned teachers approve it and review only submitted copies. Resubmissions and assessment history are retained.
- Help, Support, Privacy, Terms, Guardian Information and Account Deletion pages are available. Owner email, real SMTP delivery and Kenyan privacy/content approval are still launch inputs; no compliance certification or classroom trial is claimed.

Use the private operations and rollout instructions in [LAUNCH_READINESS.md](LAUNCH_READINESS.md). The generated [content inventory](CONTENT_REVIEW.md) checks runtime assets and records the published review scope. Named-teacher scientific approval remains required.

## Current learning features

- CBE STEM ACADEMY branding and an About Us page with the academy mission and vision.
- Classes with lesson modules, diagrams, activities, assessment questions and teacher notes.
- A whiteboard graph plotter for linear, quadratic and cubic functions, including implicit multiplication such as `y = 2x + 5`. Students can enter a function to fill an x–y table or plot from entered table values.
- Image and document uploads, editable graphs, handwriting recognition and account-based private saving.
- Grade 7–9 science investigations and narrated lesson videos.

## Lesson videos and Canva assets

All five reproductive-health lessons appear under **Grade 7 → Integrated Science → Living Things and Environment** in both the dashboard and subject resources. Female and male reproductive-system videos open dedicated pages with video, audio, captions, downloads and transcripts. Their original upload records and files are retained, while duplicate entries are hidden from the subject's general Videos list. The versioned exports make these pages available after cloning without database lesson records. Their routes end in `/female-reproductive-system/` and `/male-reproductive-system/` under `/educations/grade-7/integrated-science/living-things-and-environment/`.

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

The [Fertilisation: The Sperm’s Journey lesson](exports/fertilization/README.md) follows the vagina → cervix → uterus → fallopian tube, then zooms in on one sperm entering the egg. It explains protective changes, why extra sperm remain outside, how unused sperm are eventually cleared, and the formation of a zygote. The five-minute Grade 7 lesson includes simple narration, anatomical and microscopic teaching visuals, captions, review questions, and 12 Canva scene clips.

- [Complete fertilisation video](exports/fertilization/fertilization-grade7-5min.mp4), [audio](exports/fertilization/narration.mp3), and [Canva asset pack](exports/fertilization/fertilization-canva-assets.zip).
- [Scientific sources and model limits](exports/fertilization/sources.md) and [artwork prompts](exports/fertilization/assets/visual-prompt.txt).

Additional exports are in `exports/digestion/`, `exports/photosynthesis/` and `exports/branding/`. Editable storyboards and rendering scripts are in `tools/`. Rendering requires Node.js with `sharp` (and `@napi-rs/canvas` for the pregnancy lesson), FFmpeg at the path configured in each script, and Windows SAPI for the narration scripts. These authoring dependencies are separate from the Django website requirements.

The fertilisation lesson is available in **Grade 7 → Integrated Science → Living Things and Environment** at `/educations/grade-7/integrated-science/living-things-and-environment/fertilisation/`. Its page includes video, audio, English captions, downloads, and a transcript. It serves the versioned files in `exports/fertilization/` with byte-range support for seeking; no database lesson record is required after cloning.

Other uploaded lesson records and media in the local database are not installed by cloning the repository. Apply migrations and add those exported MP4s to the intended grade/subject through the admin resources interface. The female-system, male-system and fertilisation lessons have also been added to Grade 7 Integrated Science in the development database. Use persistent media storage for uploads on a deployed website.

The [Implantation and Pregnancy lesson](exports/pregnancy/README.md) continues this sequence under **Grade 7 → Integrated Science → Living Things and Environment**. The five-minute video explains blastocyst implantation, embryo and fetal development, the placenta and umbilical cord, amniotic fluid, the three trimesters, and gestation counting in simple English. It includes original anatomy artwork, narration, visible captions, separate audio, a transcript, and 12 Canva-ready scene clips. The website page is at `/educations/grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/` and serves versioned assets without a database lesson record. Scientific references and artwork prompts accompany the export.

- [Watch or download the pregnancy video](exports/pregnancy/pregnancy-grade7-5min.mp4), [listen to the audio](exports/pregnancy/narration.mp3), or [download the Canva pack](exports/pregnancy/pregnancy-canva-assets.zip).
- [Transcript](exports/pregnancy/transcript.txt), [scientific sources](exports/pregnancy/sources.md), [original artwork prompts](exports/pregnancy/assets/visual-prompts.md), and [verification results](exports/pregnancy/verification.md).
- Verified: exactly 300 seconds, 1080p at 24 fps, complete video/audio decoding, all 12 narrated clips, caption loading, video seeking, audio playback, and mobile layout. Run `python manage.py test educations.test_curriculum_lessons` for the website lesson checks.

Temporary narration fragments, render previews and QA screenshots under `tmp/` are excluded from Git. Final shareable exports remain versioned.

**Video 5 — [Physical Changes During Adolescence](exports/adolescence/README.md)** is a five-minute Grade 7 Integrated Science lesson under **Living Things and Environment**. It explains shared changes, typical changes in girls and boys, menstrual periods, voice changes, different puberty timing, and personal care using simple narration and respectful, fully clothed diagrams.

- [Complete video](exports/adolescence/adolescence-grade7-5min.mp4), [audio](exports/adolescence/narration.mp3), and [Canva handoff pack](exports/adolescence/adolescence-canva-assets.zip) with 12 narrated scenes, captions, transcript and artwork notes.
- [Scientific references and teaching limits](exports/adolescence/sources.md). The local lesson page is `/educations/grade-7/integrated-science/living-things-and-environment/physical-changes-during-adolescence/` and serves the versioned files without a database lesson record.
- Editable diagrams are in `tools/adolescence_visuals.cjs`; narration and rendering scripts use the `adolescence` prefix. Authoring requires `@napi-rs/canvas`, `sharp`, Windows SAPI and FFmpeg.

## Whiteboard handwriting autocorrection

The whiteboard keeps every original pen stroke and proposes editable corrections after a short pause. Ordinary, fully covered equations use a fast geometry and Windows Ink path. Fractions, powers, roots, and calculus notation can use the local PP-FormulaNet_plus-M model; prose uses Windows Ink with the bundled PyTorch recognizer as a fallback. Recognition transcribes the writing without solving or repairing the author's mathematics.

Every suggestion requires review before it replaces ink. The review dialog shows the source handwriting, alternatives, recognition details, and a checkbox for each line. Unselected or unread regions remain as ink. **Undo** and **Restore original handwriting** recover the source strokes, and manual edits are protected from later recognition passes. Boards, source ink, recognition profile, and view positions remain saved in the browser.

The whiteboard also accepts voice equations and interactive function graphs. **Voice equation** starts browser speech recognition directly from the microphone click, keeps listening across short pauses, and preserves the transcript if the browser restarts its speech session. Its live status reports permission, microphone, and speech-service failures instead of leaving an unexplained blank transcript. It converts general linear, quadratic, and cubic equations with a deterministic parser and supports arbitrary coefficients, variables, powers, roots, fractions, decimals, inequalities, and common functions. It shows an editable rendered preview before insertion; unsupported browsers retain the typed-transcript fallback. **Graph** safely parses explicit functions such as `y = x^2` without JavaScript evaluation, plots whitelisted arithmetic and common functions as native SVG, and keeps the graph editable, movable, resizable, undoable, saved, and exportable with the board.

The eraser removes both handwriting and equation elements, including equations created by voice input. Touching the canvas with four or more fingers clears every board element in one undoable action; **Undo** restores the complete board.

### Whiteboard uploads

Uploads accepts multiple PNG/JPEG/WebP images and PDF, Word, Excel, PowerPoint, TXT and CSV documents, up to 10 MB each. Images appear on the canvas. Documents appear as movable file cards; double-click a card or use its download button in Uploads to retrieve the original file. Documents are stored in IndexedDB on the device, keeping large file contents out of the board's localStorage history. Editable board downloads embed attachments for transfer to another browser; importing restores the original bytes under new local attachment IDs. Portable backups support up to 40 MB of document attachments, with a 64 MB board import limit. Download a board backup before clearing browser storage. Documents are attachments, not rendered Office/PDF previews.

The endpoint is CSRF-protected, size-limited, and caches results by exact strokes and model revision. Recognition timeouts and worker failures retain the original ink. On Windows, the native bridge compiles `educations/HandwritingRecognizer.cs` into the ignored `tmp/whiteboard_ink/` directory. The optional formula model runs locally in the ignored `tmp/formula_runtime/` directory, with weights stored under ignored `models/formula/`. A readiness request prewarms the persistent formula worker in the background.

See [WHITEBOARD_PIPELINE.md](WHITEBOARD_PIPELINE.md) and [HANDWRITING_IMPLEMENTATION_STATUS.md](HANDWRITING_IMPLEMENTATION_STATUS.md) for setup, measured limits, evaluation, and retraining instructions.

Run the whiteboard checks with:

```powershell
node --test educations/js_tests/whiteboard.test.cjs educations/js_tests/whiteboard_rendering.test.cjs educations/js_tests/whiteboard_voice_math.test.cjs educations/js_tests/whiteboard_graph.test.cjs
.\Scripts\python.exe manage.py test educations.test_handwriting educations.test_ink_accuracy educations.test_whiteboard educations.test_calculus_ink educations.test_math_validation educations.test_neural_ink
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

For the prepared portable stack, follow [DEPLOYMENT.md](DEPLOYMENT.md). It includes configuration, private content transfer, launch checks and backups. The notes below apply when arranging equivalent services on another host.

Set these environment variables on your hosting service:

- `DJANGO_SECRET_KEY` — a private production secret.
- `DJANGO_ALLOWED_HOSTS` — your website's hostname.
- `DATABASE_URL` — your hosted PostgreSQL database.
- `CSRF_TRUSTED_ORIGINS` — your website's HTTPS address.
- `DJANGO_DEBUG=False` — turn off debug mode.
- `DJANGO_TRUST_PROXY=True` — only when a private trusted proxy sets the HTTPS forwarding header.
- `DJANGO_MEDIA_ROOT` — an absolute persistent upload directory, served separately by the proxy.
- `CACHE_URL` — a private shared Redis service for recognition caches and AI limits.

Run database migrations and collect static files during deployment:

```sh
python manage.py migrate
python manage.py collectstatic --noinput
```

The included `Procfile` starts the app with Gunicorn. Set up persistent storage for uploaded files if your hosting service does not keep local files between deployments.

### Grade 7 animated separation experiments

Mixtures includes hands-on sublimation, paper chromatography, fractional distillation and filtration alongside evaporation. Learners assemble labelled SVG apparatus from a draggable/clickable shelf and run each animated action. Animations can pause and resume; leaving an experiment pauses it. Each method has a separately saved observation notebook with marks and corrections. Filtration uses three concise questions: residue, filtrate and method, marked out of three. Other methods use two marked choices and optional written notes for teacher review. Browser local storage retains notebook entries across reloads; resetting apparatus does not erase them. Clear this notebook affects only the selected method. Verified signed-in accounts sync notes privately; guests and unverified accounts retain their own device copy. Older unowned device work requires explicit import in My Learning.

The chromatography bands are illustrative, and the distillation model produces an ethanol-rich fraction rather than claiming pure ethanol. Distillation uses electric heating, a packed column, a correctly positioned thermometer, a condenser with lower water inlet and upper outlet, and an open receiver. Sublimation separates ammonium chloride from common salt in a glass beaker, using a visible Bunsen flame and a supported cold-water round-bottom flask to collect a white deposit in a fume cupboard. Reference links are available under About this model on each shelf.

Manual verification: assemble each setup in order; run all actions; pause/resume an action; record correct and incorrect answers; change methods and return; reset apparatus; reload the page and confirm method-specific entries remain.

### Grade 7 electrical energy

Electrical Energy under Force & Energy includes a simple circuit, series/parallel bulbs, and series/parallel dry cells with a one-cell comparison. The bench starts empty. Learners predict, drag apparatus from the shelf, choose their own positions, move or rotate components, and connect the terminals. Click-then-place, touch placement, keyboard movement and return-to-shelf actions are also available. Detailed original SVG artwork represents digital meters, modular switches, dry-cell holders, screw lamps in holders, binding posts and insulated leads.

Procedures update with the chosen investigation, circuit arrangement and measurement target. Choosing series/parallel changes the challenge without arranging components or rewiring the learner's circuit. After finishing the build, the learner presses **Check my arrangement**. The switch stays disabled until the check passes; editing the circuit opens it and requires another check. Feedback covers missing equipment, overlapping apparatus, wiring and meter connections. Optional connection tips explain concepts without filling in a solution. The checker accepts alternative component orders, reversed non-polarised lamps and equivalent junction wiring. Parallel circuits support total and branch-current measurements. Predictions and evidence-based conclusions are saved alongside marked readings and remain available in My lab notebooks and printouts; old records are retained.

The model uses ideal 1.5 V cells, identical fixed 10-ohm bulbs, ideal meters and zero-resistance wires. Cells form a directly interconnected source pack, with the switch, ammeter and lamps freely ordered in the external circuit. Apparatus position is independent of electrical connectivity. The switch must control every lamp. Brightness follows relative electrical power. The virtual checker prevents energising short circuits and incorrectly connected meters; discharge time and real filament temperature are not modelled. Source links are under About this model. The apparatus drawings represent modern school equipment rather than a particular manufacturer's product.

Run the circuit, learner workflow, notebook and solar-regression checks with `node --test educations/js_tests/electrical_model.test.cjs educations/js_tests/electrical_ui.test.cjs educations/js_tests/lab_notebooks.test.cjs educations/js_tests/energy_sources.test.cjs`.

### Grade 7 lab notebooks

My lab notebooks in the Grade 7 dashboard lists all 15 investigations, including apparatus identification, both indicator experiments, all five separation methods, the three magnetism tests and the four electrical investigations. It reads the existing experiment notebooks without replacing their records. Students can add a written observation or conclusion for teacher review, and print all notebooks with their saved work or blank tables for experiments not yet recorded.

Apparatus choices and hibiscus classifications now have saved marks and corrections. Evaporation and commercial-indicator records also persist across page reloads and apparatus resets. Each notebook has its own storage; clearing one does not clear the others. Storage is separated by account, with private online sync for verified accounts and an offline recovery copy. Guest work remains device-only. Run notebook checks with `node --test educations/js_tests/lab_notebooks.test.cjs`.

Sources of energy (Electrical Energy): assemble a solar panel and bulb circuit, connect two wires, and compare uncovered, partly covered and fully covered panel observations. The saved notebook checks brightness and conclusions. Shading is a qualitative teaching model.

Grade 7 Mathematics has seven lesson tabs for Geometrical Constructions and Volume and Capacity. Procedure & Experiment opens a native SVG workspace: draggable/rotatable instruments, point/line/angle/circle drawing, measurements, erasing, undo/redo, zoom and guided equilateral triangle, perpendicular bisector and angle bisector constructions. Volume and Capacity uses adjustable inside dimensions and water levels. Experiment notes and pre-assessment ideas are saved separately in this browser for each topic.

Geometry activity menu: basic constructions; 60 and 30 degree angles; isosceles triangles by SSS and equal base angles; an equilateral triangle; scalene triangles by SSS and SAS; circles and concentric circles. Each activity has a procedure checklist and separate browser notebook. Existing free drawing and bisector exercises remain available.

Volume and Capacity now has a three-column workspace and six activities: cubes/cuboids, cylinders (pi = 3.142), fixed measurements, metric unit conversion, choosing measurement units, and volume versus capacity. Measurement buttons align a draggable ruler to edges. Sliders change the solids and water level; student answers are verified and recorded with corrections in separate activity notebooks. The built-in calculator parses arithmetic without evaluating code.

Grade 8 Integrated Science has its own dashboard, seven lesson tabs, procedure/workbench/shelf layout and seven separate notebooks across four experiments. Oxygen is prepared with hydrogen peroxide and manganese(IV) oxide, collected over water after purging air and tested with a glowing splint. Osmosis compares raw/boiled potato cups, salt-permeable Visking tubing, a retained-solute control and tubing in potato holders. Diffusion compares potassium manganate(VII) in cool and uniformly warm still water. Elements and Compounds compares iron, sulfur, their unheated mixture and cooled iron(II) sulfide after Bunsen heating on a tripod and wire gauze. Animations are qualitative, can be paused/replayed, and respect reduced-motion preferences.
