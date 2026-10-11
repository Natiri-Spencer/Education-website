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
