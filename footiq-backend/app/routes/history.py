from fastapi import APIRouter, Query

from app.models.schemas import SessionHistoryResponse
from app.services.debug_log import debug_log
from app.services.store import get_session_history

router = APIRouter()


@router.get("/history", response_model=SessionHistoryResponse)
def query_history(limit: int = Query(default=50, ge=1, le=500)):
    items = get_session_history(limit=limit)
    # #region agent log
    debug_log("initial-run", "H4", "history.py:query_history", "History endpoint returned", {"limit": limit, "count": len(items)})
    # #endregion
    return SessionHistoryResponse(total=len(items), items=items)
