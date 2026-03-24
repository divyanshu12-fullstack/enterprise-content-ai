from fastapi import FastAPI

from api.routes import router as api_router

app = FastAPI(title="Enterprise Content AI Backend", version="0.1.0")
app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
