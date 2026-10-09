# CBC Education Portal

## Virtual labs

The virtual labs are designed for Junior School learners in Grades 7–9:

- `/virtual-labs/` opens the grade selector. Each grade card leads to its dashboard.
- `/virtual-labs/grade/7/` shows Grade 7's dashboard, with labs grouped by strand.
- The Grade 7 Integrated Science lesson, **Acids, Bases, and Indicators**, has sections for Introduction, Learning Outcomes, Resources, Pre-Assessment, Procedure & Experiment, Post-Assessment, and Conclusion.
- **View Experiment** opens the interactive hibiscus-indicator lab. Learners follow the procedure, use the virtual apparatus, and classify household solutions based on observed colour changes. The lab includes a back control to return to the lesson.
- Other lab cards and the Grade 8 and 9 content are marked as coming soon until those activities are added.

The grade selector, dashboards, lesson sections, and experiment interface are rendered from Django templates. The virtual lab interactions and styling are implemented in JavaScript and CSS in `educations/static/educations/virtual_labs.js` and `educations/static/educations/virtual_labs.css`.

## Technologies

- **Python 3.13** and **Django 6.0.9** for the server-side application, URLs, views, authentication, and data models.
- **Django templates, HTML, CSS, and JavaScript** for the website and interactive virtual lab; `django-bootstrap5` provides Bootstrap integration.
- **PostgreSQL** for hosted deployments through `DATABASE_URL`; **SQLite** is used as the local fallback.
- **Gunicorn** serves the Django WSGI application, and **WhiteNoise** serves collected static files.
- **Pillow** handles image uploads, and **python-dotenv** loads local environment settings.
- **Safaricom Daraja M-Pesa** supports the short-course payment flow.

## Deployment

The Django project root is this directory (`cbc_env`), which contains `manage.py`.
Use Python 3.13 and install dependencies with `pip install -r requirements.txt`.
Before starting the web service, run:

```sh
python manage.py collectstatic --noinput
python manage.py migrate
```

Start the service with the included `Procfile` (`gunicorn spencer_project.wsgi:application`).

Set these environment variables in the hosting service:

- `DJANGO_SECRET_KEY`: a newly generated secret, kept out of source control.
- `DJANGO_ALLOWED_HOSTS`: comma-separated hostnames for the deployed site.
- `DATABASE_URL`: persistent PostgreSQL connection URL. SQLite is only the local fallback.
- `CSRF_TRUSTED_ORIGINS`: comma-separated HTTPS origins, including scheme, for the deployed site.
- `DJANGO_DEBUG`: leave unset or set to `False` in production.

Static assets are served by WhiteNoise after `collectstatic`. User uploads are stored in
`media/`; configure persistent or object storage on the host before relying on uploaded
files, since many hosting services discard local files when an instance is replaced.

## Short courses and M-Pesa

The course catalog includes a Grade 7 Mathematics sample course priced at KES 500. Run
`python manage.py migrate` to create the course and its outline. Staff can manage courses
and enrollments in Django admin. Set up a Safaricom Daraja app before accepting payments;
never commit its credentials. Configure these environment variables in the hosting service:

- `MPESA_ENVIRONMENT`: `sandbox` while testing, then `production` after Safaricom approval.
- `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`: credentials from the Daraja app.
- `MPESA_SHORTCODE` and `MPESA_PASSKEY`: the business shortcode and Lipa na M-Pesa passkey.
- `MPESA_CALLBACK_URL`: the public HTTPS URL ending in `/payments/mpesa/callback/`.
- `MPESA_TRANSACTION_TYPE`: optional; defaults to `CustomerPayBillOnline`.

The M-Pesa callback marks an enrollment paid only when the reported amount, phone number,
and receipt match the pending enrollment. Use Safaricom's sandbox and a publicly reachable
HTTPS callback URL before switching to production.

For local development on Windows, fill the Daraja sandbox values in the existing `.env`
file (or copy `.env.example` to `.env` if needed). `.env` is ignored by Git. In Daraja, create a sandbox app with the M-Pesa
Express product, copy the Consumer Key and Consumer Secret from the app's keys, and use its
Lipa na M-Pesa test shortcode and passkey. Set the callback URL to this app's publicly
reachable HTTPS address. Safaricom sends payment results asynchronously to that callback.
Never send the Consumer Secret or passkey in chat or commit them to the repository.

The project folder also contains a local Windows virtual environment and local database;
`.gitignore` excludes these so only application code and migrations are deployed.
