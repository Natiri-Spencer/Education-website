# Grade 7 Mathematics Term II course pack

Source: the user-supplied **Doyen Publishers, Grade 7 Mathematics Term II 2025 Schemes of Work**, 25 pages. `grade7_math_term2.py` uses its sequence and topic/outcome guidance. Lesson explanations, worked examples, activities, questions and marking guidance are original teaching drafts, not copied textbook lessons or a claim of official curriculum approval.

The pack contains nine courses and 61 modules: 60 lessons in weeks 1-7 and 9-13, plus an original assessment for week 14. Week 8 is a midterm break. Each module retains week, lesson, scheme page and suggested Smart Minds textbook page references. Textbook pages have not been independently inspected.

| Course | Scheme slots | Modules |
| --- | --- | --- |
| Algebraic expressions and equations | W1 L1-L5 | 5 |
| Linear and compound inequalities | W2 L1-W3 L1 | 6 |
| Pythagorean relationship and length | W3 L2-W4 L3 | 7 |
| Perimeter and area | W4 L4-W6 L3 | 10 |
| Volume and capacity | W6 L4-W9 L1, excluding W8 | 8 |
| Time, distance and speed | W9 L2-W11 L4 | 13 |
| Temperature | W11 L5-W12 L5 | 6 |
| Money | W13 L1-L5 | 5 |
| Review and assessment | W14 | 1 |

Install from the Django project directory:

```powershell
.\Scripts\python.exe manage.py migrate
.\Scripts\python.exe manage.py seed_grade7_math_term2
```

The command creates drafts with no price. It preserves existing courses, modules, prices and publication settings on reruns. Once imported, edit content in Django admin; editing this Python file does not overwrite saved database records. The earlier fractions course and its enrollments remain separate.

Open `/admin/educations/shortcourse/` or `/admin/educations/coursemodule/`. Select a course or module and use **View on site** to preview. Users with `change_coursemodule` can preview unpublished content without paying. Ordinary users cannot open draft outlines, and published lesson access requires paid enrollment. Answer guidance is stored in `teacher_notes` and is rendered only for editors.

Review notes:

- Several source inquiry prompts mismatch their row topics or operations. The authored questions follow the learning outcomes; affected modules have private review notes.
- The source's land-area row contains circle activities. The draft uses land-area modelling. Acre approximations are explicitly stated, with a note to check the school's convention.
- Celsius/kelvin conversions distinguish the exact 273.15 offset from the stated school approximation 273. Temperature differences do not use an offset.
- The cubic-metre activity uses prepared sticks or paper strips in place of the source's cutting task.
- The week 14 assessment is an original suggested 40-mark paper with editable timing and marking guidance. The scheme only schedules assessment; it does not supply a paper.

Before publication, review against the school's curriculum, set a price if appropriate, and enable **Is published** on each approved course. This pack follows the supplied 2025 document, not an independently verified later curriculum revision.

## Diagrams and interactive learning

All 61 scheme modules and the four existing fractions modules have local SVG diagrams. There are 37 shared illustrations, each with alternative text and an expandable text description. Images are typically a few kilobytes and are loaded only as needed. Learners can download an SVG or print/save the lesson using their browser. These features do not require a simulation or JavaScript. This is not an offline account or enrollment cache; opening a lesson initially still needs access to the site.

In Django admin, the **Diagrams and interactive activities** section lets an editor select a diagram, edit its text description, and choose or remove an activity. Four activity types are available:

- **Equation balance:** choose an equation, apply the same operation to both sides, track exact rational coefficients, predict the unknown and check the answer. Zero multiplication and division are rejected.
- **Inequality number line:** explore strict/inclusive endpoints, compound ranges, fractional test values and integer examples in the visible window.
- **Area explorer:** rectangle, parallelogram, rhombus, trapezium, circle, rectangular border and L shape. Measurements are centimetres; answers are cm², with pi = 22/7 for circles.
- **Volume and capacity explorer:** cubes, cuboids and cylinders, centimetre dimensions, full volume, capacity in litres, adjustable fill and current contents. Inside dimensions are assumed when modelling a container.

Simulation scripts are fetched only after **Open interactive activity** is pressed. Each activity retains the written lesson and static diagram and includes a no-JavaScript explanation. No video, third-party simulation library, learner tracking or automatic media playback is added. Printing hides controls and private teacher notes. The existing site framework still uses Bootstrap from a CDN; core lesson text, diagrams and activity styles are local.

For existing databases, attach missing visuals without replacing lesson content or existing diagram selections:

```powershell
.\Scripts\python.exe manage.py migrate
.\Scripts\python.exe manage.py seed_course_visuals
.\Scripts\python.exe manage.py collectstatic --noinput
```

Fresh course imports include these defaults automatically. Build the SVG assets with `node tools/build_course_diagrams.cjs`. Verify with `node --test educations/js_tests/course_simulations.test.cjs` and `python manage.py test educations`. Browser QA can be run with `python tools/course_visual_qa.py` in one terminal and `node tools/check_course_visuals.cjs` in another; it uses an isolated headless Chrome profile, serves only local snapshots/public assets on localhost, blocks external CDN requests, and checks lazy loading, mobile layout, interactions and the no-JavaScript view. Stop the local server when finished. Generated screenshots and previews are excluded from Git.
