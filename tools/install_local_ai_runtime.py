"""Install CPU-only files from the official Ollama Windows release archive."""
import io
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://github.com/ollama/ollama/releases/download/v0.40.12/ollama-windows-amd64.zip"
SIZE = 1601458136
DEST = ROOT / "tools" / "ollama"

def fetch(start, end):
    request = urllib.request.Request(URL, headers={"Range": f"bytes={start}-{end}"})
    with urllib.request.urlopen(request, timeout=180) as response:
        if response.status != 206:
            raise RuntimeError("The server did not honor the requested archive byte range.")
        data = response.read()
    if len(data) != end - start + 1:
        raise RuntimeError("Incomplete archive range received.")
    return data

class RemoteArchive(io.RawIOBase):
    def __init__(self):
        self.pos = 0
        self.cached = [(SIZE-65557, fetch(SIZE-65557, SIZE-1))]
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else SIZE + offset
        return self.pos
    def read(self, count=-1):
        count = SIZE-self.pos if count < 0 else min(count, SIZE-self.pos)
        if not count: return b""
        start = self.pos
        self.pos += count
        for offset, data in self.cached:
            if offset <= start and start+count <= offset+len(data):
                return data[start-offset:start-offset+count]
        return fetch(start, start+count-1)

if __name__ == "__main__":
    source = RemoteArchive()
    with zipfile.ZipFile(source) as archive:
        entries = sorted(archive.infolist(), key=lambda info: info.header_offset)
        for index, entry in enumerate(entries):
            name = entry.filename
            if entry.is_dir() or any(part in name.lower() for part in ("cuda", "vulkan", "rocm", "mlx")):
                continue
            if name != "ollama.exe" and not name.startswith("lib/ollama/"):
                continue
            destination = (DEST / name).resolve()
            if not destination.is_relative_to(DEST.resolve()):
                raise RuntimeError("Unexpected archive path.")
            end = entries[index+1].header_offset-1 if index+1 < len(entries) else archive.start_dir-1
            source.cached = [source.cached[0], (entry.header_offset, fetch(entry.header_offset, end))]
            content = archive.read(entry)  # zipfile verifies this entry's CRC.
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            print(f"Installed {name} ({len(content):,} bytes)", flush=True)
