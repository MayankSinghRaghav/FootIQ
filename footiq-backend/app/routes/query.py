from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse
from app.services.debug_log import debug_log
from app.services.rag import answer_query
from app.services.store import add_session_history
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
def query_match_data(request: QueryRequest):
    # #region agent log
    debug_log("initial-run", "H2", "query.py:query_match_data:start", "Query endpoint hit", {"match_id": request.match_id, "top_k": request.top_k, "question_len": len(request.question or "")})
    # #endregion
    # Truncate if > 1000 chars
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty")
        
    if len(question) > 1000:
        question = question[:1000]
        
    # Cap top_k
    top_k = request.top_k
    if top_k <= 0:
        top_k = 5
    elif top_k > 20:
        top_k = 20
        
    try:
        response = answer_query(
            question=question,
            match_id=request.match_id,
            top_k=top_k
        )
        # Log basic details
        logger.info(f"query='{question}' match_id={request.match_id} latency_ms={response.processing_time_ms} chunks={len(response.sources)}")
        add_session_history(
            {
                "question": question,
                "match_id": response.match_id,
                "answer": response.answer,
                "confidence": response.confidence,
                "processing_time_ms": response.processing_time_ms,
            }
        )
        # #region agent log
        debug_log(
            "initial-run",
            "H2",
            "query.py:query_match_data:success",
            "Query answered",
            {"match_id": response.match_id, "sources": len(response.sources), "latency_ms": response.processing_time_ms},
        )
        # #endregion
        return response
    except ValueError as e:
        # #region agent log
        debug_log("initial-run", "H2", "query.py:query_match_data:value_error", "Query value error", {"error": str(e)})
        # #endregion
        if str(e) == "No match data in ChromaDB":
            raise HTTPException(status_code=503, detail="No match data in ChromaDB")
        if str(e) == "Gemini embeddings authentication failed":
            raise HTTPException(status_code=502, detail="Gemini embeddings authentication failed. Update GEMINI_API_KEY in backend .env.")
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        # #region agent log
        debug_log("initial-run", "H2", "query.py:query_match_data:runtime_error", "Query runtime error", {"error": str(e)})
        # #endregion
        if "Gemini API failure" in str(e):
            raise HTTPException(status_code=502, detail="Gemini API failure")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in /query: {e}")
        # #region agent log
        debug_log("initial-run", "H2", "query.py:query_match_data:unexpected_error", "Query unexpected error", {"error": str(e)})
        # #endregion
        raise HTTPException(status_code=500, detail="Internal Server Error")
