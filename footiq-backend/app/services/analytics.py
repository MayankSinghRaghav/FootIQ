from typing import Dict, List


def _safe_player_name(event: dict) -> str:
    return event.get("player", {}).get("name", "Unknown player")


def _safe_team_name(event: dict) -> str:
    return event.get("team", {}).get("name", "Unknown")


def build_player_summaries(events: List[dict]) -> List[dict]:
    player_stats: Dict[str, dict] = {}

    for event in events:
        event_type = event.get("type", {}).get("name", "")
        player_name = _safe_player_name(event)
        team_name = _safe_team_name(event)

        if player_name not in player_stats:
            player_stats[player_name] = {
                "player_name": player_name,
                "team_name": team_name,
                "passes": 0,
                "pass_success": 0,
                "shots": 0,
                "goals": 0,
                "dribbles_completed": 0,
                "duels_won": 0,
                "duels_lost": 0,
                "fouls_committed": 0,
                "fouls_won": 0,
            }

        p = player_stats[player_name]

        if event_type == "Pass":
            p["passes"] += 1
            outcome = event.get("pass", {}).get("outcome", {}).get("name")
            if not outcome:
                p["pass_success"] += 1
        elif event_type == "Shot":
            p["shots"] += 1
            outcome = event.get("shot", {}).get("outcome", {}).get("name", "")
            if outcome.lower() == "goal":
                p["goals"] += 1
        elif event_type == "Dribble":
            outcome = event.get("dribble", {}).get("outcome", {}).get("name", "")
            if outcome.lower() == "complete":
                p["dribbles_completed"] += 1
        elif event_type == "Duel":
            duel_outcome = event.get("duel", {}).get("outcome", {}).get("name", "")
            if duel_outcome.lower() in {"won", "success in play", "success out"}:
                p["duels_won"] += 1
            elif duel_outcome:
                p["duels_lost"] += 1
        elif event_type == "Foul Committed":
            p["fouls_committed"] += 1
        elif event_type == "Foul Won":
            p["fouls_won"] += 1

    summaries = []
    for payload in player_stats.values():
        passes = payload.pop("pass_success")
        total_passes = payload["passes"]
        payload["pass_accuracy"] = round((passes / total_passes) * 100, 2) if total_passes else 0.0
        summaries.append(payload)

    summaries.sort(key=lambda x: (x["goals"], x["shots"], x["passes"]), reverse=True)
    return summaries


def build_player_narrative(player_summary: dict) -> str:
    return (
        f"{player_summary['player_name']} ({player_summary['team_name']}) attempted "
        f"{player_summary['passes']} passes at {player_summary['pass_accuracy']}% accuracy "
        f"and took {player_summary['shots']} shots with {player_summary['goals']} goals. "
        f"They completed {player_summary['dribbles_completed']} dribbles and finished with "
        f"{player_summary['duels_won']} duel wins."
    )
