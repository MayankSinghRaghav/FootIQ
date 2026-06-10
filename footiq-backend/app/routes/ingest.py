import time
import logging
import os
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from app.models.schemas import IngestResponse
from app.services.loader import load_all_matches
from app.services.embedder import add_documents
from app.config import DATA_DIR
from app.services.loader import read_events_from_file
from app.services.store import save_match_events

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
async def ingest_data():
    start_time = time.time()
    
    chunks, matches_loaded = load_all_matches(DATA_DIR)
    
    if not chunks:
        logger.warning("No data loaded. /data folder might be empty or files are malformed.")
        return IngestResponse(
            matches_loaded=0,
            chunks_created=0,
            time_ms=int((time.time() - start_time) * 1000)
        )
        
    chunks_created = await run_in_threadpool(add_documents, chunks)

    # Refresh in-memory events for player summary/report endpoints.
    if os.path.isdir(DATA_DIR):
        for name in os.listdir(DATA_DIR):
            if name.endswith(".json"):
                file_path = os.path.join(DATA_DIR, name)
                match_id = os.path.splitext(name)[0]
                events = read_events_from_file(file_path)
                if events:
                    save_match_events(match_id, events)
    
    return IngestResponse(
        matches_loaded=matches_loaded,
        chunks_created=chunks_created,
        time_ms=int((time.time() - start_time) * 1000)
    )
