import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="hud-grid min-h-screen bg-[#0c0f0f] text-[#e4f8ec]">
      {/* Fixed navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/5 bg-[#0c0f0f]/80 px-8 py-4 backdrop-blur-md">
        <span className="text-2xl font-semibold text-[#00ff41]">FootIQ</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="font-mono text-xs uppercase tracking-[0.18em] text-white/60 hover:text-white transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/coach")}
            className="font-mono text-xs uppercase tracking-[0.18em] text-white/60 hover:text-white transition"
          >
            AI Coach
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-md bg-[#00ff41] px-5 py-2 font-mono text-xs uppercase tracking-[0.18em] text-black transition hover:shadow-[0_0_24px_rgba(0,255,65,0.35)] active:scale-95"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-[600px] w-[600px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00ff41 0%, transparent 70%)" }}
          />
        </div>

        {/* Decorative pitch — rotated, low opacity */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-96 opacity-10 translate-x-16 translate-y-8 rotate-12">
          <svg viewBox="0 0 820 500" className="h-full w-full">
            <rect x="8" y="8" width="804" height="484" fill="none" stroke="#00ff41" strokeWidth="2" />
            <line x1="410" y1="8" x2="410" y2="492" stroke="#00ff41" strokeWidth="2" />
            <circle cx="410" cy="250" r="55" fill="none" stroke="#00ff41" strokeWidth="2" />
            <rect x="8" y="160" width="130" height="180" fill="none" stroke="#00ff41" strokeWidth="2" />
            <rect x="682" y="160" width="130" height="180" fill="none" stroke="#00ff41" strokeWidth="2" />
          </svg>
        </div>

        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-[#00d1ff]">
          Football Analytics Platform
        </p>
        <h1 className="mb-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
          Tactical Intelligence.
          <br />
          <span className="text-[#00ff41]">Real Match Data.</span>
        </h1>
        <p className="mb-10 max-w-xl font-mono text-sm leading-7 text-white/60">
          Upload StatsBomb JSON. Ask your AI coach anything. Get instant, accurate analysis of passes,
          shots, dribbles, duels — derived directly from your match events.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-[#00ff41] px-8 py-4 font-mono text-sm uppercase tracking-[0.2em] text-black transition hover:shadow-[0_0_36px_rgba(0,255,65,0.4)] active:scale-95"
          >
            Start Analyzing →
          </button>
          <button
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-lg border border-white/20 px-8 py-4 font-mono text-sm uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white active:scale-95"
          >
            See How It Works
          </button>
        </div>

        {/* Tech strip */}
        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
          StatsBomb JSON &nbsp;·&nbsp; Google Gemini &nbsp;·&nbsp; ChromaDB RAG &nbsp;·&nbsp; YOLOv8 Tracking
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-6 py-24">
        <p className="mb-3 text-center font-mono text-xs uppercase tracking-[0.3em] text-white/40">How It Works</p>
        <h2 className="mb-12 text-center text-3xl font-semibold text-white">
          Three steps to instant match intelligence
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            step="01"
            title="Upload"
            description="Drop any StatsBomb JSON file. FootIQ chunks it into 20-event windows, generates Gemini embeddings, and indexes everything in ChromaDB."
            accent="#00ff41"
          />
          <FeatureCard
            step="02"
            title="Query"
            description="Ask natural language questions. The RAG pipeline retrieves the most relevant match chunks and passes them to Gemini for a grounded, factual answer."
            accent="#00d1ff"
          />
          <FeatureCard
            step="03"
            title="Analyse"
            description="Load player cards showing real pass accuracy, shots, goals, dribbles, and duels — all computed from your uploaded event data, nothing fabricated."
            accent="#00ff41"
          />
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-white/5 px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-semibold text-white">Ready to analyse your match?</h2>
        <p className="mb-8 font-mono text-sm text-white/50">
          No account required. Upload a file and start asking questions immediately.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-[#00ff41] px-10 py-4 font-mono text-sm uppercase tracking-[0.2em] text-black transition hover:shadow-[0_0_36px_rgba(0,255,65,0.4)] active:scale-95"
        >
          Open Dashboard →
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <p className="font-mono text-xs text-white/25">
          © 2025 FootIQ &nbsp;·&nbsp; Built for coaches, scouts, and analysts
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  accent,
}: {
  step: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-6">
      <p className="mb-3 font-mono text-xs" style={{ color: accent }}>
        {step}
      </p>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="font-mono text-xs leading-6 text-white/55">{description}</p>
    </div>
  );
}
