# Frontend-Backend Integration Audit (App Pages)

Date: 2026-03-25
Scope reviewed:

- `frontend/app/**` (active app router pages and layouts)
- `frontend/src/app/**` (legacy/duplicate app pages)
- `frontend/src/lib/**` and `frontend/lib/**`
- `frontend/components/**` (app navigation + workflow components)
- `backend/main.py`, `backend/api/routes.py`, `backend/crew/**`, `backend/tests/**`

---

## 1) Current Route Reality (Important)

There are two app-router structures in frontend:

1. Active product app pages under `frontend/app/app/**`

- `frontend/app/app/page.tsx` (Generate workflow)
- `frontend/app/app/approval/page.tsx`
- `frontend/app/app/history/page.tsx`
- `frontend/app/app/settings/page.tsx`
- `frontend/app/app/layout.tsx`

2. Legacy placeholder pages under `frontend/src/app/**`

- `frontend/src/app/page.tsx`
- `frontend/src/app/generate/page.tsx`
- `frontend/src/app/approval/page.tsx`

Impact:

- Team confusion risk: both folders contain similar pages but only one workflow is actually built for your current app UX.
- Recommendation: keep only one app-router source of truth (prefer `frontend/app/**`), or clearly mark `frontend/src/app/**` as deprecated.

---

## 2) What Frontend Collects vs What Backend Accepts

### Frontend inputs in Generate page (`frontend/app/app/page.tsx`)

Collected from users:

- `topic` (required)
- `audience` (required)
- `contentType` (optional)
- `tone` (optional)
- `additionalContext` (optional)
- `policyFile` upload (optional: pdf/doc/docx/txt)

### Backend request schema (`backend/api/routes.py`)

`POST /api/generate` currently accepts only:

- `topic`
- `audience`

### Gap

Everything below is currently ignored by backend because it is not in `GenerateRequest`:

- `contentType`
- `tone`
- `additionalContext`
- `policyFile` (and any extracted policy text)

---

## 3) Current Frontend Behavior That Is Not Integrated Yet

### Generate flow (`frontend/app/app/page.tsx`)

- `handleGenerate()` is simulated with timers and `setTimeout`.
- It stores a mock result in `localStorage` (`contentai_latest_result`).
- No real call to backend `/api/generate` from this page.

### Approval flow (`frontend/app/app/approval/page.tsx`)

- Reads generated result from `localStorage`.
- Publish and reject actions are UI-only (toasts/navigation), no backend state mutation.

### History flow (`frontend/app/app/history/page.tsx`)

- Uses hardcoded mock generation records.
- Search/filter/copy/delete are local only.
- No backend list/delete/query.

### Settings flow (`frontend/app/app/settings/page.tsx`)

- API key, selected model, compliance options, notifications are local state only.
- Save/test/reset are simulated (no backend persistence/validation).

### Existing but unused API client utility

- `frontend/src/lib/api.ts` already defines axios client and `generateContent(payload)`.
- Active app pages do not currently use it.
- `frontend/src/lib/schemas.ts` request schema is still minimal (`topic`, `audience`) and does not match current UI form fields.

---

## 4) Current Backend Capability (What Exists)

### Endpoints

- `GET /health` (basic health + model env value)
- `POST /api/generate`

### Generate pipeline behavior (`backend/crew/*`)

- Sequential 4-agent pipeline: researcher -> writer -> compliance -> visual.
- Compliance rules are hardcoded in prompt (banned terms + tone + tweet length).
- Final output schema supports:
  - `linkedin_post`
  - `twitter_post` (<= 280)
  - `image_prompt`
  - `compliance_status` (APPROVED/REJECTED)
  - `compliance_notes`

### Missing backend domains for app integration

- No generation history storage/query endpoints.
- No publish/approval/rejection endpoints.
- No settings persistence endpoints.
- No policy file ingestion/parsing endpoint.
- No per-user/workspace config handling.

---

## 5) Backend Changes Needed to Integrate Fully

## 5.1 Expand `POST /api/generate` contract

Current request:

```json
{
  "topic": "...",
  "audience": "..."
}
```

Required request (proposed):

```json
{
  "topic": "...",
  "audience": "professionals|executives|developers|marketers|students|general",
  "contentType": "thought-leadership|product-announcement|industry-insights|how-to-guide|case-study|company-news",
  "tone": "professional|conversational|inspirational|educational|persuasive",
  "additionalContext": "optional free text",
  "policyText": "optional extracted text from uploaded policy"
}
```

Notes:

- Keep `topic` + `audience` required.
- Other fields optional but must be consumed by tasks/agents if present.
- Update writer/compliance prompts to use `contentType`, `tone`, and `additionalContext` explicitly.

## 5.2 Add file upload support for policy docs

Needed because UI collects `policyFile`.

Two valid patterns:

1. Single multipart endpoint for generation + file:

- `POST /api/generate` as `multipart/form-data` with text fields + file

2. Two-step flow:

- `POST /api/policies/upload` -> returns `policyText` or `policyId`
- then `POST /api/generate` references parsed policy

Recommendation:

- Start with two-step flow for cleaner validation/errors and easier retries.

## 5.3 Add generation history API

Needed for `history` page and auditability.

Suggested endpoints:

- `POST /api/generations` (persist generated result + input payload + metadata)
- `GET /api/generations` (list with filters: status, search, date, audience)
- `GET /api/generations/{id}` (detail for approval page)
- `DELETE /api/generations/{id}` (history delete action)
- optional `DELETE /api/generations` (clear all history for workspace)

## 5.4 Add approval/publish actions

Needed for approval page actions.

Suggested endpoints:

- `POST /api/generations/{id}/approve`
- `POST /api/generations/{id}/reject`
- `POST /api/generations/{id}/publish`

Minimum payloads should include actor/time and optional notes.

## 5.5 Add settings APIs

Needed for settings page to stop using mock save.

Suggested endpoints:

- `GET /api/settings`
- `PUT /api/settings`
- `POST /api/settings/test-api-key` (validate provider key/model combo)

Settings model should include at least:

- LLM provider/model
- API key strategy (see security section)
- compliance flags + blocked terms
- generation defaults (tone/contentType fallback, retries)
- notification preferences

## 5.6 Add asynchronous job/progress model (recommended)

UI currently shows staged progress. If you want true live progress from backend:

- `POST /api/generate` returns `jobId`
- `GET /api/generations/jobs/{jobId}` returns status/result
- optional SSE/websocket for stage updates

---

## 6) Security and Architecture Decisions Needed

### API key handling (critical)

Frontend currently has an API key input, but backend currently uses env `GEMINI_API_KEY`.

You need to choose one model:

1. Server-managed key only (recommended first)

- Keep provider key only on backend.
- Hide key input in UI or repurpose as admin-only setting.
- Simpler and safer for MVP.

2. User-provided key per workspace/user

- Store encrypted at rest server-side.
- Never trust client-only storage for provider secrets.
- Require auth + workspace identity.

If this is a single-tenant app today, implement #1 first and remove misleading user key flow from non-admin users.

---

## 7) Frontend Changes Also Required (to consume backend)

Even with backend updates, these frontend integrations are still needed:

- Replace mocked generate timeout with real API call.
- Use `frontend/src/lib/api.ts` (or shared API layer) from `frontend/app/app/page.tsx`.
- Expand `frontend/src/lib/schemas.ts` request schema to match real form fields.
- Replace localStorage passing with server-driven IDs (`generationId`) + fetch detail in approval page.
- Replace history mock dataset with API list call.
- Wire settings save/test to real endpoints.

---

## 8) Priority Checklist

1. Unify app router source of truth (`frontend/app/**` vs `frontend/src/app/**`).
2. Expand backend `GenerateRequest` + task prompts to consume full generation inputs.
3. Implement real generate call in frontend using existing API utility.
4. Add generation persistence endpoints and wire history + approval pages.
5. Add settings persistence + API key/model validation endpoints.
6. Add policy file upload/extraction path and feed into compliance agent.
7. Add publish/reject action endpoints for end-to-end lifecycle.

---

## 9) Short Summary

Your frontend app pages already expose a richer workflow (API key/model settings, audience/content-type/tone/context, policy upload, history, approval actions), but backend currently supports only a narrow generate contract (`topic`, `audience`) and has no persistence/action endpoints.

To integrate both sides fully, backend must expand input schema, add settings/history/approval/publish APIs, and support policy file ingestion. Frontend must then replace mocked local flows with those real endpoints.                  


Postgres Connection String from neon.tech - postgresql://neondb_owner:npg_PAU2Xv6iswfr@ep-polished-dust-a12ke251-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
