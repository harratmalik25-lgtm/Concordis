"use client";
import { useEffect, useState } from "react";
import { TopNav }  from "@/components/layout/TopNav";
import { SideNav } from "@/components/layout/SideNav";
import { useResearchStore } from "@/lib/store/research.store";
import { EvidenceGradeBadge } from "@/components/research/EvidenceGradeBadge";
import type { PaperAnalysis } from "@/lib/types/research.types";

export default function SourcesPage() {
  const history = useResearchStore(s => s.history);
  const [mounted, setMounted]   = useState(false);
  const [filter, setFilter]     = useState<string>("All");
  const [search, setSearch]     = useState("");

  useEffect(() => setMounted(true), []);

  const allPapers: (PaperAnalysis & { query: string })[] = history.flatMap(h =>
    h.consensus.papers.map(p => ({ ...p, query: h.query }))
  );

  const dedupedPapers = allPapers.filter((p, i, arr) =>
    arr.findIndex(x => x.doi === p.doi && x.doi !== "N/A") === i
  );

  const grades = ["All", "High", "Moderate", "Low", "Very Low"];

  const filtered = dedupedPapers
    .filter(p => filter === "All" || p.grade === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.journal.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background:"var(--color-bg,#051424)" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>
      <TopNav/>
      <SideNav/>
      <main className="md:pl-64 mt-16 min-h-screen px-6 py-8 max-w-[1100px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:"Space Grotesk", color:"#d4e4fa" }}>Verified Sources</h1>
          <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>All papers retrieved and analyzed in this session.</p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ fontSize:"18px", color:"#849495" }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search papers…"
              className="w-full py-2.5 pl-10 pr-4 rounded-lg text-sm focus:outline-none"
              style={{ background:"#0d1c2d", border:"1px solid #3b494b", color:"#d4e4fa", fontFamily:"Inter" }}/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {grades.map(g => (
              <button key={g} onClick={() => setFilter(g)}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  fontFamily: "Space Grotesk",
                  background: filter === g ? "var(--color-primary,#00f0ff)" : "rgba(18,33,49,0.6)",
                  color:      filter === g ? "#002022" : "#849495",
                  border:     `1px solid ${filter === g ? "var(--color-primary,#00f0ff)" : "#3b494b"}`,
                }}>{g}</button>
            ))}
          </div>
        </div>

        {!mounted || filtered.length === 0 ? (
          <div className="glass-panel rounded-xl p-16 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize:"48px", color:"#3b494b" }}>library_books</span>
            <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>
              {dedupedPapers.length === 0 ? "No sources yet — run a query first." : "No papers match your filter."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs mb-2" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>{filtered.length} paper{filtered.length !== 1 ? "s" : ""}</p>
            {filtered.map((p, i) => (
              <div key={i} className="glass-panel rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay:`${i*30}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium leading-snug mb-1" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>{p.title}</h3>
                    <p className="text-xs" style={{ color:"#849495" }}>{p.journal} · {p.year} · {p.studyType}</p>
                  </div>
                  <EvidenceGradeBadge grade={p.grade} size="sm" showLabel={false}/>
                </div>
                <p className="text-xs" style={{ color:"#b9cacb", fontFamily:"Inter" }}>{p.primaryClaim}</p>
                <div className="flex items-center gap-4 mt-1">
                  {p.sampleSize && <span className="text-xs" style={{ color:"#849495" }}>n={p.sampleSize.toLocaleString()}</span>}
                  {p.effectSize && <span className="text-xs px-2 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.05)", color:"#7df4ff", fontFamily:"monospace" }}>{p.effectSize}</span>}
                  {p.doi !== "N/A" && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 hover:underline"
                      style={{ color:"var(--color-primary,#00f0ff)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize:"13px" }}>open_in_new</span>DOI
                    </a>
                  )}
                  <span className="text-xs ml-auto" style={{ color:"#3b494b", fontFamily:"Space Grotesk" }}>via: {p.query.slice(0,30)}…</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
