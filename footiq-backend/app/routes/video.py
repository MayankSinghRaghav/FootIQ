import os
import uuid
import shutil
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.cv_service import start_video_processing, get_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/video", tags=["video"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
def upload_video(file: UploadFile = File(...)):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".mkv"]:
        raise HTTPException(status_code=400, detail="Unsupported video format. Upload .mp4, .avi, .mov, or .mkv")

    task_id = str(uuid.uuid4())
    video_path = os.path.join(UPLOAD_DIR, f"{task_id}{ext}")

    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save uploaded video: {e}")
        raise HTTPException(status_code=500, detail="Failed to save video upload")

    # Start tracking asynchronously
    start_video_processing(task_id, video_path)

    return {
        "status": "queued",
        "task_id": task_id,
        "filename": file.filename
    }

@router.get("/status/{task_id}")
def check_status(task_id: str):
    res = get_status(task_id)
    if res["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Task not found")
    return res

@router.get("/heatmap/{task_id}")
def get_heatmap(task_id: str):
    res = get_status(task_id)
    if res["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Task not found")
    if res["status"] == "failed":
        raise HTTPException(status_code=500, detail=f"Processing failed: {res.get('error')}")
    if res["status"] != "completed":
        raise HTTPException(status_code=202, detail="Processing not completed yet")
    
    return {
        "task_id": task_id,
        "heatmap": res.get("heatmap", []),
        "sprints": res.get("sprints", [])
    }
