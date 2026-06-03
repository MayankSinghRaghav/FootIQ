from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import PlayerSummaryResponse, PlayerNarrativeResponse
from app.services.analytics import build_player_summaries, build_player_narrative
from app.services.debug_log import debug_log
from app.services.store import get_match_events

router = APIRouter()


@router.get("/players/{match_id}", response_model=PlayerSummaryResponse)
def player_summaries(match_id: str, limit: int = Query(default=25, ge=1, le=200)):
    # #region agent log
    debug_log("initial-run", "H3", "players.py:player_summaries:start", "Players endpoint hit", {"match_id": match_id, "limit": limit})
    # #endregion
    events = get_match_events(match_id)
    if not events:
        # #region agent log
        debug_log("initial-run", "H3", "players.py:player_summaries:not_found", "Players missing in memory", {"match_id": match_id})
        # #endregion
        raise HTTPException(
            status_code=404,
            detail="Match not found in memory. Upload the match with /upload to generate player summaries.",
        )

    summaries = build_player_summaries(events)
    # #region agent log
    debug_log("initial-run", "H3", "players.py:player_summaries:success", "Players returned", {"match_id": match_id, "count": len(summaries)})
    # #endregion
    return PlayerSummaryResponse(match_id=match_id, players=summaries[:limit])


@router.get("/players/{match_id}/{player_name}", response_model=PlayerNarrativeResponse)
def player_narrative(match_id: str, player_name: str):
    events = get_match_events(match_id)
    if not events:
        raise HTTPException(
            status_code=404,
            detail="Match not found in memory. Upload the match with /upload first.",
        )

    summaries = build_player_summaries(events)
    player_payload = next(
        (item for item in summaries if item["player_name"].lower() == player_name.lower()),
        None,
    )
    if not player_payload:
        raise HTTPException(status_code=404, detail="Player not found for this match")

    return PlayerNarrativeResponse(
        match_id=match_id,
        player_name=player_payload["player_name"],
        narrative=build_player_narrative(player_payload),
    )
