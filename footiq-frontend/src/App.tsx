import { useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  ChevronRight,
  CircleDot,
  History,
  Shield,
  Swords,
  Waves,
} from "lucide-react";

type QueueItem = {
  file: string;
  progress: number;
  stage: string;
};

type FeedMessage = {
  role: "bot" | "manager";
  content: string;
  time: string;
};

type PlayerCard = {
  player_name: string;
  team_name: string;
  passes: number;
  pass_accuracy: number;
  shots: number;
  goals: number;
  dribbles_completed: number;
  duels_won: number;
  duels_lost: number;
  fouls_committed: number;
  fouls_won: number;
};

const defaultFeed: FeedMessage[] = [
  {
    role: "bot",
    content: "Observation: Opponent is exploiting the wide-left channel. Shift block deeper.",
    time: "12:44:02",
  },
  {
    role: "manager",
    content: "Show me touches by #11 in Zone 4 during the last 15 minutes.",
    time: "12:44:15",
  },
  {
    role: "bot",
    content: "Heatmap generated. 72% of touches occurred in Zone 4. High threat level detected.",
    time: "12:44:20",
  },
];

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8000";

function Radar({ stats, color }: { stats: [number, number, number, number, number]; color: string }) {
  const points = useMemo(() => {
    const center = 55;
    const radius = 38;
    return stats
      .map((val, i) => {
        const angle = ((Math.PI * 2) / stats.length) * i - Math.PI / 2;
        const r = (val / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  }, [stats]);

  return (
    <svg viewBox="0 0 110 110" className="h-24 w-24">
      <polygon points="55,10 95,37 80,92 30,92 15,37" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <polygon points={points} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function App() {
  const [matchId, setMatchId] = useState("3788741");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [feed, setFeed] = useState<FeedMessage[]>(defaultFeed);
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [error, setError] = useState("");

  const nav = [
    { label: "Command Center", icon: Activity },
    { label: "Match Analysis", icon: BrainCircuit, active: true },
    { label: "Tactical Board", icon: Swords },
    { label: "History", icon: History },
  ];

  const mapPlayerToRadar = (player: PlayerCard): [number, number, number, number, number] => {
    const pace = Math.min(100, 45 + player.dribbles_completed * 6);
    const passing = Math.min(100, player.pass_accuracy);
    const duels = Math.min(100, 35 + player.duels_won * 8);
    const attack = Math.min(100, 50 + player.shots * 8 + player.goals * 12);
    const control = Math.min(100, 50 + player.passes * 2);
    return [pace, passing, duels, attack, control];
  };

  const onUploadFile = async (file: File) => {
    if (!matchId.trim()) {
      setError("Enter Match ID before upload.");
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
      if (!res.ok) {
        throw new Error(payload.detail || "Upload failed");
      }

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

  const sendQuery = async () => {
    if (!query.trim()) {
      return;
    }
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
      if (!res.ok) {
        throw new Error(payload.detail || "Query failed");
      }

      const botMsg: FeedMessage = {
        role: "bot",
        content: payload.answer,
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      };
      setFeed((prev) => [...prev, botMsg]);
      setQuery("");
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
      if (!res.ok) {
        throw new Error(payload.detail || "Failed to load players");
      }
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
      const res = await fetch(`${API_BASE}/history?limit=6`);
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.detail || "Failed to load history");
      }

      const historyMessages: FeedMessage[] = (payload.items ?? []).flatMap(
        (item: { question: string; answer: string; timestamp_utc: string }) => {
          const time = new Date(item.timestamp_utc).toLocaleTimeString("en-GB", { hour12: false });
          return [
            { role: "manager" as const, content: item.question, time },
            { role: "bot" as const, content: item.answer, time },
          ];
        }
      );
      if (historyMessages.length) {
        setFeed(historyMessages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="hud-grid min-h-screen bg-[#0c0f0f] text-[#e4f8ec]">
      <div className="flex min-h-screen">
        <aside className="glass-panel w-64 shrink-0 border-l-0 border-t-0 border-b-0 px-4 py-6">
          <div className="mb-8 border-b border-white/10 pb-4">
            <h1 className="text-3xl font-semibold text-[#00ff41]">FootIQ</h1>
            <p className="mt-1 font-mono text-xs tracking-[0.24em] text-white/70">ELITE COMMAND</p>
          </div>

          <nav className="space-y-2">
            {nav.map((item) => (
              <button
                key={item.label}
                className={`group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left font-mono text-xs uppercase tracking-[0.18em] transition active:scale-95 ${
                  item.active ? "bg-[#00ff41]/15 text-[#00ff41]" : "hover:bg-[#00ff41]/5 text-white/70"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          <button className="mt-8 w-full rounded-md bg-[#00ff41] px-3 py-3 font-mono text-xs uppercase tracking-[0.18em] text-black transition hover:shadow-[0_0_28px_rgba(0,255,65,0.3)] active:scale-95">
            + New Analysis
          </button>
        </aside>

        <main className="flex-1 px-6 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Tactical View</h2>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">[ACTIVE_LISTENING_V4.2]</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="rounded-md border border-white/20 bg-black/30 px-3 py-2 font-mono text-xs tracking-[0.14em] text-white focus:border-[#00ff41]/50 focus:outline-none"
                placeholder="MATCH_ID"
              />
              <button
                onClick={fetchPlayers}
                disabled={loadingPlayers}
                className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#00d1ff] hover:bg-[#00d1ff]/5 active:scale-95 disabled:opacity-60"
              >
                {loadingPlayers ? "Loading..." : "Load Squad"}
              </button>
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#00ff41] hover:bg-[#00ff41]/5 active:scale-95 disabled:opacity-60"
              >
                {loadingHistory ? "Syncing..." : "Sync Feed"}
              </button>
            </div>
            <button className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#00ff41] hover:bg-[#00ff41]/5 active:scale-95">
              Connect AI
            </button>
          </header>

          <div className="grid grid-cols-12 gap-4">
            <section className="glass-panel col-span-7 rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00ff41]">[Secure_Upload_Node_01]</h3>
                <Shield size={18} className="text-[#00d1ff]" />
              </div>
              <div className="rounded-lg border border-dashed border-[#00ff41]/40 bg-black/35 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-lg border border-[#00ff41]/40 bg-[#00ff41]/10">
                  <Shield className="text-[#00ff41]" />
                </div>
                <p className="text-3xl font-semibold">Initialize StatsBomb Stream</p>
                <p className="mt-3 font-mono text-sm text-white/70">
                  Drop JSON files here. FootIQ will parse, vectorize, and index tactical chunks.
                </p>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      void onUploadFile(file);
                    }
                  }}
                  className="mt-6 flex justify-center gap-2"
                >
                  <button className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/5 active:scale-95">
                    Ctrl + V
                  </button>
                  <label className="cursor-pointer rounded-md bg-[#00ff41] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black hover:shadow-[0_0_28px_rgba(0,255,65,0.3)] active:scale-95">
                    Browse Files
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void onUploadFile(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {uploading ? <p className="mt-3 font-mono text-xs text-[#00ff41]">Uploading and indexing...</p> : null}
              </div>
            </section>

            <section className="glass-panel col-span-5 rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Processing Queue</h3>
                <span className="font-mono text-xs text-[#00ff41]">{queue.length} Active</span>
              </div>
              <div className="space-y-4">
                {queue.map((item) => (
                  <div key={item.file} className="rounded-md border border-white/10 bg-black/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-mono text-xs uppercase tracking-[0.13em] text-white/80">{item.file}</p>
                      <p className="font-mono text-xs text-[#00ff41]">{item.progress}%</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#00ff41] to-[#00d1ff]" style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-white/65">{item.stage}</p>
                  </div>
                ))}
                {!queue.length ? (
                  <div className="rounded-md border border-white/10 bg-black/40 p-3">
                    <p className="font-mono text-xs text-white/60">No active jobs. Upload a match JSON to begin.</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="glass-panel col-span-7 rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Tactical Pitch Visualizer</h3>
                <div className="flex gap-2 font-mono text-xs uppercase">
                  <span className="rounded border border-white/20 px-3 py-1">4-3-3 Attack</span>
                  <span className="rounded border border-white/20 px-3 py-1">High Press</span>
                </div>
              </div>
              <div className="relative h-80 rounded-lg border border-[#00ff41]/25 bg-[#021508]">
                <svg viewBox="0 0 820 500" className="h-full w-full">
                  <defs>
                    <radialGradient id="heatA" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect x="8" y="8" width="804" height="484" fill="none" stroke="rgba(255,255,255,0.25)" />
                  <line x1="410" y1="8" x2="410" y2="492" stroke="rgba(255,255,255,0.25)" />
                  <circle cx="410" cy="250" r="55" fill="none" stroke="rgba(255,255,255,0.25)" />
                  <rect x="8" y="160" width="130" height="180" fill="none" stroke="rgba(255,255,255,0.25)" />
                  <rect x="682" y="160" width="130" height="180" fill="none" stroke="rgba(255,255,255,0.25)" />
                  <circle cx="240" cy="135" r="74" fill="url(#heatA)" />
                  <circle cx="505" cy="290" r="96" fill="url(#heatA)" />
                  <line x1="160" y1="120" x2="270" y2="180" stroke="#00d1ff" strokeWidth="2" />
                  <line x1="470" y1="300" x2="620" y2="220" stroke="#00d1ff" strokeWidth="2" />
                </svg>
                <div className="absolute left-4 top-4 rounded border border-white/20 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                  Sprint: 34.2 km/h
                </div>
              </div>
            </section>

            <section className="glass-panel col-span-3 rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00ff41]">Match Q&A</h3>
                <Waves size={14} className="text-[#00d1ff]" />
              </div>
              <div className="space-y-3">
                {feed.map((msg, idx) => (
                  <div
                    key={`${msg.time}-${idx}`}
                    className={`rounded-md border p-3 ${
                      msg.role === "bot"
                        ? "border-[#00ff41]/35 bg-[#00ff41]/10"
                        : "border-[#00d1ff]/35 bg-[#00d1ff]/10"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em]">
                      <span>{msg.role === "bot" ? "FootIQ Bot" : "Manager"}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-sm leading-6 text-white/90">{msg.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI..."
                  className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-white/40 focus:border-[#00ff41]/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void sendQuery();
                    }
                  }}
                />
                <button
                  onClick={sendQuery}
                  disabled={querying}
                  className="rounded border border-white/20 px-3 py-2 text-[#00ff41] hover:bg-[#00ff41]/5 active:scale-95 disabled:opacity-60"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="glass-panel col-span-2 rounded-xl p-4">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Live Alerts</h3>
              <div className="space-y-3">
                {["Stamina drop on LB", "Press trigger effective", "Set-piece xG +0.18"].map((alert, idx) => (
                  <div key={alert} className="rounded border border-white/10 bg-black/40 p-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{42 - idx * 6}'</p>
                    <p className="mt-1 text-xs text-white/90">{alert}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-4 grid grid-cols-3 gap-4">
            {players.map((player, i) => (
              <article key={player.player_name} className="glass-panel rounded-xl p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xl font-semibold uppercase">{player.player_name}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/65">
                      {player.team_name}
                    </p>
                  </div>
                  <span className="rounded bg-[#00ff41]/15 px-2 py-1 font-mono text-xs text-[#00ff41]">
                    {(player.pass_accuracy / 10).toFixed(1)}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <div className="h-24 w-24 rounded bg-gradient-to-b from-white/30 to-white/5" />
                  <Radar stats={mapPlayerToRadar(player)} color={i === 1 ? "#00d1ff" : "#00ff41"} />
                </div>

                <div className="mb-2 flex items-center gap-2 text-[#00d1ff]">
                  <CircleDot size={14} />
                  <p className="font-mono text-xs uppercase tracking-[0.16em]">AI Insight</p>
                </div>
                <p className="text-sm leading-6 text-white/80">
                  Completed {player.passes} passes at {player.pass_accuracy}% accuracy with {player.shots} shots,{" "}
                  {player.goals} goals, and duel output {player.duels_won}/{player.duels_lost}.
                </p>
              </article>
            ))}
            {!players.length ? (
              <article className="glass-panel col-span-3 rounded-xl p-4">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">
                  No player cards loaded. Set Match ID and click "Load Squad".
                </p>
              </article>
            ) : null}
          </section>
          {error ? <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-red-300">{error}</p> : null}
        </main>
      </div>
    </div>
  );
}
