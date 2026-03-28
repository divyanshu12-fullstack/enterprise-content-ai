import uuid

from fastapi.testclient import TestClient


def test_auth_signup_login_me(client: TestClient) -> None:
    email = f"auth-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"

    signup = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert signup.status_code == 200
    signup_body = signup.json()
    assert signup_body["email"] == email
    assert signup_body["token_type"] == "bearer"

    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email
