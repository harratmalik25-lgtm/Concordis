import { create } from "zustand";
import type { ResearchState, StreamEvent, PaperAnalysis, ConsensusAnswer } from "../types/research.types";

export type HistoryEntry = {
  id:        string;
  query:     string;
  timestamp: string;
  papers:    number;
  grade:     string;
  consensus: ConsensusAnswer;
};

type ResearchStore = ResearchState & {
  history:        HistoryEntry[];
  startResearch:  (query: string) => void;
  addPaper:       (paper: PaperAnalysis) => void;
  setConsensus:   (consensus: ConsensusAnswer) => void;
  setError:       (error: string) => void;
  setPapersTotal: (n: number) => void;
  setSubQuestions:(qs: string[], terms: string[]) => void;
  tick:           () => void;
  reset:          () => void;
  applyEvent:     (event: StreamEvent) => void;
  clearHistory:   () => void;
};

const INITIAL: ResearchState = {
  step: "idle", query: "", papersTotal: 0, papersAnalyzed: 0,
  analyzedPapers: [], consensus: null, error: null,
  elapsedSeconds: 0, subQuestions: [], searchTerms: [],
};

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(sessionStorage.getItem("concordis_history") ?? "[]") as HistoryEntry[]; }
  catch { return []; }
}

function saveHistory(h: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("concordis_history", JSON.stringify(h.slice(0, 20)));
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  ...INITIAL,
  history: [],

  reset:          () => set(s => ({ ...INITIAL, history: s.history })),
  startResearch:  (query) => set(s => ({ ...INITIAL, history: s.history, step: "orchestrating", query })),
  setPapersTotal: (n) => set({ papersTotal: n, step: "analyzing" }),
  tick:           () => set(s => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  clearHistory:   () => { saveHistory([]); set({ history: [] }); },

  setSubQuestions: (subQuestions, searchTerms) =>
    set({ subQuestions, searchTerms, step: "fetching" }),

  addPaper: (paper) =>
    set(s => ({
      analyzedPapers: [...s.analyzedPapers, paper].sort((a, b) => b.relevanceScore - a.relevanceScore),
      papersAnalyzed: s.papersAnalyzed + 1,
    })),

  setConsensus: (consensus) => {
    const entry: HistoryEntry = {
      id:        Date.now().toString(),
      query:     consensus.query,
      timestamp: new Date().toISOString(),
      papers:    consensus.papers.length,
      grade:     consensus.confidenceLevel,
      consensus,
    };
    const newHistory = [entry, ...get().history].slice(0, 20);
    saveHistory(newHistory);
    set({ consensus, step: "complete", history: newHistory });
  },

  setError: (error) => set({ error, step: "error" }),

  applyEvent: (event) => {
    const s = get();
    switch (event.type) {
      case "orchestrator:plan": s.setSubQuestions(event.data.subQuestions, event.data.meshTerms); break;
      case "papers:fetched":   s.setPapersTotal(event.data.count); break;
      case "paper:analyzed":   s.addPaper(event.data); break;
      case "consensus:ready":  s.setConsensus(event.data); break;
      case "error":            s.setError(event.data.message); break;
    }
  },
}));
