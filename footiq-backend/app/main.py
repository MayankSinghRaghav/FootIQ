import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, ingest, query, upload, players, history, video
from app.services.loader import load_all_matches
from app.services.embedder import add_documents
from app.config import DATA_DIR
from app.services.store import save_match_events

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting up... auto-ingesting data if any")
    chunks, matches_loaded = load_all_matches(DATA_DIR)
    if chunks:
        chunks_created = add_documents(chunks)
        logger.info(f"Auto-ingest: Loaded {matches_loaded} matches, created {chunks_created} new chunks")
    else:
        logger.warning("Auto-ingest: No data found or /data folder is empty")

    # Load raw events in memory to support player summary/report endpoints.
    # This keeps the MVP simple and avoids introducing a DB dependency at this stage.
    import os
    from app.services.loader import read_events_from_file

    if os.path.isdir(DATA_DIR):
        for name in os.listdir(DATA_DIR):
            if name.endswith(".json"):
                file_path = os.path.join(DATA_DIR, name)
                match_id = os.path.splitext(name)[0]
                events = read_events_from_file(file_path)
                if events:
                    save_match_events(match_id, events)
    
    yield
    # Shutdown logic
    logger.info("Shutting down...")

app = FastAPI(title="FootIQ API", version="1.0.0", lifespan=lifespan)

# CORS Middleware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Include Routers
app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(upload.router)
app.include_router(players.router)
app.include_router(history.router)
app.include_router(video.router)
