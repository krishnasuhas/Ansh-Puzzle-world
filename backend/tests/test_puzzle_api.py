"""Backend tests for Ansh's Puzzle World API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://ansh-puzzle-joy.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health check ---
class TestHealth:
    def test_root_running(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "message" in data
        assert "running" in data["message"].lower()


# --- Scores CRUD ---
class TestScores:
    created_id = None

    def test_create_score(self, api_client):
        payload = {
            "grid": 3,
            "mode": "relaxed",
            "photo_id": "ansh_1",
            "moves": 42,
            "time_seconds": 65,
        }
        r = api_client.post(f"{BASE_URL}/api/scores", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        # Verify fields
        for k, v in payload.items():
            assert data[k] == v, f"Mismatch {k}: got {data[k]}"
        assert "_id" in data
        assert "created_at" in data
        assert isinstance(data["_id"], str)
        TestScores.created_id = data["_id"]

    def test_create_score_timed(self, api_client):
        payload = {
            "grid": 4,
            "mode": "timed",
            "photo_id": "ansh_2",
            "moves": 100,
            "time_seconds": 180,
        }
        r = api_client.post(f"{BASE_URL}/api/scores", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["grid"] == 4
        assert data["mode"] == "timed"

    def test_best_score_after_create(self, api_client):
        # Ensure at least one score exists (relaxed 3x3)
        api_client.post(f"{BASE_URL}/api/scores", json={
            "grid": 3, "mode": "relaxed", "photo_id": "ansh_1", "moves": 10, "time_seconds": 20
        })
        api_client.post(f"{BASE_URL}/api/scores", json={
            "grid": 3, "mode": "relaxed", "photo_id": "ansh_1", "moves": 50, "time_seconds": 90
        })
        r = api_client.get(f"{BASE_URL}/api/scores/best?grid=3&mode=relaxed")
        assert r.status_code == 200
        data = r.json()
        assert data["grid"] == 3
        assert data["mode"] == "relaxed"
        assert data["best_moves"] is not None
        assert data["best_time_seconds"] is not None
        assert data["plays"] >= 2
        # Min from set including 10 and 20 must be <=
        assert data["best_moves"] <= 10
        assert data["best_time_seconds"] <= 20

    def test_best_score_empty_combo(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/scores/best?grid=3&mode=nonexistent_mode_xyz")
        assert r.status_code == 200
        data = r.json()
        assert data["plays"] == 0
        assert data["best_moves"] is None
        assert data["best_time_seconds"] is None

    def test_recent_scores(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/scores/recent")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        first = data[0]
        for k in ["_id", "grid", "mode", "photo_id", "moves", "time_seconds", "created_at"]:
            assert k in first, f"missing {k}"

    def test_recent_scores_limit(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/scores/recent?limit=2")
        assert r.status_code == 200
        data = r.json()
        assert len(data) <= 2

    def test_create_score_invalid(self, api_client):
        # missing fields -> 422
        r = api_client.post(f"{BASE_URL}/api/scores", json={"grid": 3})
        assert r.status_code == 422
