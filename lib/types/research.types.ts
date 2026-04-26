export type EvidenceGrade = "High" | "Moderate" | "Low" | "Very Low";

export type StudyType =
  | "RCT" | "Meta-Analysis" | "Cohort"
  | "Case-Control" | "Cross-Sectional"
  | "Case-Report" | "Expert-Opinion";

export type PaperAnalysis = {
  doi:                string;
  title:              string;
  year:               number;
  journal:            string;
  studyType:          StudyType;
  sampleSize:         number | null;
  effectSize:         string | null;
  primaryClaim:       string;
  limitations:        string[];
  conflictOfInterest: boolean;
  grade:              EvidenceGrade;
  gradeRationale:     string;
  relevanceScore:     number;
};

export type ConsensusAnswer = {
  query:                   string;
  consensusStatement:      string;
  confidenceLevel:         EvidenceGrade;
  confidencePercent:       number;
  keyFindings:             string[];
  dissent:                 string | null;
  practicalRecommendation: string;
  papers:                  PaperAnalysis[];
  searchTermsUsed:         string[];
  generatedAt:             string;
};

export type OrchestratorPlan = {
  subQuestions: string[];
  meshTerms:    string[];
};

export type StreamEvent =
  | { type: "orchestrator:plan";  data: OrchestratorPlan }
  | { type: "papers:fetched";     data: { count: number } }
  | { type: "paper:analyzed";     data: PaperAnalysis }
  | { type: "consensus:ready";    data: ConsensusAnswer }
  | { type: "error";              data: { message: string; retryable: boolean } };

export type AgentStep =
  | "idle" | "orchestrating" | "fetching"
  | "analyzing" | "synthesizing" | "complete" | "error";

export type ResearchState = {
  step:           AgentStep;
  query:          string;
  papersTotal:    number;
  papersAnalyzed: number;
  analyzedPapers: PaperAnalysis[];
  consensus:      ConsensusAnswer | null;
  error:          string | null;
  elapsedSeconds: number;
  subQuestions:   string[];
  searchTerms:    string[];
};
