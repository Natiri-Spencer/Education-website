#!/usr/bin/env bash
set -euo pipefail
umask 077
cd /opt/cbe-stem-academy
source /etc/cbe-backups.env
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"
exec 9>/var/lock/cbe-backup.lock
flock -n 9 || exit 0
mkdir -p /var/lib/cbe-backups
staging=$(mktemp -d /var/lib/cbe-backups/staging-XXXXXX)
compose=(docker compose --env-file .env.production)
success=0
cleanup() {
  "${compose[@]}" run --rm --no-deps --user 0:0 web python deploy/backup_status.py "$success" || true
  case "$staging" in /var/lib/cbe-backups/staging-*) rm -rf -- "$staging";; esac
}
trap cleanup EXIT
"${compose[@]}" exec -T web python -c "from pathlib import Path; Path('/app/runtime/read-only').touch()"
"${compose[@]}" exec -T db pg_dump -U academy -d academy --format=custom > "$staging/database.dump"
"${compose[@]}" run --rm --no-deps --user 0:0 -v "$staging:/backups" web python -c "import shutil; shutil.copytree('/app/media','/backups/media'); shutil.copytree('/app/private-work','/backups/private-work')"
git -c "safe.directory=$(pwd -P)" rev-parse HEAD > "$staging/code-revision.txt"
"${compose[@]}" run --rm --no-deps --user 0:0 -v "$staging:/backups" web python deploy/snapshot_manifest.py /backups
restic backup "$staging" --tag cbe-daily --host cbe-production
# Keep the most recent snapshot from each of the last 30 calendar days.
restic forget --tag cbe-daily --keep-daily 30 --group-by host,tags --prune
"${compose[@]}" exec -T web python manage.py learning_retention
success=1
