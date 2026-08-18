# ──────────────────────────────────────────────────────────────
# Stage 1: Builder — install Python dependencies in a venv
# Multi-stage keeps the final image small (~400MB vs ~1.2GB)
# ──────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# System deps needed to compile psycopg (Postgres driver) and cryptography
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ──────────────────────────────────────────────────────────────
# Stage 2: Runtime — lean image with only what's needed to run
# ──────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Only the runtime library for PostgreSQL connections
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built venv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

EXPOSE 8000

# gunicorn manages worker processes (restarts crashes, handles signals)
# UvicornWorker gives async support needed for SSE streaming
# --timeout 120: CrewAI pipelines take 60-90s; default 30s would kill them
# --workers 2: 2 processes for handling requests
# --keep-alive 75: keeps SSE connections open past Azure's default proxy timeout
CMD ["gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--keep-alive", "75"]
