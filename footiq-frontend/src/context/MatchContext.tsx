import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { FeedMessage, PlayerCard, QueueItem } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8000";

type MatchContextValue = {
  matchId: string;
  setMatchId: (id: string) => void;
  feed: FeedMessage[];
  setFeed: (msgs: FeedMessage[]) => void;
  historyItems: FeedMessage[];
  players: PlayerCard[];
  queue: QueueItem[];
  error: string;
  uploading: boolean;
  querying: boolean;
  loadingPlayers: boolean;
  loadingHistory: boolean;
  onUploadFile: (file: File) => Promise<void>;
  sendQuery: (query: string) => Promise<void>;
  fetchPlayers: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearError: () => void;
  clearFeed: () => void;
};

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matchId, setMatchIdState] = useState<string>(
    () => localStorage.getItem("footiq_match_id") ?? ""
  );
  const [feed, setFeed] = useState<FeedMessage[]>([]);
  const [historyItems, setHistoryItems] = useState<FeedMessage[]>([]);
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const setMatchId = (id: string) => {
    localStorage.setItem("footiq_match_id", id);
    setMatchIdState(id);
  };

  const onUploadFile = async (file: File) => {
    if (!matchId.trim()) {
      setError("Enter Match ID before uploading.");
      return;
    }
    if (!file.name.endsWith(".json")) {
      setError("Only JSON files are supported.");
      return;
    }
    setError("");
    setUploading(true);
    setQueue([{ file: file.name, progress: 15, stage: "Uploading to secure node..." }]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      setQueue([{ file: file.name, progress: 45, stage: "Parsing event payload..." }]);
      const res = await fetch(`${API_BASE}/upload?match_id=${encodeURIComponent(matchId)}`, {
        method: "POST",
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || "Upload failed");
      setQueue([
        {
          file: file.name,
          progress: 100,
          stage: `Indexed ${payload.chunks_created} chunks from ${payload.events_loaded} events`,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setQueue([{ file: file.name, progress: 100, stage: "Upload aborted" }]);
    } finally {
      setUploading(false);
    }
  };

  const sendQuery = async (query: string) => {
    if (!query.trim()) return;
    setError("");
    setQuerying(true);
    try {
      const managerMsg: FeedMessage = {
        role: "manager",
        content: query.trim(),
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      };
      setFeed((prev) => [...prev, managerMsg]);
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query.trim(), match_id: matchId, top_k: 5 }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || "Query failed");
      const botMsg: FeedMessage = {
        role: "bot",
        content: payload.answer,
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      };
      setFeed((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setQuerying(false);
    }
  };

  const fetchPlayers = async () => {
    if (!matchId.trim()) {
      setError("Enter Match ID first.");
      return;
    }
    setError("");
    setLoadingPlayers(true);
    try {
      const res = await fetch(`${API_BASE}/players/${encodeURIComponent(matchId)}?limit=6`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || "Failed to load players");
      setPlayers(payload.players ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchHistory = async () => {
    setError("");
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/history?limit=20`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || "Failed to load history");
      const msgs: FeedMessage[] = (payload.items ?? []).flatMap(
        (item: { question: string; answer: string; timestamp_utc: string }) => {
          const time = new Date(item.timestamp_utc).toLocaleTimeString("en-GB", { hour12: false });
          return [
            { role: "manager" as const, content: item.question, time },
            { role: "bot" as const, content: item.answer, time },
          ];
        }
      );
      setHistoryItems(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <MatchContext.Provider
      value={{
        matchId,
        setMatchId,
        feed,
        setFeed,
        historyItems,
        players,
        queue,
        error,
        uploading,
        querying,
        loadingPlayers,
        loadingHistory,
        onUploadFile,
        sendQuery,
        fetchPlayers,
        fetchHistory,
        clearError: () => setError(""),
        clearFeed: () => setFeed([]),
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error("useMatch must be used inside MatchProvider");
  return ctx;
}
