from os import getenv

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.generations import router as generations_router
from api.policies import router as policies_router
from api.routes import router as api_router
from api.settings import router as settings_router
from db.config import database_url, encryption_key, jwt_secret
from db.session import init_db

app = FastAPI(
    title="Enterprise Content AI Backend",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(generations_router)
app.include_router(policies_router)


@app.on_event("startup")
def startup() -> None:
    # Validate required environment variables up front and initialize DB tables.
    database_url()
    jwt_secret()
    encryption_key()
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "enterprise-content-ai-backend",
        "version": app.version,
        "model": getenv("GEMINI_MODEL", "gemini-3.1-flash"),
    }
