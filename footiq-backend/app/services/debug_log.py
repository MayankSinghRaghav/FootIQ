import json
import os
import tempfile
import time


LOG_DIR = os.getenv("FOOTIQ_LOG_DIR", tempfile.gettempdir())
DEBUG_LOG_PATH = os.path.join(LOG_DIR, "footiq_debug.log")


def debug_log(run_id: str, hypothesis_id: str, location: str, message: str, data: dict):
    payload = {
        "sessionId": "50d223",
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    try:
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
