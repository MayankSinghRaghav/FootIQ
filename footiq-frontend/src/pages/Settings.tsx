import { useState, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8000";

type HealthResponse = {
  status: string;
  chroma_connected?: boolean;
  vector_count: number;
  collections: string[];
};

export default function Settings() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthRaw, setHealthRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [healthError, setHealthError] = useState("");

  const runHealthCheck = async () => {
    setLoading(true);
    setHealthError("");
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data: HealthResponse = await res.json();
      setHealth(data);
      setHealthRaw(JSON.stringify(data, null, 2));
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : "Health check failed");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    void runHealthCheck();
  }, []);

  const statusColor = health?.status === "ok" ? "text-[#00ff41]" : health ? "text-yellow-400" : "text-white/40";

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold">Configuration</h2>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">
          Environment and backend connectivity
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* API config */}
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">API Configuration</h3>
          <dl className="space-y-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Backend URL</dt>
              <dd className="mt-1 rounded bg-black/40 px-3 py-2 font-mono text-xs text-[#00ff41]">{API_BASE}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Environment</dt>
              <dd className="mt-1 font-mono text-xs text-white/70">
                {import.meta.env.PROD ? "Production" : "Development"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Health status */}
        <section className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Backend Health</h3>
            <button
              onClick={() => void runHealthCheck()}
              disabled={loading}
              className="rounded border border-white/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 hover:border-[#00ff41]/40 hover:text-[#00ff41] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {healthError && (
            <p className="mb-3 font-mono text-xs text-red-400">
              Could not reach backend: {healthError}
            </p>
          )}

          {health && (
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Status</dt>
                <dd className={`mt-1 font-mono text-sm font-semibold uppercase ${statusColor}`}>
                  {health.status}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">ChromaDB</dt>
                <dd className={`mt-1 font-mono text-xs ${health.chroma_connected ? "text-[#00ff41]" : "text-yellow-400"}`}>
                  {health.chroma_connected === undefined ? "Unknown" : health.chroma_connected ? "Connected" : "Disconnected"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Indexed Vectors</dt>
                <dd className="mt-1 font-mono text-xs text-white/80">{health.vector_count.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Collections</dt>
                <dd className="mt-1 font-mono text-xs text-white/80">
                  {health.collections.length ? health.collections.join(", ") : "None"}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Raw response */}
        {healthRaw && (
          <section className="glass-panel col-span-2 rounded-xl p-5">
            <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Raw Health Response</h3>
            <pre className="overflow-x-auto rounded bg-black/50 px-4 py-3 font-mono text-xs text-[#00ff41]">
              {healthRaw}
            </pre>
          </section>
        )}

        {/* Setup instructions */}
        <section className="glass-panel col-span-2 rounded-xl p-5">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#00d1ff]">Setup</h3>
          <div className="space-y-2 font-mono text-xs text-white/60">
            <p>
              <span className="text-white/40">Backend env vars:</span> Set{" "}
              <code className="text-[#00ff41]">GEMINI_API_KEY</code> and{" "}
              <code className="text-[#00ff41]">ALLOWED_ORIGINS</code> on your Render service.
            </p>
            <p>
              <span className="text-white/40">Frontend env vars:</span> Set{" "}
              <code className="text-[#00ff41]">VITE_API_BASE</code> to your Render backend URL on Vercel.
            </p>
            <p>
              <span className="text-white/40">Data:</span> Upload StatsBomb JSON files on the{" "}
              <a className="text-[#00d1ff] underline" href="/dashboard">
                Dashboard
              </a>
              . ChromaDB stores embeddings on disk (lost on Render free-tier restart — upgrade for persistence).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
