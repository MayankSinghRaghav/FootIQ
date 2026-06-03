# FootIQ Edge Cases

Track all product and technical edge cases here.

## Data Ingestion

- Empty JSON upload
- Malformed JSON upload
- Non-StatsBomb schema input
- Duplicate match upload
- Match with zero events

## Query / RAG

- Query when vector DB is empty
- Query for unknown `match_id`
- Query requiring unavailable stats
- Hallucination risk on weak retrieval
- Very long / noisy user questions

## Player Reports

- Player not found in selected match
- Missing fields in event objects
- Inconsistent team/player naming

## API / Runtime

- Missing API keys in `.env`
- LLM provider timeout / failure
- ChromaDB unavailable or corrupted
- Cold start with no sample data

## UI / UX

- Empty state before first upload
- Slow response (>5s) handling
- Partial result / retry behavior
