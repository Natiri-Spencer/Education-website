FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_LOAD_DOTENV=false \
    DJANGO_MEDIA_ROOT=/app/media
WORKDIR /app

# CPU-only inference preserves the bundled recognizer without CUDA libraries.
COPY requirements.txt ./
RUN pip install 'torch>=2.6,<3' --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt \
    && pip check

COPY . .
RUN DJANGO_DEBUG=True python manage.py collectstatic --noinput \
    && groupadd --gid 10001 academy \
    && useradd --uid 10001 --gid academy --create-home academy \
    && mkdir -p /app/media /app/private-work /app/runtime /app/tmp \
    && chown -R academy:academy /app/media /app/private-work /app/runtime /app/tmp

USER academy
EXPOSE 8000
CMD ["python", "deploy/start.py"]
