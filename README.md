# Draftly

Draftly is a full-stack application for generating policy-aware marketing content with an approval workflow.

It combines:

- A FastAPI backend for auth, generation, settings, and generation lifecycle APIs.
- A Next.js frontend for drafting, reviewing, and publishing content.
- A multi-step generation pipeline with compliance checks and policy-file ingestion.
- Per-user runtime settings (model, retries, compliance behavior, blocked words).
- Policy upload and text extraction from TXT, PDF, and DOCX files.
- Generation history, filtering, metrics, and lifecycle actions (approve, reject, publish).

- Content generation for:

- LinkedIn post
- Twitter/X post
- Image prompt
- Optional streaming generation with server-sent events (SSE).

## Stack

### Backend

- Python 3.12+
- FastAPI
- SQLModel + SQLAlchemy
- PostgreSQL (production/local) and SQLite in tests
- Alembic (migrations support)
- CrewAI and Gemini integration

### Frontend

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Axios + Fetch (SSE stream consumption)
- Playwright smoke test coverage

## Repository Layout

```text
enterprise-content-ai/
  backend/
    api/
    crew/
    db/
    tests/
    alembic/
    main.py
    requirements.txt
  frontend/
    app/
      app/
      login/
    components/
    hooks/
    lib/
    tests/
    package.json
  README.md
```

## Local Setup

### 1) Prerequisites

- Python 3.12+
- Node.js 20+
- npm 10+
- PostgreSQL 15+ (for local dev unless you use a hosted instance)

### 2) Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/enterprise_content_ai
JWT_SECRET=replace-with-strong-secret
ENCRYPTION_KEY=replace-with-generated-fernet-key

# Optional runtime defaults
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DB_AUTO_CREATE=true
```

Generate `ENCRYPTION_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

- `GET http://localhost:8000/health`

### 3) Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

Run frontend:

```bash
npm run dev
```

App URL:

- `http://localhost:3000`

### 4) First Run Flow

1. Open `http://localhost:3000/login`.
2. Sign up a new user.
3. Go to the app workspace.
4. Optionally save your provider API key in Settings.
5. Run a generation request.
6. Approve/reject/publish from history or approval views.

## Configuration Reference

### Backend Environment Variables

| Variable                        | Required | Description                                   |
| ------------------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`                | Yes      | SQLAlchemy connection URL.                    |
| `JWT_SECRET`                  | Yes      | JWT signing key.                              |
| `ENCRYPTION_KEY`              | Yes      | Fernet key used to encrypt stored API keys.   |
| `GEMINI_API_KEY`              | No       | Optional global model API key fallback.       |
| `GEMINI_MODEL`                | No       | Default model name.                           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No       | Access token lifetime in minutes.             |
| `ALLOWED_ORIGINS`             | No       | Comma-separated CORS origins.                 |
| `DB_AUTO_CREATE`              | No       | Compatibility toggle for startup DB behavior. |

### Frontend Environment Variables

| Variable                     | Required | Description                                      |
| ---------------------------- | -------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL` | Yes      | Base URL for backend API calls.                  |
| `PLAYWRIGHT_TEST_BASE_URL` | No       | Base URL used by Playwright webServer and tests. |

## API Overview

### Auth (`/api/auth`)

- `POST /signup`
- `POST /login`
- `GET /me`

### Generation (`/api`)

- `POST /generate`
- `POST /generate/stream` (SSE events: `progress`, `result`, `error`, `done`)

### Settings (`/api/settings`)

- `GET /`
- `PUT /`
- `PUT /api-key`
- `POST /test-api-key`

### Generations (`/api/generations`)

- `POST /`
- `GET /`
- `GET /metrics`
- `GET /{generation_id}`
- `DELETE /{generation_id}`
- `DELETE /`
- `POST /{generation_id}/approve`
- `POST /{generation_id}/reject`
- `POST /{generation_id}/publish`

### Policies (`/api/policies`)

- `POST /upload`
- Max upload size: 5 MB
- Extracted policy text is capped at 15,000 characters

## Frontend Routes

- `/login`
- `/app`
- `/app/approval`
- `/app/history`
- `/app/settings`

## Test and Validation

### Backend tests

```bash
cd backend
pytest -q
```

### Frontend lint

```bash
cd frontend
npm run lint
```

### Frontend production build

```bash
cd frontend
npm run build
```

### Playwright smoke tests

```bash
cd frontend
npm run test:smoke
```

## Troubleshooting

### 1) Password hashing errors mentioning `bcrypt`

The backend currently uses `pbkdf2_sha256` through Passlib. If your environment still pulls in conflicting bcrypt behavior, recreate the environment and reinstall backend dependencies.

### 2) Playwright cannot connect to the app

Keep hostnames consistent between web server URL and test base URL (for example, use `localhost` for both instead of mixing `localhost` and `127.0.0.1`).

### 3) `playwright` command not found on Windows

Run tests with `npm run test:smoke` or `npx playwright test` from `frontend`.

### 4) Backend starts but requests fail with CORS

Add your frontend origin to `ALLOWED_ORIGINS` in `backend/.env`.

## Security Notes

- Never commit `.env` files or secrets.
- Rotate `JWT_SECRET` and provider keys periodically.
- Use HTTPS and secure cookie/token handling in production environments.
