from fastapi.testclient import TestClient


def test_settings_get_update_and_api_key(client: TestClient, auth_headers: dict[str, str]) -> None:
    initial = client.get("/api/settings", headers=auth_headers)
    assert initial.status_code == 200
    assert initial.json()["selected_model"] == "gemini-2.5-flash"
    assert initial.json()["has_api_key"] is False

    update_payload = {
        "selected_model": "gemini-2.5-pro",
        "auto_retry": False,
        "max_retries": 1,
        "include_source_urls": True,
        "auto_generate_image": True,
        "strict_compliance": True,
        "notifications_email": True,
        "notifications_push": False,
        "notifications_slack": False,
        "notifications_on_approval": True,
        "notifications_on_rejection": True,
        "notifications_weekly_report": False,
        "custom_blocked_words": ["risk-free", "guaranteed"],
    }

    updated = client.put("/api/settings", headers=auth_headers, json=update_payload)
    assert updated.status_code == 200
    body = updated.json()
    assert body["selected_model"] == "gemini-2.5-pro"
    assert body["custom_blocked_words"] == ["risk-free", "guaranteed"]

    set_key = client.put("/api/settings/api-key", headers=auth_headers, json={"api_key": "key_123456789012345"})
    assert set_key.status_code == 200

    tested = client.post("/api/settings/test-api-key", headers=auth_headers)
    assert tested.status_code == 200
    assert tested.json()["ok"] is True
