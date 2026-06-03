import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert "vector_count" in r.json()

def test_empty_question():
    r = client.post("/query", json={"question": ""})
    assert r.status_code == 422
    assert "Question cannot be empty" in r.json()["detail"]

def test_no_data():
    # If the database is completely empty and no data loaded:
    # Health should be ok, but vector count is 0
    # A query should return 503
    r = client.get("/health")
    if r.json()["vector_count"] == 0:
        r_query = client.post("/query", json={"question": "Test"})
        assert r_query.status_code == 503
        assert r_query.json()["detail"] == "No match data in ChromaDB"

def test_ingest():
    # Attempt an ingest. Note: in tests, this will look at the actual /data folder.
    r = client.post("/ingest")
    assert r.status_code == 200
    data = r.json()
    assert "matches_loaded" in data
    assert "chunks_created" in data

def test_happy_path():
    # Wait to run happy path only if data exists
    health_r = client.get("/health")
    if health_r.json()["vector_count"] > 0:
        r = client.post("/query", json={"question": "How many shots were taken?"})
        assert r.status_code == 200
        data = r.json()
        assert "answer" in data
        assert data["confidence"] >= 0
        assert "sources" in data
