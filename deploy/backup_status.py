"""Always remove the write pause; publish no credentials or learner data."""
import json
from pathlib import Path
import sys
import os
from datetime import datetime, timezone

root = Path(os.environ.get('BACKUP_RUNTIME_ROOT', '/app/runtime'))
root.mkdir(exist_ok=True)
path = root/'backup-status.json'
try:
    old = json.loads(path.read_text())
except (OSError, ValueError):
    old = {}
success = len(sys.argv)>1 and sys.argv[1]=='1'
old.update(last_attempt=datetime.now(timezone.utc).isoformat(), failed=not success)
if success:
    old['last_success'] = old['last_attempt']
temporary = path.with_suffix('.tmp')
temporary.write_text(json.dumps(old))
temporary.chmod(0o644)
temporary.replace(path)
(root/'read-only').unlink(missing_ok=True)
