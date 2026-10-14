# 🎓 CBC Education Portal

An online learning website for CBC learners. Students can find learning materials, take short courses, and explore virtual science labs.

## 🚀 Features

- Browse learning materials by grade and subject.
- View PDF, video, and image resources.
- Explore short courses for Grades 7–9. The sample Mathematics course costs KES 500.
- Use Safaricom Daraja M-Pesa to pay for a course.
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
- **Safaricom Daraja** — M-Pesa course payments.

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

The example `.env` settings are for local development. M-Pesa payments need Daraja credentials; keep those credentials in `.env` and never commit them to GitHub.

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

To accept M-Pesa payments, add these Daraja settings to your local `.env` file or hosting service:

- `MPESA_ENVIRONMENT` — use `sandbox` while testing.
- `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` — from your Daraja app.
- `MPESA_SHORTCODE` and `MPESA_PASSKEY` — your payment details from Safaricom.
- `MPESA_CALLBACK_URL` — your public HTTPS address ending in `/payments/mpesa/callback/`.

Test payments in the Daraja sandbox before switching to production. Never commit these credentials to GitHub.

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
