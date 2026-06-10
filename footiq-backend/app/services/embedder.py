import chromadb
from chromadb.config import Settings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import logging
from app.config import CHROMA_PATH, GEMINI_API_KEY

logger = logging.getLogger(__name__)

# Initialize ChromaDB client
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB: {e}")
    # We will let the collection auto-create when needed, but if folder is corrupted:
    # in a real scenario we might wipe it.
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Note: Using Gemini text-embedding-004
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=GEMINI_API_KEY)

def get_vector_store():
    # Will auto-create 'footiq_matches' if it doesn't exist
    return Chroma(
        client=chroma_client,
        collection_name="footiq_matches",
        embedding_function=embeddings
    )

def add_documents(documents):
    if not documents:
        return 0

    vector_store = get_vector_store()
    
    # Check for existing chunks
    collection = vector_store._collection
    existing_data = collection.get(include=["metadatas"])
    existing_ids = set()
    if existing_data and existing_data["metadatas"]:
        for meta in existing_data["metadatas"]:
            if meta and "id" in meta:
                existing_ids.add(meta["id"])
                
    new_docs = []
    ids = []
    for doc in documents:
        doc_id = doc.metadata["id"]
        if doc_id not in existing_ids:
            new_docs.append(doc)
            ids.append(doc_id)
            
    if new_docs:
        try:
            vector_store.add_documents(documents=new_docs, ids=ids)
        except Exception as e:
            error_name = e.__class__.__name__
            error_text = str(e)
            if "APIKeyError" in error_name or "invalid_api_key" in error_text or "API_KEY_INVALID" in error_text or "400" in error_text or "403" in error_text or "API key" in error_text:
                logger.error("Gemini authentication failed while creating embeddings")
                raise ValueError("Gemini embeddings authentication failed")
            logger.error(f"Failed to add documents to vector store: {e}")
            raise
        return len(new_docs)
    return 0

def get_vector_count():
    try:
        vector_store = get_vector_store()
        return vector_store._collection.count()
    except Exception:
        return 0
