from datetime import datetime, timezone
from typing import Dict, List


RAW_MATCH_EVENTS: Dict[str, List[dict]] = {}
SESSION_HISTORY: List[dict] = []


def save_match_events(match_id: str, events: List[dict]) -> None:
    RAW_MATCH_EVENTS[str(match_id)] = events


def get_match_events(match_id: str) -> List[dict]:
    return RAW_MATCH_EVENTS.get(str(match_id), [])


def add_session_history(item: dict) -> None:
    payload = dict(item)
    payload["timestamp_utc"] = datetime.now(timezone.utc).isoformat()
    SESSION_HISTORY.append(payload)


def get_session_history(limit: int = 50) -> List[dict]:
    if limit <= 0:
        return []
    return SESSION_HISTORY[-limit:][::-1]
