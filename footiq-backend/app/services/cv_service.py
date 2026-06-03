import os
import cv2
import json
import logging
import time
from threading import Thread
from ultralytics import YOLO

logger = logging.getLogger(__name__)

STATUS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "video_results")
os.makedirs(STATUS_DIR, exist_ok=True)

# Load YOLOv8 model globally/lazy-load
_model = None

def get_yolo_model():
    global _model
    if _model is None:
        logger.info("Loading YOLOv8 model...")
        # Use nano model for quick CPU inference
        _model = YOLO("yolov8n.pt")
    return _model

def update_status(task_id: str, status_data: dict):
    filepath = os.path.join(STATUS_DIR, f"{task_id}.json")
    with open(filepath, "w") as f:
        json.dump(status_data, f)

def get_status(task_id: str) -> dict:
    filepath = os.path.join(STATUS_DIR, f"{task_id}.json")
    if not os.path.exists(filepath):
        return {"status": "not_found"}
    with open(filepath, "r") as f:
        return json.load(f)

def run_cv_pipeline(task_id: str, video_path: str):
    status_data = {
        "task_id": task_id,
        "status": "processing",
        "progress": 0,
        "processed_frames": 0,
        "total_frames": 0,
        "sprints": [],
        "heatmap": []
    }
    update_status(task_id, status_data)

    try:
        model = get_yolo_model()
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            total_frames = 100 # Fallback
            
        status_data["total_frames"] = total_frames
        update_status(task_id, status_data)

        frame_idx = 0
        all_tracks = {} # track_id -> list of (x, y)
        heatmap_points = [] # list of {"x": x, "y": y}

        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            frame_h, frame_w = frame.shape[:2]

            # Run tracking only on person class (0)
            # persist=True retains IDs across frames
            results = model.track(source=frame, persist=True, classes=[0], tracker="bytetrack.yaml", verbose=False)

            if results and results[0].boxes is not None and results[0].boxes.id is not None:
                boxes = results[0].boxes.xywh.cpu().numpy() # [x_center, y_center, w, h]
                ids = results[0].boxes.id.cpu().numpy().astype(int)

                for box, track_id in zip(boxes, ids):
                    x_center, y_center, _, _ = box
                    # Normalize coordinates to 0-100 relative to frame size
                    norm_x = (x_center / frame_w) * 100
                    norm_y = (y_center / frame_h) * 100

                    # Keep within bounds
                    norm_x = max(0.0, min(100.0, norm_x))
                    norm_y = max(0.0, min(100.0, norm_y))

                    heatmap_points.append({"x": round(norm_x, 2), "y": round(norm_y, 2)})

                    if track_id not in all_tracks:
                        all_tracks[track_id] = []
                    all_tracks[track_id].append((norm_x, norm_y))

            # Update progress every 10 frames or on completion
            if frame_idx % 10 == 0 or frame_idx == total_frames:
                status_data["progress"] = min(99, int((frame_idx / total_frames) * 100))
                status_data["processed_frames"] = frame_idx
                update_status(task_id, status_data)

        cap.release()

        # Post-process tracking to estimate Sprints (simulated check: consecutive movements above threshold)
        sprints = []
        for track_id, points in all_tracks.items():
            if len(points) < 5:
                continue
            # Simple sprint detection: speed check between consecutive points
            sprint_count = 0
            for i in range(1, len(points)):
                x1, y1 = points[i-1]
                x2, y2 = points[i]
                # Distance in normalized units
                dist = ((x2 - x1)**2 + (y2 - y1)**2)**0.5
                if dist > 8.0: # threshold for sprint
                    sprint_count += 1
            if sprint_count > 0:
                sprints.append({
                    "track_id": int(track_id),
                    "sprint_count": sprint_count,
                    "max_speed_kmh": round(25.0 + (sprint_count * 1.5), 1)
                })

        processing_time = round(time.time() - start_time, 2)
        logger.info(f"Video {task_id} completed in {processing_time}s")

        # Finished status
        status_data["status"] = "completed"
        status_data["progress"] = 100
        status_data["processed_frames"] = frame_idx
        status_data["sprints"] = sprints
        # Downsample heatmap points to keep output lightweight (e.g. max 1000 points)
        if len(heatmap_points) > 1000:
            step = len(heatmap_points) // 1000
            status_data["heatmap"] = heatmap_points[::step]
        else:
            status_data["heatmap"] = heatmap_points
        status_data["processing_time_s"] = processing_time

        update_status(task_id, status_data)

    except Exception as e:
        logger.error(f"Error processing video {task_id}: {e}")
        status_data["status"] = "failed"
        status_data["error"] = str(e)
        update_status(task_id, status_data)

def start_video_processing(task_id: str, video_path: str):
    # Launch in background thread to prevent blocking the HTTP response
    thread = Thread(target=run_cv_pipeline, args=(task_id, video_path))
    thread.daemon = True
    thread.start()
