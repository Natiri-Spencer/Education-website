# Deploy CBE STEM ACADEMY

This is a portable, single-server Docker Compose deployment, prepared on 3 November 2026. It has not been published. Use a Linux server with Docker Engine and Compose v2, a domain pointing to its public IP, and inbound ports 80/443. Start with 2 CPU cores, 4 GB RAM and enough disk for the image, database, videos, uploads and backups; measure usage before increasing traffic.

## What runs

- **Caddy:** obtains/renews HTTPS certificates and streams uploaded files, with byte-range support for video seeking. Only this service exposes public ports.
- **Django/Gunicorn:** runs as an unprivileged user, with production settings, baked static assets and the five curated Grade 7 videos/audio/captions.
- **PostgreSQL 16:** persists accounts, classes, resources and enrollments in a named volume.
- **Redis:** shares recognition caches and authentication and request limits across workers. It is disposable; sessions remain in PostgreSQL. Redis and PostgreSQL are not publicly exposed.

Named volumes preserve the database, uploads and certificates when containers are replaced. They are not backups. Do not use `docker compose down -v` on a live installation.

## 1. Prepare configuration

Copy the project checkout to the server, including the current uncommitted website changes, or commit and push those changes before cloning. Work in the directory containing `manage.py`, `Dockerfile` and `compose.yaml`.

```sh
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `SITE_DOMAIN`, `ACME_EMAIL`, `DJANGO_ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`. Use one bare domain for `SITE_DOMAIN`; use the same domain without a scheme for allowed hosts and with `https://` for CSRF. Generate **two different** values for `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD`:

```sh
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Hex passwords avoid reserved characters in the PostgreSQL connection URL. Never reuse the development secret. Keep `.env.production` private; both Git and the Docker build exclude it. Do not put secrets in build arguments. Ask AI has been removed. Supply a verified transactional sender and owner support/privacy email before enabling public registration; see [LAUNCH_READINESS.md](LAUNCH_READINESS.md).

Every Compose command below uses `--env-file .env.production`; this supplies both Compose interpolation and container settings. Avoid sharing the output of `docker compose config`, which resolves secrets.

```sh
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production build
```

## 2. Transfer existing content before opening the site

Cloning alone does not copy local accounts, uploaded lessons, PDF resources or images. A private snapshot was prepared at `deployment-backups/classroom-transfer-2026-11-03.zip` in the local project. It contains 170 database records and 25 uploads as of preparation. Keep it off GitHub and out of the public media directory. It contains password hashes and other account information.

For an updated snapshot, pause local editing/uploads and run this using the project's Python environment:

```sh
python manage.py export_deployment deployment-backups/classroom-transfer-NEW-DATE.zip
```

Transfer the ZIP privately to the server. The following command verifies every SHA-256 value before extracting to a new private folder; it refuses unsafe filenames or an existing destination:

```sh
python3 deploy/unpack_backup.py deployment-backups/classroom-transfer-2026-11-03.zip deployment-backups/import
# Match the non-root application user's UID before read-only container mounts.
sudo chown -R 10001:10001 deployment-backups/import
```

The output contains `data.json`, `manifest.json` and `media/`. Existing sessions are intentionally excluded; users sign in again. Browser-only whiteboards, attachments and lab notebooks are **not** in this server snapshot: learners must export those separately and retain the original browser data.

For a **new, unused deployment database only**, create tables, remove the migration's sample content, and import the snapshot. The `flush` command erases all data in the target database: never run this section on a site that already has users or live work. Start only the database/cache first so no visitors can write during import.

```sh
docker compose --env-file .env.production up -d db cache
docker compose --env-file .env.production run --rm web python manage.py migrate --noinput
docker compose --env-file .env.production run --rm web python manage.py flush --noinput
docker compose --env-file .env.production run --rm -v "$PWD/deployment-backups/import:/import:ro" web python manage.py loaddata /import/data.json
docker compose --env-file .env.production run --rm -v "$PWD/deployment-backups/import/media:/import-media:ro" web python -c "import shutil; shutil.copytree('/import-media', '/app/media', dirs_exist_ok=True)"
```

The copy runs as the application user so later uploads have the correct ownership. Keep the private backup outside the image. If starting without the snapshot, skip import and create a staff account after startup:

```sh
docker compose --env-file .env.production run --rm web python manage.py createsuperuser
```

## 3. Launch and verify

```sh
docker compose --env-file .env.production up -d --wait
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 web proxy
curl --fail https://YOUR_DOMAIN/health/
```

`/health/` returns `{"status":"ok"}` only when the database and cache respond, and otherwise gives a generic 503 without connection details. Its internal HTTP exemption allows container health checks; Caddy redirects public HTTP to HTTPS. Startup applies migrations before serving requests. This setup is for a single web instance; separate migrations into a one-time release step before scaling to multiple instances.

Check the homepage, About Us, sign-in, staff uploads, Grade 7–9 labs, circuit checking and notebook saving. Play a lesson with audio, seek halfway through it, load captions and test a PDF/image resource. Verify account approval, recovery, private saving and class submissions using the steps in LAUNCH_READINESS.md. The five curated lesson files are packaged in the image; additional uploads come from the transferred media volume.

Static files are collected into the image and served by WhiteNoise with hashed names. Uploads are served separately by Caddy; active HTML/SVG/script uploads are downloaded and sandboxed. Uploaded resources are public URLs, matching the existing website. Do not use this storage for private student documents. Readiness checks do not test transactional email delivery or every lesson’s scientific accuracy.

## 4. Back up and update

Keep a dated database backup, uploaded-file snapshot, `.env.production` and the code/image revision together in a private location outside the server. Pause editing/uploads while taking coordinated backups. Retain several generations and test restoration on a separate server.

```sh
mkdir -p deployment-backups
chmod 700 deployment-backups
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose --env-file .env.production exec -T db pg_dump -U academy -d academy -Fc > "deployment-backups/database-$backup_stamp.dump"
```

Export database records and uploads together through a private backup directory mount. Never write backup archives into the public media directory:

```sh
# This one-off administrator task reads all private uploads; the web service stays non-root.
docker compose --env-file .env.production run --rm --user 0:0 -v "$PWD/deployment-backups:/backups" web python manage.py export_deployment "/backups/classroom-$backup_stamp.zip"
sudo chown "$(id -u):$(id -g)" "deployment-backups/classroom-$backup_stamp.zip"
```

For routine updates, back up first, pull the reviewed code, build, then replace containers. `APP_VERSION` can tag the built image for tracking. Keep the previous image and backup. Reverting an image alone does not reverse database migrations; restore a tested compatible backup when necessary.

```sh
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d --wait
```

## Platform limits and checks

The Docker image includes the bundled CPU handwriting recognizer. Windows Ink and the Windows formula worker cannot run in Linux containers; the optional formula runtime/model needs a separate Linux installation. An Ollama service on the developer's Windows computer is not available to the deployed site. Ask AI is removed from the deployed application. Existing AI-labelled notes remain learner-owned content.

Production refuses debug mode via Compose, wildcard hosts and SQLite. HTTPS redirects, secure cookies, a trusted isolated proxy and one-hour HSTS are configured. `check --deploy` may warn about intentionally disabled HSTS subdomain/preload policies: enable those only after confirming HTTPS works for every affected subdomain and meeting preload requirements. Do not enable wildcard forwarded-header trust when publishing Gunicorn directly.

The local preparation verified 43 Django tests, 39 JavaScript checks, static collection, the Compose and Caddy configurations and snapshot integrity. All 170 database records were restored into an isolated fresh SQLite database; PostgreSQL/container verification remains in the Linux workflow. Docker is not installed on the preparation computer, so the Linux image/Compose stack must still be built and exercised. `.github/workflows/deployment.yml` runs Python/JavaScript checks, builds the image, validates Caddy, starts the stack and checks HTTPS, uploaded video ranges and a lesson route on GitHub Actions; that workflow has not yet run.

Implementation references: [Django deployment checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/), [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/), [Caddy proxy headers](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [Caddy file serving](https://caddyserver.com/docs/caddyfile/directives/file_server).

## Account and private-work launch features

The new `private_work` and `runtime` volumes must be retained and backed up with the database and media. Private work is not mounted into Caddy. The version-2 transfer bundle includes `private-work/` when private files exist; after importing `data.json`, copy this directory into `/app/private-work` using the application UID (10001), just as for public media. Version-1 bundles remain readable.

Production registration is closed by default (`PUBLIC_REGISTRATION_ENABLED=False`). Build and test the interface locally first. Before opening registration, complete the owner/provider settings and recorded reviews described in [LAUNCH_READINESS.md](LAUNCH_READINESS.md). Existing public resources remain browsable.

Run the complete Python suite with `python manage.py test accounts learning spencer_project educations` and the JavaScript suite with `node --test educations/js_tests/*.test.cjs`. The GitHub container job additionally runs account/private-work tests against PostgreSQL. Local Windows Python 3.13 is required for the installed PyTorch binary; do not mix it with a different runtime.
