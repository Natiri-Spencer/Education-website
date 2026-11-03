#!/usr/bin/env bash
set -euo pipefail
umask 077
cd /opt/cbe-stem-academy
source /etc/cbe-backups.env
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"
exec 9>/var/lock/cbe-backup.lock
flock -w 900 9 || exit 1
mkdir -p /var/lib/cbe-backups
target=$(mktemp -d /var/lib/cbe-backups/restore-XXXXXX)
# Project name isolates volumes and containers; the proxy is never started.
drill=(docker compose --env-file .env.production -p cbe-restore-drill -f compose.yaml -f deploy/compose.restore.yaml)
drill_success=0
cleanup(){
 docker compose --env-file .env.production exec -T web python -c "from pathlib import Path; p=Path('/app/runtime/restore-failed'); p.unlink(missing_ok=True) if '$drill_success'=='1' else p.touch()" || true
 "${drill[@]}" down -v; case "$target" in /var/lib/cbe-backups/restore-*) rm -rf -- "$target";; esac; }
trap cleanup EXIT
restic check
restic restore latest --tag cbe-daily --target "$target"
dump=$(find "$target" -name database.dump -type f -print -quit)
test -n "$dump"
snapshot=$(dirname "$dump")
"${drill[@]}" up -d --wait db cache
"${drill[@]}" exec -T db pg_restore -U academy -d academy --no-owner --exit-on-error < "$dump"
"${drill[@]}" run --rm --no-deps --user 0:0 -v "$snapshot:/restore:ro" web python -c "import shutil; shutil.copytree('/restore/media','/app/media',dirs_exist_ok=True); shutil.copytree('/restore/private-work','/app/private-work',dirs_exist_ok=True); import subprocess; subprocess.run(['chown','-R','10001:10001','/app/private-work','/app/media'],check=True)"
"${drill[@]}" up -d --wait web
"${drill[@]}" exec -T web python manage.py verify_restored_work
"${drill[@]}" run --rm --no-deps --user 0:0 -v "$snapshot:/restore:ro" web python deploy/snapshot_manifest.py /restore --verify
"${drill[@]}" exec -T web python deploy/healthcheck.py
docker compose --env-file .env.production exec -T web python -c "from pathlib import Path; from datetime import datetime,timezone; Path('/app/runtime/restore-success.txt').write_text(datetime.now(timezone.utc).isoformat())"

drill_success=1
