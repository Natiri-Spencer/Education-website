"""Fetch the attributed, openly licensed UJI stroke corpus used by train_ink.py."""
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile
from io import BytesIO
import hashlib


def main():
    directory = Path(__file__).resolve().parents[1] / "training_data/uji"
    directory.mkdir(parents=True, exist_ok=True)
    url = "https://archive.ics.uci.edu/static/public/177/uji+pen+characters+version+2.zip"
    with urlopen(url, timeout=60) as response:
        archive = response.read(10_000_000)
    with ZipFile(BytesIO(archive)) as source:
        for name in ("uji2.names", "ujipenchars2.txt"):
            data = source.read(name)
            if name == "ujipenchars2.txt" and hashlib.sha256(data).hexdigest() != "cc56f72f8477e763dd06a44746ba05a679e9232468aac93b3a7aad46a0300d61":
                raise ValueError("The UJI corpus changed; inspect it before training")
            (directory/name).write_bytes(data)
    print("Downloaded UJI Pen Characters v2. See training_data/uji/ATTRIBUTION.md for credit and CC BY 4.0 terms.")


if __name__ == "__main__":
    main()
