"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav }  from "@/components/layout/TopNav";
import { SideNav } from "@/components/layout/SideNav";
import { useResearchStore, type HistoryEntry } from "@/lib/store/research.store";
import { EvidenceGradeBadge } from "@/components/research/EvidenceGradeBadge";

export default function HistoryPage() {
  const router  = useRouter();
  const history = useResearchStore(s => s.history);
  const clearHistory = useResearchStore(s => s.clearHistory);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load sessionStorage history into store on mount
    setMounted(true);
  }, []);

  const handleRerun = (entry: HistoryEntry) => {
    router.push(`/research/${encodeURIComponent(entry.query)}`);
  };

  return (
    <div className="min-h-screen" style={{ background:"var(--color-bg,#051424)" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>
      <TopNav/>
      <SideNav/>
      <main className="md:pl-64 mt-16 min-h-screen px-6 py-8 max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:"Space Grotesk", color:"#d4e4fa" }}>Research History</h1>
            <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>Your session queries — cleared when you close the browser.</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
              style={{ border:"1px solid rgba(255,180,171,0.3)", color:"#ffb4ab", fontFamily:"Space Grotesk" }}>
              Clear All
            </button>
          )}
        </div>

        {!mounted || history.length === 0 ? (
          <div className="glass-panel rounded-xl p-16 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize:"48px", color:"#3b494b" }}>history</span>
            <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>No research history yet. Run a query to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="glass-panel rounded-xl p-5 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
                onClick={() => handleRerun(entry)}>
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background:"rgba(0,240,255,0.1)", border:"1px solid rgba(0,240,255,0.2)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize:"20px", color:"var(--color-primary,#00f0ff)" }}>psychology</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>{entry.query}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color:"#849495" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                      <span className="text-xs" style={{ color:"#849495" }}>{entry.papers} papers</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <EvidenceGradeBadge grade={entry.grade as "High"|"Moderate"|"Low"|"Very Low"} showLabel={false} size="sm"/>
                  <span className="material-symbols-outlined" style={{ fontSize:"18px", color:"#3b494b" }}>arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
