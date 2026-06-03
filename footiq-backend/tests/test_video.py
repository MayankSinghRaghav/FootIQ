import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_upload_invalid_extension():
    # Test uploading a file with an unsupported extension
    files = {"file": ("test.txt", b"dummy content", "text/plain")}
    response = client.post("/video/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported video format" in response.json()["detail"]

def test_status_not_found():
    response = client.get("/video/status/nonexistent_task_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

def test_heatmap_not_found():
    response = client.get("/video/heatmap/nonexistent_task_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

@patch("app.routes.video.start_video_processing")
@patch("shutil.copyfileobj")
def test_upload_success_mock(mock_copy, mock_start):
    # Test uploading a supported video format
    files = {"file": ("test.mp4", b"fake video bytes", "video/mp4")}
    response = client.post("/video/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert "task_id" in data
    assert data["filename"] == "test.mp4"
    mock_start.assert_called_once()
