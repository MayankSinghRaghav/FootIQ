import { useMatch } from "../context/MatchContext";
import type { FeedMessage } from "../types";

export default function HistoryPage() {
  const { historyItems, fetchHistory, loadingHistory, error } = useMatch();

  // Group feed messages into Q&A pairs
  const pairs: Array<{ question: FeedMessage; answer: FeedMessage }> = [];
  for (let i = 0; i + 1 < historyItems.length; i += 2) {
    const q = historyItems[i];
    const a = historyItems[i + 1];
    if (q && a) pairs.push({ question: q, answer: a });
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Session History</h2>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">
            Previous Q&amp;A exchanges from this session
          </p>
        </div>
        <button
          onClick={() => void fetchHistory()}
          disabled={loadingHistory}
          className="rounded-md bg-[#00ff41] px-5 py-2 font-mono text-xs uppercase tracking-[0.18em] text-black transition hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] active:scale-95 disabled:opacity-60"
        >
          {loadingHistory ? "Loading..." : "Load History"}
        </button>
      </div>

      {error && <p className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-red-300">{error}</p>}

      {!historyItems.length && !loadingHistory && (
        <div className="glass-panel rounded-xl p-10 text-center">
          <p className="text-lg font-semibold text-white/60">No history yet</p>
          <p className="mt-2 font-mono text-xs text-white/40">
            Upload a match and ask questions on the Dashboard or AI Coach, then click "Load History" above.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {pairs.map(({ question, answer }, idx) => (
          <article key={idx} className="glass-panel rounded-xl p-5">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              <span className="text-[#00d1ff]">Q</span>
              <span>{question.time}</span>
            </div>
            <p className="mb-4 text-sm font-medium text-white/90">{question.content}</p>

            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              <span className="text-[#00ff41]">A</span>
              <span>{answer.time}</span>
            </div>
            <p className="text-sm leading-6 text-white/75">{answer.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
