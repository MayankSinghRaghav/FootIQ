from fastapi import APIRouter
from app.services.embedder import get_vector_count

router = APIRouter()

@router.get("/health")
def health_check():
    vector_count = get_vector_count()
    return {
        "status": "ok",
        "vector_count": vector_count,
        "collections": ["footiq_matches"] if vector_count > 0 else []
    }
