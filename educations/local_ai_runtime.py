"""Start the project-local Windows AI runtime for development, when selected."""
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.request


def ensure_local_ai(settings):
    if settings.WHITEBOARD_AI_PROVIDER != "ollama" or os.name != "nt":
        return
    if settings.WHITEBOARD_AI_LOCAL_URL.rstrip("/") != "http://127.0.0.1:11434":
        return  # A separately managed local service is the administrator's responsibility.
    try:
        with urllib.request.urlopen("http://127.0.0.1:11434/api/version", timeout=2):
            return
    except (urllib.error.URLError, TimeoutError):
        pass
    root = Path(settings.BASE_DIR)
    runtime = root / "tools/ollama/ollama.exe"
    if not runtime.is_file():
        return
    log_dir = root / "tmp/local-ai"
    log_dir.mkdir(parents=True, exist_ok=True)
    environment = dict(os.environ, OLLAMA_HOST="127.0.0.1:11434", OLLAMA_MODELS=str(root / "models/ollama"),
                       OLLAMA_NO_CLOUD="1", OLLAMA_NUM_PARALLEL="1", OLLAMA_CONTEXT_LENGTH="2048", OLLAMA_MAX_LOADED_MODELS="1")
    with (log_dir / "service.out.log").open("ab") as stdout, (log_dir / "service.err.log").open("ab") as stderr:
        subprocess.Popen([str(runtime), "serve"], cwd=root, env=environment, stdout=stdout, stderr=stderr,
                         creationflags=subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS)

