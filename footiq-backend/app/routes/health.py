from fastapi import APIRouter
from app.services.embedder import get_vector_count

router = APIRouter()


@router.get("/health")
def health_check():
    try:
        vector_count = get_vector_count()
        chroma_ok = True
    except Exception:
        vector_count = 0
        chroma_ok = False

    return {
        "status": "ok" if chroma_ok else "degraded",
        "chroma_connected": chroma_ok,
        "vector_count": vector_count,
        "collections": ["footiq_matches"] if vector_count > 0 else [],
    }
