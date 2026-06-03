import json
import os
import glob
from langchain_core.documents import Document
import logging

logger = logging.getLogger(__name__)

def read_events_from_file(file_path: str):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            events = json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Malformed JSON in file: {file_path}")
        return []
    return events if isinstance(events, list) else []

def parse_events_to_chunks(events: list, match_id: str):
    if not events:
        logger.warning(f"Match {match_id} has 0 events.")
        return []

    # Attempt to extract match details from the first few events if available
    # Often StatsBomb doesn't put team names in events directly in a clean way except via possession_team, etc.
    # We will do a generic parse
    match_name = f"Match {match_id}"
    home_team = "Unknown"
    away_team = "Unknown"

    # Try to find teams from the starting XI events
    starting_xis = [e for e in events if e.get('type', {}).get('name') == 'Starting XI']
    if len(starting_xis) >= 2:
        home_team = starting_xis[0].get('team', {}).get('name', 'Unknown')
        away_team = starting_xis[1].get('team', {}).get('name', 'Unknown')
        match_name = f"{home_team} vs {away_team}"

    chunks = []
    current_chunk_events = []
    chunk_index = 1

    for i, event in enumerate(events):
        minute = event.get('minute', 0)
        team = event.get('team', {}).get('name', 'Unknown')
        player = event.get('player', {}).get('name', 'Unknown player')
        event_type = event.get('type', {}).get('name', 'Unknown event')

        # Simple natural language conversion
        sentence = f"Minute {minute}: {player} ({team}) performed {event_type}."

        # Add more context for passes/shots if present
        if event_type == 'Pass':
            recipient = event.get('pass', {}).get('recipient', {}).get('name', 'unknown player')
            sentence = f"Minute {minute}: {player} ({team}) completed a pass to {recipient}."
        elif event_type == 'Shot':
            outcome = event.get('shot', {}).get('outcome', {}).get('name', 'unknown outcome')
            sentence = f"Minute {minute}: {player} ({team}) took a shot resulting in {outcome}."

        current_chunk_events.append((minute, sentence))

        if len(current_chunk_events) == 20 or i == len(events) - 1:
            minutes = [ev[0] for ev in current_chunk_events]
            minute_start = min(minutes) if minutes else 0
            minute_end = max(minutes) if minutes else 0

            doc_text = " ".join([ev[1] for ev in current_chunk_events])
            chunk_id = f"match_{match_id}_chunk_{chunk_index}"

            doc = Document(
                page_content=doc_text,
                metadata={
                    "id": chunk_id,
                    "match_id": str(match_id),
                    "match_name": match_name,
                    "chunk_index": chunk_index,
                    "minute_start": minute_start,
                    "minute_end": minute_end,
                    "home_team": home_team,
                    "away_team": away_team,
                }
            )
            chunks.append(doc)
            current_chunk_events = []
            chunk_index += 1

    return chunks

def parse_statsbomb_events(file_path: str):
    """Parses a StatsBomb JSON file into a list of Documents (chunks of 20 events)."""
    match_id = os.path.basename(file_path).split('.')[0]
    events = read_events_from_file(file_path)
    return parse_events_to_chunks(events=events, match_id=match_id)

def load_all_matches(data_dir: str):
    json_files = glob.glob(os.path.join(data_dir, "*.json"))
    if not json_files:
        logger.warning(f"No JSON files found in {data_dir}")
        return [], 0
        
    all_chunks = []
    matches_loaded = 0
    for file_path in json_files:
        chunks = parse_statsbomb_events(file_path)
        if chunks:
            all_chunks.extend(chunks)
            matches_loaded += 1
            
    return all_chunks, matches_loaded
