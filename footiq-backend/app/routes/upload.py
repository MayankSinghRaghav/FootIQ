import json

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models.schemas import UploadResponse
from app.services.embedder import add_documents
from app.services.loader import parse_events_to_chunks
from app.services.store import save_match_events

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_match_data(match_id: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are supported")

    raw_content = await file.read()
    try:
        events = json.loads(raw_content.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(events, list) or not events:
        raise HTTPException(status_code=400, detail="JSON must be a non-empty array of events")

    chunks = parse_events_to_chunks(events=events, match_id=match_id)
    try:
        chunks_created = add_documents(chunks)
    except ValueError as e:
        if "authentication" in str(e).lower() or "api key" in str(e).lower():
            raise HTTPException(status_code=502, detail="Gemini API authentication failed. Check GEMINI_API_KEY in your .env file.")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Upload indexing failed")
    save_match_events(match_id=match_id, events=events)


    return UploadResponse(
        match_id=str(match_id),
        events_loaded=len(events),
        chunks_created=chunks_created,
        message="Match uploaded and indexed successfully",
    )
