# FootIQ Backend (Phase 2)

FootIQ is an AI Copilot for football coaches. This backend provides a FastAPI server with a RAG pipeline so coaches can ask plain-English questions about football match data.

## Features
- FastAPI backend
- RAG Pipeline with LangChain and ChromaDB
- Local vector database
- Embeddings via OpenAI `text-embedding-3-small`
- LLM powered by Groq `llama-3.1-8b-instant`

## Setup

1. **Install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   Edit the `.env` file and add your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Add Data:**
   Place StatsBomb match JSON files inside the `data/` directory.

4. **Run the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Ingest Match Data from `data/` folder
```bash
curl -X POST http://localhost:8000/ingest
```

### 3. Upload Match JSON (single match)
```bash
curl -X POST "http://localhost:8000/upload?match_id=3788741" \
  -F "file=@data/3788741.json"
```

### 4. Ask a Question
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How many passes did Barcelona complete?", "match_id": "3788741"}'
```

### 5. Player Summaries by Match
```bash
curl "http://localhost:8000/players/3788741"
```

### 6. Player Narrative
```bash
curl "http://localhost:8000/players/3788741/Lionel%20Messi"
```

### 7. Session Query History
```bash
curl "http://localhost:8000/history?limit=25"
```
