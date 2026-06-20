import { useState, useRef, useEffect } from "react";
import { useMatch } from "../context/MatchContext";
import type { FeedMessage } from "../types";

export default function Coach() {
  const [queryInput, setQueryInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { matchId, setMatchId, feed, querying, sendQuery, clearFeed, error } = useMatch();

  const handleSend = async () => {
    if (!queryInput.trim() || querying) return;
    const q = queryInput;
    setQueryInput("");
    await sendQuery(q);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  return (
    <div className="flex h-screen flex-col px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">AI Coach</h2>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">
            Ask anything about your uploaded match data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="rounded-md border border-white/20 bg-black/30 px-3 py-2 font-mono text-xs tracking-[0.14em] text-white focus:border-[#00ff41]/50 focus:outline-none"
            placeholder="MATCH_ID (optional)"
          />
          <button
            onClick={clearFeed}
            className="rounded-md border border-white/20 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60 hover:border-red-400/40 hover:text-red-400 active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="glass-panel flex-1 overflow-y-auto rounded-xl p-5">
        {feed.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#00ff41]/30 bg-[#00ff41]/10">
              <span className="text-2xl font-bold text-[#00ff41]">IQ</span>
            </div>
            <p className="text-xl font-semibold text-white/80">Ready to analyse</p>
            <p className="max-w-sm font-mono text-xs text-white/50">
              Upload a StatsBomb JSON on the Dashboard, then ask about tactics, players, passing sequences, or
              anything else in the match data.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                "Who had the most shots?",
                "Which players completed the most dribbles?",
                "Summarize the first half events",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQueryInput(suggestion)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left font-mono text-xs text-white/60 hover:border-[#00ff41]/30 hover:text-white/80 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {feed.map((msg, idx) => (
            <ChatBubble key={`${msg.time}-${idx}`} msg={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-red-300">{error}</p>}

      {/* Input bar */}
      <div className="glass-panel mt-4 flex items-end gap-3 rounded-xl p-3">
        <textarea
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Ask your AI coach anything about the match..."
          rows={2}
          className="flex-1 resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00ff41]/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          onClick={() => void handleSend()}
          disabled={querying || !queryInput.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00ff41] font-mono text-black transition hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] active:scale-95 disabled:opacity-40"
        >
          {querying ? (
            <span className="animate-pulse text-xs">...</span>
          ) : (
            <span className="text-lg font-bold">↑</span>
          )}
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] text-white/30">
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  );
}

function ChatBubble({ msg }: { msg: FeedMessage }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isBot
            ? "rounded-tl-sm border border-[#00ff41]/25 bg-[#00ff41]/8 text-white/90"
            : "rounded-tr-sm border border-[#00d1ff]/25 bg-[#00d1ff]/8 text-white/90"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">
          <span>{isBot ? "FootIQ Bot" : "You"}</span>
          <span>·</span>
          <span>{msg.time}</span>
        </div>
        <p className="text-sm leading-6 whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}
