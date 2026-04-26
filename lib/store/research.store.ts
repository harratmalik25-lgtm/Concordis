import { create } from "zustand";
import type { ResearchState, StreamEvent, PaperAnalysis, ConsensusAnswer } from "../types/research.types";

type ResearchStore = ResearchState & {
  startResearch:  (query: string) => void;
  addPaper:       (paper: PaperAnalysis) => void;
  setConsensus:   (consensus: ConsensusAnswer) => void;
  setError:       (error: string) => void;
  setPapersTotal: (n: number) => void;
  setSubQuestions:(qs: string[], terms: string[]) => void;
  tick:           () => void;
  reset:          () => void;
  applyEvent:     (event: StreamEvent) => void;
};

const INITIAL: ResearchState = {
  step:           "idle",
  query:          "",
  papersTotal:    0,
  papersAnalyzed: 0,
  analyzedPapers: [],
  consensus:      null,
  error:          null,
  elapsedSeconds: 0,
  subQuestions:   [],
  searchTerms:    [],
};

export const useResearchStore = create<ResearchStore>((set, get) => ({
  ...INITIAL,

  reset:          ()      => set(INITIAL),
  startResearch:  (query) => set({ ...INITIAL, step: "orchestrating", query }),
  setPapersTotal: (n)     => set({ papersTotal: n, step: "analyzing" }),
  tick:           ()      => set(s => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  setSubQuestions: (subQuestions, searchTerms) =>
    set({ subQuestions, searchTerms, step: "fetching" }),

  addPaper: (paper) =>
    set(s => ({
      analyzedPapers: [...s.analyzedPapers, paper].sort((a, b) => b.relevanceScore - a.relevanceScore),
      papersAnalyzed: s.papersAnalyzed + 1,
    })),

  setConsensus: (consensus) => set({ consensus, step: "complete" }),
  setError:     (error)     => set({ error, step: "error" }),

  applyEvent: (event) => {
    const { setPapersTotal, addPaper, setConsensus, setError, setSubQuestions } = get();
    switch (event.type) {
      case "orchestrator:plan":
        setSubQuestions(event.data.subQuestions, event.data.meshTerms);
        break;
      case "papers:fetched":
        setPapersTotal(event.data.count);
        break;
      case "paper:analyzed":
        addPaper(event.data);
        break;
      case "consensus:ready":
        setConsensus(event.data);
        break;
      case "error":
        setError(event.data.message);
        break;
    }
  },
}));
