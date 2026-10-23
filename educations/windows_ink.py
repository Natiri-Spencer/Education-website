"""Local bridge to the English handwriting recognizer installed with Windows."""
import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path
from threading import Lock

from django.conf import settings


class WindowsInkUnavailable(RuntimeError):
    pass


_compile_lock = Lock()
_run_lock = Lock()
_source = Path(__file__).with_name("HandwritingRecognizer.cs")
_build = Path(settings.BASE_DIR) / "tmp" / "whiteboard_ink"
_executable = _build / "HandwritingRecognizer.exe"
_csc_candidates = (
    Path(os.environ.get("WINDIR", r"C:\Windows")) / "Microsoft.NET" / "Framework64" / "v4.0.30319" / "csc.exe",
    Path(os.environ.get("WINDIR", r"C:\Windows")) / "Microsoft.NET" / "Framework" / "v4.0.30319" / "csc.exe",
)
_ink_candidates = (
    Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Common Files" / "microsoft shared" / "ink" / "Microsoft.Ink.dll",
    Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Common Files" / "microsoft shared" / "ink" / "Microsoft.Ink.dll",
)


def _first_existing(candidates):
    return next((path for path in candidates if path.is_file()), None)


def _ensure_bridge():
    if os.name != "nt":
        raise WindowsInkUnavailable("Windows Ink is available only on Windows.")
    compiler, ink = _first_existing(_csc_candidates), _first_existing(_ink_candidates)
    if not compiler or not ink or not _source.is_file():
        raise WindowsInkUnavailable("The Windows handwriting components are not installed.")
    with _compile_lock:
        if _executable.is_file() and _executable.stat().st_mtime >= _source.stat().st_mtime:
            return _executable
        _build.mkdir(parents=True, exist_ok=True)
        command = [str(compiler), "/nologo", "/optimize+", "/target:exe", "/platform:anycpu",
                   "/out:"+str(_executable), "/reference:System.Drawing.dll",
                   "/reference:System.Web.Extensions.dll", "/reference:"+str(ink), str(_source)]
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=20, creationflags=flags)
        except (OSError, subprocess.SubprocessError) as error:
            raise WindowsInkUnavailable("The Windows handwriting bridge could not be compiled.") from error
        if result.returncode or not _executable.is_file():
            raise WindowsInkUnavailable((result.stderr or result.stdout or "Compilation failed.").strip())
    return _executable


def _run(arguments=(), payload=None, timeout=8):
    command = [str(_ensure_bridge()), *arguments]
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        with _run_lock:
            result = subprocess.run(command, input=json.dumps(payload, separators=(",", ":")) if payload is not None else None,
                                    capture_output=True, text=True, encoding="utf-8", timeout=timeout,
                                    creationflags=flags)
    except (OSError, subprocess.SubprocessError) as error:
        raise WindowsInkUnavailable("The Windows handwriting engine did not respond.") from error
    if result.returncode:
        raise WindowsInkUnavailable((result.stderr or "Windows handwriting recognition failed.").strip())
    try:
        return json.loads(result.stdout)
    except (TypeError, json.JSONDecodeError) as error:
        raise WindowsInkUnavailable("The Windows handwriting engine returned invalid data.") from error


@lru_cache(maxsize=1)
def recognition_status():
    result = _run(("--status",), timeout=5)
    if not result.get("available") or not result.get("engine"):
        raise WindowsInkUnavailable("No Windows handwriting recognizer is available.")
    return result


def recognize_groups(groups):
    result = _run(payload={"groups": groups})
    returned = result.get("groups")
    if not isinstance(returned, list):
        raise WindowsInkUnavailable("The Windows handwriting response is incomplete.")
    expected = {group["id"] for group in groups}
    if {group.get("id") for group in returned} != expected:
        raise WindowsInkUnavailable("The Windows handwriting response does not match the request.")
    return result
