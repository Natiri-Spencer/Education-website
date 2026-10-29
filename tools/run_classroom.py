"""Launch the local classroom server using the current Python and project packages."""
import os
from pathlib import Path
import runpy
import sys

root = Path(__file__).resolve().parent.parent
os.chdir(root)
sys.path.insert(0, str(root))
sys.path.append(str(root / "Lib/site-packages"))
sys.argv = [str(root / "manage.py"), "runserver", "127.0.0.1:8000", "--noreload"]
runpy.run_path(str(root / "manage.py"), run_name="__main__")
