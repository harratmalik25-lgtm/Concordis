"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useResearchStore } from "@/lib/store/research.store";

const NAV = [
  { icon: "analytics",   label: "Workspace",       href: "/" },
  { icon: "history",     label: "History",          href: "/history" },
  { icon: "verified",    label: "Verified Sources", href: "/sources" },
  { icon: "query_stats", label: "Analytics",        href: "/analytics" },
];

export function SideNav() {
  const path   = usePathname();
  const router = useRouter();
  const reset  = useResearchStore(s => s.reset);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 w-64 py-6 hidden md:flex flex-col"
      style={{ background:"rgba(5,20,36,0.7)", backdropFilter:"blur(24px)", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style={{ background:"#1c2b3c" }}>
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize:"20px" }}>person</span>
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ fontFamily:"Space Grotesk", color:"var(--color-primary,#00f0ff)" }}>Researcher</div>
          <div className="text-xs" style={{ color:"#b9cacb" }}>Concordis Pro</div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <button onClick={() => { reset(); router.push("/"); }}
          className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold neon-glow transition-all hover:brightness-110 active:scale-95"
          style={{ background:`linear-gradient(to right, var(--color-primary,#00f0ff), var(--color-secondary,#571bc1))`, color:"#002022", fontFamily:"Space Grotesk" }}>
          <span className="material-symbols-outlined" style={{ fontSize:"18px" }}>add</span> New Exploration
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV.map(item => {
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-l-lg`}
              style={{
                textDecoration: "none",
                color:       active ? "var(--color-primary,#00f0ff)" : "#64748b",
                background:  active ? "rgba(0,240,255,0.08)" : "transparent",
                borderRight: active ? "3px solid var(--color-primary,#00f0ff)" : "3px solid transparent",
                fontFamily:  "Space Grotesk",
              }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg hover:bg-white/5"
          style={{ textDecoration:"none", color:"#64748b", fontFamily:"Space Grotesk" }}>
          <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>settings</span> Settings
        </Link>
      </div>
    </aside>
  );
}
