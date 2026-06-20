import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, BrainCircuit, History, Waves } from "lucide-react";

const navItems = [
  { label: "Match Analysis", icon: BrainCircuit, to: "/dashboard" },
  { label: "AI Coach", icon: Waves, to: "/coach" },
  { label: "History", icon: History, to: "/history" },
  { label: "Settings", icon: Activity, to: "/settings" },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="hud-grid min-h-screen bg-[#0c0f0f] text-[#e4f8ec]">
      <div className="flex min-h-screen">
        <aside className="glass-panel w-64 shrink-0 border-l-0 border-t-0 border-b-0 px-4 py-6">
          <div className="mb-8 border-b border-white/10 pb-4">
            <h1
              className="cursor-pointer text-3xl font-semibold text-[#00ff41]"
              onClick={() => navigate("/")}
            >
              FootIQ
            </h1>
            <p className="mt-1 font-mono text-xs tracking-[0.24em] text-white/70">ELITE COMMAND</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left font-mono text-xs uppercase tracking-[0.18em] transition active:scale-95 ${
                    isActive
                      ? "bg-[#00ff41]/15 text-[#00ff41]"
                      : "text-white/70 hover:bg-[#00ff41]/5"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 w-full rounded-md bg-[#00ff41] px-3 py-3 font-mono text-xs uppercase tracking-[0.18em] text-black transition hover:shadow-[0_0_28px_rgba(0,255,65,0.3)] active:scale-95"
          >
            + New Analysis
          </button>
        </aside>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
