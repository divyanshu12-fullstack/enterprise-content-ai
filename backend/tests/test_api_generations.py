from fastapi.testclient import TestClient


def test_generations_crud_and_actions(client: TestClient, auth_headers: dict[str, str]) -> None:
    create = client.post(
        "/api/generations",
        headers=auth_headers,
        json={
            "topic": "Launch AI governance hub",
            "audience": "marketers",
            "linkedin_post": "A ready LinkedIn post",
            "twitter_post": "A ready tweet",
            "image_prompt": "A clean visual",
            "compliance_status": "APPROVED",
            "status": "COMPLETED",
            "duration_ms": 1800,
        },
    )
    assert create.status_code == 200
    generation_id = create.json()["id"]

    listing = client.get("/api/generations", headers=auth_headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    metrics = client.get("/api/generations/metrics", headers=auth_headers)
    assert metrics.status_code == 200
    assert metrics.json()["total_runs"] == 1
    assert metrics.json()["pass_rate"] == 100.0

    fetch = client.get(f"/api/generations/{generation_id}", headers=auth_headers)
    assert fetch.status_code == 200
    assert fetch.json()["topic"] == "Launch AI governance hub"

    approve = client.post(f"/api/generations/{generation_id}/approve", headers=auth_headers, json={"notes": "Approved"})
    assert approve.status_code == 200
    assert approve.json()["status"] == "APPROVED"

    reject = client.post(f"/api/generations/{generation_id}/reject", headers=auth_headers, json={"notes": "Rejected"})
    assert reject.status_code == 200
    assert reject.json()["status"] == "REJECTED"

    publish = client.post(f"/api/generations/{generation_id}/publish", headers=auth_headers, json={"notes": "Publish now"})
    assert publish.status_code == 200
    assert publish.json()["status"] == "PUBLISHED"

    delete = client.delete(f"/api/generations/{generation_id}", headers=auth_headers)
    assert delete.status_code == 200


def test_generations_clear(client: TestClient, auth_headers: dict[str, str]) -> None:
    for i in range(2):
        response = client.post(
            "/api/generations",
            headers=auth_headers,
            json={
                "topic": f"Topic {i}",
                "audience": "general",
                "compliance_status": "REJECTED" if i == 0 else "APPROVED",
                "status": "COMPLETED",
                "duration_ms": 500 + i,
            },
        )
        assert response.status_code == 200

    clear = client.delete("/api/generations", headers=auth_headers)
    assert clear.status_code == 200
    assert clear.json()["deleted"] == 2
