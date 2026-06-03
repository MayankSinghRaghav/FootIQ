from pydantic import BaseModel, Field
from typing import List, Optional

class QueryRequest(BaseModel):
    question: str
    match_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
    match_id: str
    processing_time_ms: int

class IngestResponse(BaseModel):
    matches_loaded: int
    chunks_created: int
    time_ms: int


class UploadResponse(BaseModel):
    match_id: str
    events_loaded: int
    chunks_created: int
    message: str


class PlayerSummary(BaseModel):
    player_name: str
    team_name: str
    passes: int
    pass_accuracy: float
    shots: int
    goals: int
    dribbles_completed: int
    duels_won: int
    duels_lost: int
    fouls_committed: int
    fouls_won: int


class PlayerSummaryResponse(BaseModel):
    match_id: str
    players: List[PlayerSummary]


class PlayerNarrativeResponse(BaseModel):
    match_id: str
    player_name: str
    narrative: str


class SessionHistoryItem(BaseModel):
    question: str
    match_id: str
    answer: str
    confidence: float
    processing_time_ms: int
    timestamp_utc: str


class SessionHistoryResponse(BaseModel):
    total: int
    items: List[SessionHistoryItem]
