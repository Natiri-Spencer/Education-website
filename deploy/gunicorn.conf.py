import os

bind = "0.0.0.0:8000"
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
worker_class = "gthread"
threads = int(os.environ.get("GUNICORN_THREADS", "4"))
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "180"))
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 100
accesslog = "-"
access_log_format = '%(m)s %(s)s %(L)s'
errorlog = "-"
capture_output = True
worker_tmp_dir = "/dev/shm"
# Headers are trusted only from the isolated Compose proxy network.
forwarded_allow_ips = "*"
