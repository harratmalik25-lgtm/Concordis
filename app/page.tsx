"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopNav }     from "@/components/layout/TopNav";
import { SideNav }    from "@/components/layout/SideNav";
import { SearchBar }  from "@/components/research/SearchBar";

const EXAMPLES = [
  "Does sauna use reduce cardiovascular risk?",
  "Is time-restricted eating backed by RCTs?",
  "What's the evidence for cold exposure and testosterone?",
  "Does creatine improve cognitive performance?",
  "Is there evidence for omega-3 and depression?",
];

export default function Home() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback((q: string) => {
    setLoading(true);
    router.push(`/research/${encodeURIComponent(q)}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-scientific-grid" style={{ background:"#051424" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>
      <TopNav activeTab="Research"/>
      <SideNav activeItem="Workspace" onNewQuery={() => router.push("/")}/>
      <main className="md:pl-64 mt-16 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-3xl flex flex-col gap-10 py-24 animate-fade-in-up">
          <div className="text-center flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background:"#34d399", boxShadow:"0 0 8px #34d399" }}/>
              <span className="text-xs uppercase tracking-widest" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>
                Engine Online · Nemotron + Gemma · PubMed
              </span>
            </div>
            <h1 className="font-bold tracking-tight neon-text-glow"
              style={{ fontSize:"clamp(36px,6vw,64px)", lineHeight:1.1, letterSpacing:"-0.02em", fontFamily:"Space Grotesk", color:"#dbfcff" }}>
              Query the<br/><span style={{ color:"#00f0ff" }}>Concordis</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color:"#849495", fontFamily:"Inter" }}>
              Evidence synthesis across scientific literature — not one paper, but the weight of consensus.
            </p>
          </div>

          <SearchBar onSubmit={handleSubmit} isLoading={loading}/>

          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[["check_circle","GRADE Methodology"],["hub","Nemotron Orchestrator"],["science","Gemma Analyzer"],["menu_book","PubMed + Semantic Scholar"]].map(([icon,label]) => (
              <div key={label} className="flex items-center gap-2 text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>
                <span className="material-symbols-outlined" style={{ fontSize:"14px", color:"#34d399" }}>{icon}</span>{label}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Try these queries</span>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map(q => (
                <button key={q} onClick={() => handleSubmit(q)}
                  className="px-4 py-2 rounded-full text-xs transition-all hover:bg-white/10 active:scale-95"
                  style={{ background:"rgba(18,33,49,0.6)", border:"1px solid rgba(59,73,75,0.5)", color:"#b9cacb", fontFamily:"Inter" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
