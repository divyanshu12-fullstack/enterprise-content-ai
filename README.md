# Enterprise Content AI

Enterprise Content AI is a full-stack, multi-agent content generation platform for enterprise teams. It creates social-ready content packages (LinkedIn post, Twitter/X post, image prompt), enforces policy checks, and tracks generation history with approval and publishing actions.

The project is organized as a backend API (FastAPI + SQLModel + CrewAI) and a frontend app (Next.js + TypeScript + Tailwind + Playwright).

## Table of Contents

- [What You Get](#what-you-get)
- [System Architecture](#system-architecture)
- [Repository Layout](#repository-layout)
- [Tech Stack](#tech-stack)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development](#local-development)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
- [Backend API Reference](#backend-api-reference)
- [Frontend Routes and User Flows](#frontend-routes-and-user-flows)
- [Database Model](#database-model)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Known Caveats](#known-caveats)
- [Contributing](#contributing)

## What You Get

- Multi-agent content pipeline:
  - Research agent gathers market context.
  - Writer agent drafts LinkedIn and Twitter/X content.
  - Governance agent applies compliance checks.
  - Visual agent generates image prompt guidance.
- Deterministic compliance checks:
  - Banned term scanning.
  - Twitter length enforcement (<= 280 chars).
  - Strict approved/rejected decision and notes.
- Auth and user settings:
  - Signup/login with JWT.
  - User-specific model and behavior settings.
  - Encrypted per-user Gemini API key support.
- Content operations:
  - Save each generation to history.
  - View metrics (pass rate, rejection rate, median duration).
  - Approve, reject, publish, delete, and clear records.
- Policy file ingestion:
  - Upload TXT/PDF/DOCX policy docs.
  - Parse and pass policy text into generation pipeline.
- Streaming generation:
  - Server-Sent Events (SSE) for live progress updates.

## System Architecture

```text
+-----------------------+        HTTP/SSE         +-----------------------------+
| Next.js Frontend      | <---------------------> | FastAPI Backend             |
| app/, components/     |                         | api/, crew/, db/            |
+-----------------------+                         +-----------------------------+
                                                          |
                                                          | SQLAlchemy/SQLModel
                                                          v
                                                 +-----------------------------+
                                                 | PostgreSQL                  |
                                                 | users, user_settings,       |
                                                 | generations                 |
                                                 +-----------------------------+

Pipeline (backend /api/generate):
Input -> CrewAI Research -> Writer -> Governance -> Visual -> Deterministic Compliance -> Final JSON
```

### Runtime Flow

1. User logs in or signs up.
2. User submits brief fields (topic, audience, content type, tone, context, optional policy text).
3. Frontend calls `/api/generate/stream` (fallback to `/api/generate` if needed).
4. Backend runs CrewAI tasks and emits progress events.
5. Frontend persists result via `/api/generations`.
6. User reviews in approval screen and can publish/reject.
7. User audits results in history and metrics dashboards.

## Repository Layout

```text
enterprise-content-ai/
  backend/
    api/                # Auth, generation, settings, policies, history APIs
    crew/               # Agents, tasks, pipeline orchestration, compliance
    db/                 # Config, models, session, security
    alembic/            # DB migration scaffolding
    tests/              # Backend pytest suite
    main.py             # FastAPI app entrypoint
  frontend/
    app/                # Next.js app router pages
    components/         # UI components
    hooks/              # Reusable hooks
    lib/                # Frontend lib exports
    src/lib/            # API client + zod schemas
    tests/              # Playwright smoke tests
  docker-compose.yml    # Full stack compose
  changes.md            # Internal audit/change notes
```

## Tech Stack

### Backend

- Python 3.12
- FastAPI
- SQLModel + SQLAlchemy
- PostgreSQL (psycopg)
- Alembic
- CrewAI
- Gemini via CrewAI LLM adapter
- JWT auth (python-jose)
- Fernet encryption (cryptography)
- Passlib password hashing
- PyPDF + python-docx for policy parsing

### Frontend

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Radix UI + shadcn-style components
- Axios + fetch (SSE)
- Zod schemas
- Playwright E2E smoke tests

### Infrastructure

- Docker + Docker Compose
- Gunicorn + Uvicorn workers (backend container)

## Quick Start (Docker)

### 1. Prerequisites

- Docker Desktop
- A valid Gemini API key

### 2. Set API key

From project root:

```bash
# PowerShell
$env:GEMINI_API_KEY="your_key_here"

# Bash
export GEMINI_API_KEY="your_key_here"
```

### 3. Run the stack

```bash
docker-compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend health: http://localhost:8000/health
- Postgres: localhost:5432

### 4. Stop

```bash
docker-compose down
```

## Local Development

### Prerequisites

- Python 3.12+
- Node 20+
- pnpm
- PostgreSQL 16+

### Backend setup

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Bash
source .venv/bin/activate

pip install -r requirements.txt
```

Create environment variables (see full matrix below).

Recommended run command:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:

- `main.py` validates required env vars on startup and auto-initializes DB tables via SQLModel metadata.
- You can still use Alembic, but see caveat in [Known Caveats](#known-caveats).

### Frontend setup

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at http://localhost:3000.

## Configuration and Environment Variables

### Backend required variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `DATABASE_URL` | Yes | None | SQLAlchemy URL. Example: `postgresql+psycopg://user:pass@localhost:5432/contentai_db` |
| `JWT_SECRET` | Yes | None | JWT signing secret |
| `ENCRYPTION_KEY` | Yes | None | Fernet key (base64-url-safe 32-byte key) |

### Backend optional variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `GEMINI_API_KEY` | No* | None | Global API key used when user key is absent |
| `GEMINI_MODEL` | No | `gemini-3.1-flash` | Default model |
| `GEMINI_TEMPERATURE` | No | `0.2` | LLM temperature |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | CORS allowlist |
| `DB_AUTO_CREATE` | No | `true` | Kept for compatibility; app initializes tables on startup |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT expiration |

\* Generation can also use a per-user encrypted API key from settings.

Generate Fernet key once:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Frontend variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:8000` | Backend base URL for browser requests |
| `PLAYWRIGHT_TEST_BASE_URL` | No | `http://localhost:3000` | Base URL used by Playwright config |

## Backend API Reference

All backend routes are mounted under these groups:

- `/api/auth`
- `/api`
- `/api/settings`
- `/api/generations`
- `/api/policies`

Health endpoint:

- `GET /health`

## Authentication

### POST /api/auth/signup

Create a user account.

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

### POST /api/auth/login

Authenticate existing user.

### GET /api/auth/me

Get active user profile (requires bearer token).

## Content Generation

### POST /api/generate

Synchronous generation.

Request fields:

- `topic` (required, 3..300)
- `audience` (required, 2..120)
- `content_type` (optional)
- `tone` (optional)
- `additional_context` (optional)
- `policy_text` (optional)

Response:

```json
{
  "linkedin_post": "...",
  "twitter_post": "...",
  "image_prompt": "...",
  "compliance_status": "APPROVED",
  "compliance_notes": "Passed deterministic compliance checks."
}
```

Authentication:

- Optional. If provided and valid, user settings override runtime defaults.

### POST /api/generate/stream

Streaming generation with SSE events.

Event types:

- `progress` -> stage updates
- `result` -> final payload
- `error` -> validation/pipeline error object
- `done` -> stream complete

Sample event stream block:

```text
event: progress
data: {"stage":"research","message":"Gathering market context"}

event: result
data: {"linkedin_post":"...","twitter_post":"...","image_prompt":"...","compliance_status":"APPROVED","compliance_notes":"..."}

event: done
data: {}
```

## Settings

Requires authentication.

- `GET /api/settings`
- `PUT /api/settings`
- `PUT /api/settings/api-key`
- `POST /api/settings/test-api-key`

Model values accepted by API:

- `gemini-3.1-flash`
- `gemini-3.1-pro`
- `gemini-2.5-flash`

## Generations and Metrics

Requires authentication.

- `POST /api/generations` (create record)
- `GET /api/generations` (list with `status`, `search`, `limit`, `offset`)
- `GET /api/generations/metrics`
- `GET /api/generations/{generation_id}`
- `DELETE /api/generations/{generation_id}`
- `DELETE /api/generations` (clear all)
- `POST /api/generations/{generation_id}/approve`
- `POST /api/generations/{generation_id}/reject`
- `POST /api/generations/{generation_id}/publish`

## Policy Upload

Requires authentication.

- `POST /api/policies/upload` with `multipart/form-data`
- Field name: `file`
- Supported extensions: `.txt`, `.pdf`, `.docx`
- Max upload size: 5 MB
- Returned policy text is truncated to 15000 characters if longer

## Frontend Routes and User Flows

Primary routes in `frontend/app`:

- `/` -> marketing landing page
- `/login` -> login/signup
- `/app` -> generation form and pipeline progress
- `/app/approval?id=<id>` -> review and publish/reject
- `/app/history` -> search and manage previous generations
- `/app/settings` -> model, policy, key, behavior settings

### Main flow

1. User signs in on `/login`.
2. User creates a brief on `/app`.
3. Frontend calls stream generation, then saves result record.
4. User reviews on `/app/approval` and can publish or reject.
5. User tracks outcomes in `/app/history` and `/app/settings`.

## Database Model

Current SQLModel entities:

- `users`
- `user_settings`
- `generations`

### users

- `id` (UUID PK)
- `email` (unique)
- `password_hash`
- `is_active`
- `created_at`
- `updated_at`

### user_settings

- `id` (UUID PK)
- `user_id` (1:1 with users)
- `selected_model`
- `auto_retry`
- `max_retries`
- `include_source_urls`
- `auto_generate_image`
- `strict_compliance`
- `custom_blocked_words` (JSON array)
- `encrypted_api_key` (text)
- `created_at`
- `updated_at`

### generations

- `id` (UUID PK)
- `user_id`
- Input fields: `topic`, `audience`, `content_type`, `tone`, `additional_context`
- Output fields: `linkedin_post`, `twitter_post`, `image_prompt`
- Review fields: `compliance_status`, `compliance_notes`, `status`
- Runtime fields: `error_message`, `duration_ms`
- Timestamps: `created_at`, `completed_at`

## Testing

### Backend tests (pytest)

From `backend`:

```bash
pytest
```

Helpful variants:

```bash
pytest -v
pytest tests/test_api_auth.py
pytest tests/test_api_generate.py
pytest tests/test_deterministic_compliance.py
```

What is covered:

- auth endpoints
- generation endpoint behavior
- settings endpoints
- generation history endpoints
- request/schema validation
- deterministic compliance logic
- policy ingestion parser

### Frontend tests (Playwright)

From `frontend`:

```bash
pnpm test:smoke
```

Playwright config behavior:

- Starts local dev server if needed.
- Uses base URL from `PLAYWRIGHT_TEST_BASE_URL` or defaults to `http://localhost:3000`.
- Smoke test uses request route mocking for deterministic end-to-end flow.

## Deployment Notes

### Docker Compose services

- `postgres` (postgres:16-alpine)
- `backend` (python:3.12-slim, gunicorn+uvicorn)
- `frontend` (node:20-alpine, Next production build)

### Production hardening checklist

- Set strong `JWT_SECRET`.
- Generate secure `ENCRYPTION_KEY`.
- Set restrictive `ALLOWED_ORIGINS`.
- Use managed Postgres with TLS.
- Add rate limiting/reverse proxy.
- Configure secrets via vault or platform secret manager.
- Add centralized logging and monitoring.

## Troubleshooting

### Backend fails at startup with env errors

Ensure all required env vars are set:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

### "GEMINI_API_KEY is not set"

Generation requires either:

- global `GEMINI_API_KEY`, or
- authenticated user with encrypted API key stored in settings.

### CORS issues in browser

Set `ALLOWED_ORIGINS` to include your frontend origin exactly.

### Policy upload fails

Check file type and size:

- only txt/pdf/docx
- max 5 MB

### Frontend cannot reach backend

Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL and restart frontend dev server.

### Playwright smoke fails due API mismatch

The smoke spec stubs specific API paths; if you changed routes, update `frontend/tests/smoke-golden-flow.spec.ts` accordingly.

## Known Caveats

1. Legacy frontend code remains under `frontend/src`:
   - Active app uses `frontend/app` routes.
   - Keep this in mind when refactoring import paths and tsconfig includes/excludes.

## Contributing

Suggested workflow:

1. Create a feature branch.
2. Keep backend and frontend changes scoped and tested.
3. Run backend pytest and frontend smoke tests before opening PR.
4. Document API contract changes in this README.
5. If DB schema changes, update both SQLModel and Alembic migration scripts coherently.

Recommended quality checks:

```bash
# frontend
pnpm lint
pnpm test:smoke

# backend
pytest -v
```

## Final Notes

This README reflects the current integrated state of the repository and backend/frontend behavior visible in source code. If you add providers, expand compliance policy logic, or change API contracts, update this document in the same PR to keep onboarding and operations reliable.
