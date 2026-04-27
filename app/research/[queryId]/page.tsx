"use client";
import { useEffect } from "react";
import { useRouter }      from "next/navigation";
import { useResearchStore }     from "@/lib/store/research.store";
import { ResearchStream }       from "@/components/research/ResearchStream";
import { TopNav }               from "@/components/layout/TopNav";
import { SideNav }              from "@/components/layout/SideNav";
import { SearchBar }            from "@/components/research/SearchBar";
import { AgentStatusTracker }   from "@/components/research/AgentStatusTracker";
import { ConsensusPanel }       from "@/components/research/ConsensusPanel";
import { PaperCard }            from "@/components/research/PaperCard";
import { ConfidenceWidget }     from "@/components/research/ConfidenceWidget";
import { EvidenceGradeBadge }   from "@/components/research/EvidenceGradeBadge";
import { SectionDivider }       from "@/components/ui/SectionDivider";
import { PaperCardSkeleton, ConsensusSkeleton } from "@/components/research/LoadingSkeleton";

type Props = { params: { queryId: string } };

export default function ResearchPage({ params }: Props) {
  const { queryId } = params;
  const query  = decodeURIComponent(queryId);
  const router = useRouter();

  const state     = useResearchStore(s => s);
  const startResearch = useResearchStore(s => s.startResearch);
  const reset     = useResearchStore(s => s.reset);

  // Kick off research when query changes
  useEffect(() => {
    startResearch(query);
  }, [query, startResearch]);

  const handleNewQuery = (q: string) => {
    reset();
    router.push(`/research/${encodeURIComponent(q)}`);
  };

  const isLoading    = state.step !== "idle" && state.step !== "complete" && state.step !== "error";
  const showSkeleton = state.step === "orchestrating" || state.step === "fetching";

  return (
    <div className="min-h-screen bg-scientific-grid" style={{ background:"#051424" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>

      {/* SSE consumer — renders nothing, drives store */}
      <ResearchStream query={query}/>

      <TopNav/>
      <SideNav/>

      <main className="md:pl-64 mt-16 min-h-screen px-6 py-8 max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-6">

          {state.step !== "idle" && (
            <AgentStatusTracker step={state.step} papersTotal={state.papersTotal} papersAnalyzed={state.papersAnalyzed} elapsedSeconds={state.elapsedSeconds}/>
          )}

          <SearchBar onSubmit={handleNewQuery} isLoading={isLoading} initialValue={query}/>

          {state.subQuestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs uppercase tracking-widest self-center mr-2" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Investigating:</span>
              {state.subQuestions.map(q => (
                <span key={q} className="text-xs px-3 py-1.5 rounded-full" style={{ background:"rgba(18,33,49,0.6)", border:"1px solid rgba(59,73,75,0.5)", color:"#b9cacb", fontFamily:"Inter" }}>{q}</span>
              ))}
            </div>
          )}

          {state.step === "error" && state.error && (
            <div className="glass-panel rounded-xl p-6 animate-fade-in-up" style={{ borderLeft:"3px solid #ffb4ab" }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined" style={{ color:"#ffb4ab" }}>error</span>
                <strong style={{ color:"#ffb4ab", fontFamily:"Space Grotesk" }}>Research Error</strong>
              </div>
              <p className="text-sm" style={{ color:"#b9cacb" }}>{state.error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              {state.consensus    ? <ConsensusPanel consensus={state.consensus}/> : showSkeleton ? <ConsensusSkeleton/> : null}
              {(state.analyzedPapers.length > 0 || showSkeleton) && (
                <>
                  <SectionDivider label="Supporting Evidence"/>
                  <div className="flex flex-col gap-3">
                    {showSkeleton && [1,2,3].map(i => <PaperCardSkeleton key={i}/>)}
                    {state.analyzedPapers.map((p, i) => <PaperCard key={p.doi + i} paper={p} index={i}/>)}
                    {state.step === "analyzing" && state.papersAnalyzed < state.papersTotal && (
                      <div className="flex items-center gap-3 p-4 text-sm" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>
                        <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"/>
                        Analyzing {state.papersTotal - state.papersAnalyzed} more…
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              {state.consensus ? (
                <>
                  <ConfidenceWidget percent={state.consensus.confidencePercent} level={state.consensus.confidenceLevel}/>
                  <SourceList papers={state.analyzedPapers}/>
                </>
              ) : state.step === "synthesizing" ? (
                <div className="glass-panel rounded-xl p-6 flex flex-col gap-3 items-center justify-center" style={{ minHeight:"180px" }}>
                  <div className="flex items-center gap-2">
                    {[0,1,2].map(i => <span key={i} className="typing-dot w-2 h-2 rounded-full" style={{ background:"#00f0ff" }}/>)}
                  </div>
                  <p className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Synthesizing consensus…</p>
                </div>
              ) : null}
            </div>
          </div>

          {state.step === "complete" && state.consensus && (
            <div className="flex flex-wrap gap-6 pt-4 pb-8 animate-fade-in-up" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label:"Papers Analyzed", value: state.analyzedPapers.length },
                { label:"Search Terms",    value: state.searchTerms.length },
                { label:"Time Elapsed",    value: `${state.elapsedSeconds}s` },
                { label:"Generated",       value: new Date(state.consensus.generatedAt).toLocaleTimeString() },
              ].map(s => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk", letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</span>
                  <span className="text-sm font-semibold" style={{ color:"#00f0ff", fontFamily:"Space Grotesk" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SourceList({ papers }: { papers: import("@/lib/types/research.types").PaperAnalysis[] }) {
  if (!papers.length) return null;
  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize:"18px", color:"#00f0ff" }}>library_books</span>
        <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Sources</h3>
      </div>
      <div className="flex flex-col gap-1">
        {papers.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize:"16px", color:"#849495" }}>article</span>
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>{p.title}</p>
                <p className="text-xs" style={{ color:"#849495" }}>{p.journal} · {p.year}</p>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              <EvidenceGradeBadge grade={p.grade} showLabel={false} size="sm"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
