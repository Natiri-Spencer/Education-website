"""Verify the public deployment without changing learner data."""
import argparse
import json
import ssl
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser()
parser.add_argument("base_url", help="Public https:// address")
parser.add_argument("--insecure-localhost", action="store_true", help="CI only: allow Caddy's localhost certificate")
parser.add_argument("--test-upload", action="store_true", help="CI only: expect the pre-created ci-video.mp4 file")
args = parser.parse_args()
base = args.base_url.rstrip("/")
if not base.startswith("https://"):
    parser.error("Use the public HTTPS address")
if args.insecure_localhost and base != "https://localhost":
    parser.error("Certificate bypass is restricted to https://localhost")
context = ssl._create_unverified_context() if args.insecure_localhost else ssl.create_default_context()


def fetch(path, headers=None):
    return urlopen(Request(base + path, headers=headers or {}), context=context, timeout=30)


with fetch("/health/") as response:
    assert json.load(response) == {"status": "ok"}, "Readiness failed"
for path in ("/", "/about/", "/virtual-labs/", "/virtual-labs/grade/7/",
             "/educations/grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/"):
    with fetch(path) as response:
        assert response.status == 200, path
        assert response.headers.get("Strict-Transport-Security"), "HSTS missing"
        assert b"CBE STEM ACADEMY" in response.read(), path
with fetch("/educations/grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/media/video/",
           {"Range": "bytes=0-31"}) as response:
    assert response.status == 206 and len(response.read()) == 32, "Lesson seeking failed"
if args.test_upload:
    with fetch("/media/ci-video.mp4", {"Range": "bytes=2-5"}) as response:
        assert response.status == 206 and response.read() == b"2345", "Upload seeking failed"
        assert "sandbox" in response.headers.get("Content-Security-Policy", ""), "Upload policy missing"
print("Passed: HTTPS pages, readiness, lesson video seeking" + (", uploaded video seeking and policy." if args.test_upload else "."))
