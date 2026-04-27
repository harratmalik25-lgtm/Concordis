"use client";
import { useEffect, useState } from "react";
import { TopNav }  from "@/components/layout/TopNav";
import { SideNav } from "@/components/layout/SideNav";
import { useResearchStore } from "@/lib/store/research.store";
import type { EvidenceGrade } from "@/lib/types/research.types";

const GRADE_COLOR: Record<EvidenceGrade, string> = {
  "High":     "#34d399",
  "Moderate": "#00f0ff",
  "Low":      "#fbbf24",
  "Very Low": "#ffb4ab",
};

export default function AnalyticsPage() {
  const history = useResearchStore(s => s.history);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalQueries   = history.length;
  const totalPapers    = history.reduce((sum, h) => sum + h.papers, 0);
  const avgPapers      = totalQueries ? Math.round(totalPapers / totalQueries) : 0;

  const gradeCounts = history.reduce<Record<string,number>>((acc, h) => {
    acc[h.grade] = (acc[h.grade] ?? 0) + 1;
    return acc;
  }, {});

  const recentActivity = history.slice(0, 7).map(h => ({
    label: h.query.slice(0, 28) + (h.query.length > 28 ? "…" : ""),
    papers: h.papers,
    grade:  h.grade as EvidenceGrade,
  }));

  const StatCard = ({ icon, label, value, sub }: { icon:string; label:string; value:string|number; sub?:string }) => (
    <div className="glass-panel rounded-xl p-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-1" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>
        <span className="material-symbols-outlined" style={{ fontSize:"16px", color:"var(--color-primary,#00f0ff)" }}>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ fontFamily:"Space Grotesk", color:"#d4e4fa" }}>{value}</div>
      {sub && <div className="text-xs" style={{ color:"#849495" }}>{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background:"var(--color-bg,#051424)" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>
      <TopNav/>
      <SideNav/>
      <main className="md:pl-64 mt-16 min-h-screen px-6 py-8 max-w-[1100px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:"Space Grotesk", color:"#d4e4fa" }}>Analytics</h1>
          <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>Session statistics for your research activity.</p>
        </div>

        {!mounted || totalQueries === 0 ? (
          <div className="glass-panel rounded-xl p-16 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize:"48px", color:"#3b494b" }}>analytics</span>
            <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>Run some queries to see your analytics.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="search"      label="Queries"      value={totalQueries} sub="this session"/>
              <StatCard icon="article"     label="Papers"       value={totalPapers}  sub="total analyzed"/>
              <StatCard icon="avg_pace"    label="Avg Papers"   value={avgPapers}    sub="per query"/>
              <StatCard icon="verified"    label="High Grade"   value={gradeCounts["High"] ?? 0} sub="high confidence"/>
            </div>

            {/* Grade breakdown */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Evidence Grade Breakdown</h2>
              <div className="flex flex-col gap-3">
                {(["High","Moderate","Low","Very Low"] as EvidenceGrade[]).map(grade => {
                  const count = gradeCounts[grade] ?? 0;
                  const pct   = totalQueries ? Math.round((count / totalQueries) * 100) : 0;
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <div className="w-24 text-xs shrink-0" style={{ color: GRADE_COLOR[grade], fontFamily:"Space Grotesk" }}>{grade}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${pct}%`, background: GRADE_COLOR[grade], boxShadow:`0 0 8px ${GRADE_COLOR[grade]}` }}/>
                      </div>
                      <div className="w-12 text-xs text-right shrink-0" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity bar chart */}
            {recentActivity.length > 0 && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Papers Per Query</h2>
                <div className="flex items-end gap-3" style={{ height:"140px" }}>
                  {recentActivity.map((item, i) => {
                    const maxP = Math.max(...recentActivity.map(r => r.papers), 1);
                    const h    = Math.round((item.papers / maxP) * 100);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>{item.papers}</span>
                        <div className="w-full rounded-t-md transition-all duration-700"
                          style={{ height:`${h}%`, background:`linear-gradient(to top, ${GRADE_COLOR[item.grade]}, ${GRADE_COLOR[item.grade]}88)`, boxShadow:`0 0 10px ${GRADE_COLOR[item.grade]}44` }}
                          title={item.label}/>
                        <span className="text-xs text-center truncate w-full" style={{ color:"#849495", fontSize:"10px" }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
