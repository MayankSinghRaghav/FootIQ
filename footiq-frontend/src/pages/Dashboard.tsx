import { useState } from "react";
import { Shield, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMatch } from "../context/MatchContext";
import { PlayerCard } from "../components/PlayerCard";
import type { FeedMessage } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [queryInput, setQueryInput] = useState("");

  const {
    matchId,
    setMatchId,
    feed,
    queue,
    players,
    error,
    uploading,
    querying,
    loadingPlayers,
    loadingHistory,
    onUploadFile,
    sendQuery,
    fetchPlayers,
    fetchHistory,
  } = useMatch();

  const handleSend = async () => {
    if (!queryInput.trim() || querying) return;
    const q = queryInput;
    setQueryInput("");
    await sendQuery(q);
  };

  return (
    <div className="px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold">Tactical View</h2>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">[ACTIVE_LISTENING_V4.2]</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            onClick={() => navigate("/coach")}
            className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#00ff41] hover:bg-[#00ff41]/5 active:scale-95"
          >
            Connect AI
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* Upload zone */}
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
                if (file) void onUploadFile(file);
              }}
              className="mt-6 flex justify-center gap-2"
            >
              <label className="cursor-pointer rounded-md bg-[#00ff41] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black hover:shadow-[0_0_28px_rgba(0,255,65,0.3)] active:scale-95">
                Browse Files
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUploadFile(file);
                  }}
                />
              </label>
            </div>
            {uploading && <p className="mt-3 font-mono text-xs text-[#00ff41]">Uploading and indexing...</p>}
          </div>
        </section>

        {/* Processing queue */}
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
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00ff41] to-[#00d1ff]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-xs text-white/65">{item.stage}</p>
              </div>
            ))}
            {!queue.length && (
              <div className="rounded-md border border-white/10 bg-black/40 p-3">
                <p className="font-mono text-xs text-white/60">No active jobs. Upload a match JSON to begin.</p>
              </div>
            )}
          </div>
        </section>

        {/* Tactical pitch visualizer */}
        <section className="glass-panel col-span-7 rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Tactical Pitch Visualizer</h3>
            <span className="rounded border border-white/20 px-3 py-1 font-mono text-xs uppercase text-white/40">
              Pitch View
            </span>
          </div>
          <div className="relative h-80 rounded-lg border border-[#00ff41]/25 bg-[#021508]">
            <svg viewBox="0 0 820 500" className="h-full w-full">
              <defs>
                <radialGradient id="dashHeatA" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00ff41" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="8" y="8" width="804" height="484" fill="none" stroke="rgba(255,255,255,0.25)" />
              <line x1="410" y1="8" x2="410" y2="492" stroke="rgba(255,255,255,0.25)" />
              <circle cx="410" cy="250" r="55" fill="none" stroke="rgba(255,255,255,0.25)" />
              <rect x="8" y="160" width="130" height="180" fill="none" stroke="rgba(255,255,255,0.25)" />
              <rect x="682" y="160" width="130" height="180" fill="none" stroke="rgba(255,255,255,0.25)" />
              <circle cx="240" cy="135" r="74" fill="url(#dashHeatA)" />
              <circle cx="505" cy="290" r="96" fill="url(#dashHeatA)" />
              <line x1="160" y1="120" x2="270" y2="180" stroke="#00d1ff" strokeWidth="2" />
              <line x1="470" y1="300" x2="620" y2="220" stroke="#00d1ff" strokeWidth="2" />
            </svg>
          </div>
        </section>

        {/* Match Q&A */}
        <section className="glass-panel col-span-3 rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00ff41]">Match Q&amp;A</h3>
            <Waves size={14} className="text-[#00d1ff]" />
          </div>
          <FeedList feed={feed} />
          <div className="mt-3 flex gap-2">
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask AI..."
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-white/40 focus:border-[#00ff41]/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSend();
              }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={querying}
              className="rounded border border-white/20 px-3 py-2 font-mono text-sm text-[#00ff41] hover:bg-[#00ff41]/5 active:scale-95 disabled:opacity-60"
            >
              →
            </button>
          </div>
        </section>

        {/* Live alerts placeholder */}
        <section className="glass-panel col-span-2 rounded-xl p-4">
          <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Live Alerts</h3>
          <div className="space-y-3">
            <div className="rounded border border-white/10 bg-black/40 p-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">No alerts yet</p>
              <p className="mt-1 text-xs text-white/60">Alerts will appear as you query match data.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Player cards */}
      <section className="mt-4 grid grid-cols-3 gap-4">
        {players.map((player, i) => (
          <PlayerCard key={player.player_name} player={player} index={i} />
        ))}
        {!players.length && (
          <article className="glass-panel col-span-3 rounded-xl p-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">
              No player cards loaded. Set Match ID and click "Load Squad".
            </p>
          </article>
        )}
      </section>

      {error && <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-red-300">{error}</p>}
    </div>
  );
}

function FeedList({ feed }: { feed: FeedMessage[] }) {
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto">
      {feed.length === 0 && (
        <div className="rounded-md border border-white/10 bg-black/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
            Upload a match JSON and ask a question to begin.
          </p>
        </div>
      )}
      {feed.map((msg, idx) => (
        <div
          key={`${msg.time}-${idx}`}
          className={`rounded-md border p-2 ${
            msg.role === "bot" ? "border-[#00ff41]/35 bg-[#00ff41]/10" : "border-[#00d1ff]/35 bg-[#00d1ff]/10"
          }`}
        >
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.15em]">
            <span>{msg.role === "bot" ? "FootIQ Bot" : "Manager"}</span>
            <span className="text-white/50">{msg.time}</span>
          </div>
          <p className="text-xs leading-5 text-white/90">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
