import os
import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

# Ensure config/env is available before importing the app and DB engine.
os.environ["DATABASE_URL"] = "sqlite:///./test_integration.db"
os.environ["JWT_SECRET"] = "integration-test-secret"
os.environ["ENCRYPTION_KEY"] = "5v84dKJfGUj6fBYTeWjM-yaH6J6Q3ceR6nWpk7A7JfQ="
os.environ["DB_AUTO_CREATE"] = "true"

from main import app
from db.session import engine


@pytest.fixture(autouse=True)
def reset_db() -> Generator[None, None, None]:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


def _register_and_login(client: TestClient, email: str, password: str = "StrongPass123!") -> str:
    signup = client.post(
        "/api/auth/signup",
        json={"email": email, "password": password},
    )
    assert signup.status_code == 200
    token = signup.json()["access_token"]
    return token


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    token = _register_and_login(client, f"user-{uuid.uuid4().hex[:8]}@example.com")
    return {"Authorization": f"Bearer {token}"}
