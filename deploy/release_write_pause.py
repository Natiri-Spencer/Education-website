from pathlib import Path
root = Path('/app/runtime')
if (root/'read-only').exists():
    import runpy
    runpy.run_path('deploy/backup_status.py', run_name='__main__')
