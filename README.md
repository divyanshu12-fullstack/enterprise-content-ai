# Draftly - Enterprise Content AI

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**A professional-grade, multi-agent full-stack application for generating policy-aware marketing content with strict compliance checks and an approval workflow.**

[Features](#features) • [System Architecture](#system-architecture) • [Agentic Logic](#agentic-logic-crewai) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Codebase Structure](#codebase-structure)

</div>

---

## Features

- **Policy-Aware Generation Pipeline**: Upload `TXT`, `PDF`, and `DOCX` files. The backend extracts text and uses it as strict context for AI generation. This ensures all outputs align perfectly with your brand voice, policies, and compliance guidelines.
- **Multi-Agent Workflow (CrewAI)**: Automatically orchestrates a sequence of specialized AI agents (e.g., Marketing Writer, Compliance Checker) to draft, review, and refine content before returning it to the user.
- **Workflow & Approval Lifecycle**: Complete dashboard to manage your content generations. Drafts can be reviewed, verified, and explicitly marked as `Approved`, `Rejected`, or `Published` directly from the UI.
- **Real-Time Streaming Generation**: Opt-in generation streaming via Server-Sent Events (SSE). It provides immediate token-by-token feedback and visual pipeline progress in the Next.js frontend as the agents "think" and "write".
- **Granular User Settings**: Personalize the AI experience per user. Safely store individual provider API keys (encrypted via robust `Fernet` encryption), define blocked words, set generation retries, and select specific Gemini models at runtime.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DRAFTLY CONTENT WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌────────────┐     ┌──────────────┐     ┌─────────────┐   ┌───────────┐   │
│   │ Next.js UI │────▶│ FastAPI Core │────▶│ Policy Docs │──▶│ RAG & Ext │   │
│   │ (Frontend) │◀────│  (Backend)   │     │ (Upload)    │   │ Extraction│   │
│   └────────────┘     └──────────────┘     └─────────────┘   └───────────┘   │
│         │                    │                                      │       │
│         ▼                    ▼                                      ▼       │
│   ┌────────────┐     ┌──────────────┐     ┌─────────────┐   ┌───────────┐   │
│   │ PostgreSQL │     │ Generative   │◀───▶│ CrewAI      │◀──│ Gemini    │   │
│   │ & Alembic  │     │ Streaming API│     │ Agents      │   │ LLM       │   │
│   └────────────┘     └──────────────┘     └─────────────┘   └───────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agentic Logic (CrewAI)

The core cognitive engine of Draftly revolves around its **multi-agent pipeline** powered by CrewAI and Google Gemini models. Instead of a single "zero-shot" LLM prompt, requests go through simulated agency stages:

1. **Input & Policy Injection**: The system combines the user's prompt, targeted platform constraints (LinkedIn, Twitter, Image Prompt), and uploaded policy documents (retrieved from an in-memory or persisted context).
2. **Drafting Agent (Marketing Writer)**: A specialized marketing agent generates an initial draft tailored precisely to the selected platform constraints (e.g., character limits, hashtag usage, tonal consistency).
3. **Compliance Agent (Validator)**: A secondary agent retrieves the draft, the core policy document, and user-specific "blocked words". It rigorously audits for violations, brand tone mismatches, and sensitive language usage.
4. **Refinement Subsystem**: If the compliance agent flags issues, the pipeline programmatically iterates. It forces the drafting agent to rewrite the content based on specific critique feedback until it passes or hits the user-configured maximum retry limit.
5. **Generative Delivery**: The final approved text is dispatched via FastAPI's SSE stream, rendering fluidly across the UI.

---

## Tech Stack

### Backend
The backend is built with Python for ML/AI flexibility while retaining production-grade backend scale:
- **Framework**: `FastAPI` for high-performance, asynchronous REST APIs.
- **Database & ORM**: `SQLModel` (built completely on modern SQLAlchemy) and `Alembic` for automated, robust database migrations.
- **Database Engine**: `PostgreSQL` (production-ready) and `SQLite` (optimized for swift E2E testing).
- **Authentication**: Secure JWT-based auth utilizing `Passlib` (pbkdf2_sha256 hashing).
- **Core AI Engine**: `CrewAI` for autonomous agent orchestration; `google-genai` for core LLM interactions.
- **Security**: Custom dedicated encryption using the `cryptography.fernet` library to aggressively secure user-provided provider APIs and secrets inside the database.

### Frontend
The frontend presents a highly polished, responsive interface utilizing the latest React paradigms:
- **Framework**: `Next.js 16` leveraging the modern App Router architecture.
- **UI & Styling**: `React 19`, `Tailwind CSS v3/v4`, `lucide-react` icons, and a beautiful custom `components/ui` library based on `shadcn/ui` components (like `animated-grid`, `pipeline-status`).
- **Data Fetching & Streaming**: Next-generation hooks and a `fetch`-based Server-Sent Connection (SSE) for decoding continuous streams of content logic and displaying real-time UI transitions.
- **Testing Assurance**: Strict End-to-End smoke testing flows driven natively by `Playwright`.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# Install strictly locked requirements
pip install -r requirements.txt
```

**Environment Variables (`backend/.env`)**:
```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/enterprise_content_ai
JWT_SECRET=your-secure-jwt-secret
# Generate an encryption key rapidly with: 
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=your-generated-fernet-key
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Run the Server**:
```bash
# Deploys with uvicorn asynchronously 
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Environment Variables (`frontend/.env.local`)**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

**Run the Client**:
```bash
npm run dev
```

Navigate cleanly to `http://localhost:3000` to register, log in, and establish a policy-aware generation.

---

## API Reference & Endpoints

- **Auth**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`
- **Content Generation**:
  - `POST /api/generate` — Standard synchronous generation block.
  - `POST /api/generate/stream` — SSE streams yielding sequential JSON payloads for `progress`, `result`, `error`, and `done`.
- **Settings Configurations**: `GET /api/settings`, `PUT /api/settings` — Overrides model configuration (`GEMINI_MODEL`), limits, specific blocked words, and user API keys.
- **Policy Ingestion**: `POST /api/policies/upload` — Intakes Max 5MB docs, parses and extracts semantic context up to 15,000 token-safe characters via PDF/DocX text bridges.
- **Approval Actions (Lifecycle)**: `POST /api/generations/{id}/approve`, `reject`, or `publish`. Transitions row state cleanly within the DB lifecycle.

---

## Codebase Structure

```text
enterprise-content-ai/
├── backend/                  # FastAPI Application Core
│   ├── alembic/              # Database Migrations Logic
│   ├── api/                  # Routes (auth.py, policies.py, generations.py, settings.py)
│   ├── crew/                 # Agent logic (crew_logic.py, agents.py, tasks.py, compliance.py)
│   ├── db/                   # DB Session mapping, core models (models.py, config.py) 
│   ├── tests/                # Rich pytesting coverage logic
│   └── main.py               # Uvicorn entrypoint
└── frontend/                 # Next.js Application Core
    ├── app/                  # Application Routes (page.tsx, /login, /app directories)
    ├── components/           # Modularized UI units (pipeline-status, content-preview)
    ├── lib/                  # Shared Utility types, Axios API fetchers, schemas
    └── tests/                # Playwright specific smoke-golden-flow tests
```

---

## Testing & Validation Suite

- **Backend (Pytest)**: Run `pytest` or `pytest -q` inside the `backend/` directory to trigger comprehensive unit & integration tests covering authorization, deterministic compliance rules, policy extraction integrity, and Pydantic schema validation.
- **Frontend (Playwright)**: Run `npm run test:smoke` or `npx playwright test` inside the `frontend/` directory to unleash a fully browser-automated golden-flow suite validating end-to-end user navigation (Login → Generate → Stream → Publish Output).
