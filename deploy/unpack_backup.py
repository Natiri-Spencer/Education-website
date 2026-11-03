"""Verify a private transfer bundle before extracting into a new private folder."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("bundle", type=Path)
parser.add_argument("destination", type=Path)
args = parser.parse_args()
destination = args.destination.resolve()
if destination.exists():
    parser.error("Destination already exists; choose a new private directory")
with zipfile.ZipFile(args.bundle) as archive:
    names = archive.namelist()
    if len(names) != len(set(names)):
        parser.error("Bundle has duplicate entries")
    manifest = json.loads(archive.read("manifest.json"))
    if manifest.get("format") not in {1, 2}:
        parser.error("Unsupported bundle format")
    hashes = manifest["files"]
    if set(names) != set(hashes) | {"manifest.json"} or "data.json" not in hashes:
        parser.error("Bundle entries do not match the manifest")
    for name, expected in hashes.items():
        path = PurePosixPath(name)
        if (path.is_absolute() or ".." in path.parts or "\\" in name or ":" in name
                or (name != "data.json" and not name.startswith(("media/", "private-work/")))):
            parser.error("Unsafe bundle filename")
        digest = hashlib.sha256()
        with archive.open(name) as source:
            while chunk := source.read(1024 * 1024):
                digest.update(chunk)
        if digest.hexdigest() != expected:
            parser.error("Bundle failed integrity verification")
    destination.mkdir(parents=True, mode=0o700)
    for name in names:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with archive.open(name) as source, target.open("xb") as output:
            target.chmod(0o600)
            shutil.copyfileobj(source, output)
print(f"Verified and extracted {manifest['records']} database records and {len(hashes) - 1} uploads.")
