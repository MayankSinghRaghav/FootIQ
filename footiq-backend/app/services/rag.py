import time
import logging
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
from app.config import GEMINI_API_KEY
from app.services.embedder import get_vector_store
from app.models.schemas import QueryResponse

logger = logging.getLogger(__name__)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY, temperature=0.0)

SYSTEM_PROMPT = """
You are FootIQ, an AI assistant for football coaches.
Answer ONLY using the match data provided in the context below.
If the answer is not in the context, say:
  'I don't have enough match data to answer this.'
Never guess or fabricate statistics.
Keep answers concise, factual, and coach-friendly.
"""

def compute_confidence(similarity_scores: list[float]) -> float:
    # ChromaDB returns L2 distance (lower = more similar)
    # Convert to 0-1 confidence: 1 - normalized_distance
    if not similarity_scores:
        return 0.0
    avg_distance = sum(similarity_scores) / len(similarity_scores)
    # Clamp to reasonable range (0 to 2 for L2 distance)
    confidence = max(0.0, min(1.0, 1 - (avg_distance / 2)))
    return round(confidence, 3)

def answer_query(question: str, match_id: Optional[str] = None, top_k: int = 5) -> QueryResponse:
    start_time = time.time()
    vector_store = get_vector_store()
    
    # Check if there is data
    try:
        count = vector_store._collection.count()
        if count == 0:
            raise ValueError("No match data in ChromaDB")
    except Exception as e:
        raise ValueError("No match data in ChromaDB")
    
    # Retrieve
    filter_dict = {}
    if match_id:
        filter_dict["match_id"] = str(match_id)
        
    try:
        # We need distances for confidence, so we use similarity_search_with_score
        results = vector_store.similarity_search_with_score(
            query=question,
            k=top_k,
            filter=filter_dict if filter_dict else None
        )
    except Exception as e:
        logger.error(f"Error searching ChromaDB with filter {filter_dict}: {e}")
        # Fallback to global search if match_id filter fails or returns no match data 
        # (Though langchain might just return empty list. We'll handle empty list below)
        results = []
        
    # If no results and match_id was provided, fall back to global
    if not results and match_id:
        logger.warning(f"No results found for match_id {match_id}. Falling back to global search.")
        results = vector_store.similarity_search_with_score(
            query=question,
            k=top_k
        )
        # Update match_id to indicate it was a global search fallback
        used_match_id = "global"
    else:
        used_match_id = match_id if match_id else "global"

    if not results:
        # Zero results from search
        return QueryResponse(
            answer="I don't have match data to answer this",
            sources=[],
            confidence=0.0,
            match_id=used_match_id,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )

    docs = [res[0] for res in results]
    scores = [res[1] for res in results]
    
    # Build context
    context_chunks = [doc.page_content for doc in docs]
    retrieved_chunks_joined_by_newline = "\n".join(context_chunks)
    
    prompt = f"""SYSTEM: {SYSTEM_PROMPT}

CONTEXT (retrieved match data):
------------------------------
{retrieved_chunks_joined_by_newline}
------------------------------
COACH QUESTION: {question}
ANSWER:"""

    # Call LLM
    try:
        completion = llm.invoke(prompt)
        answer = completion.content
        if not answer:
            answer = "Unable to generate answer. Please try again."
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Retry once
        time.sleep(2)
        try:
            completion = llm.invoke(prompt)
            answer = completion.content
        except Exception as retry_e:
            logger.error(f"Gemini API retry error: {retry_e}")
            raise RuntimeError("Gemini API failure")

    # Extract source IDs
    sources = [doc.metadata.get("id", "unknown") for doc in docs]
    
    # Calculate confidence
    confidence = compute_confidence(scores)

    return QueryResponse(
        answer=answer,
        sources=sources,
        confidence=confidence,
        match_id=used_match_id,
        processing_time_ms=int((time.time() - start_time) * 1000)
    )
