"""Single-instance startup; migrations finish before requests are accepted."""
import os
import subprocess
import sys

subprocess.run([sys.executable, "manage.py", "check", "--deploy"], check=True)
subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True)
if os.environ.get("PUBLIC_REGISTRATION_ENABLED", "false").lower() in {"1", "true", "yes"}:
    subprocess.run([sys.executable, "manage.py", "check_learning_launch"], check=True)
os.execvp("gunicorn", ["gunicorn", "--config", "deploy/gunicorn.conf.py", "spencer_project.wsgi:application"])
