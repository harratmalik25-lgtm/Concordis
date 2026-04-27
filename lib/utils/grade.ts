import type { EvidenceGrade, ConsensusAnswer, PaperAnalysis } from "../types/research.types";

export function deriveConfidence(papers: PaperAnalysis[]): { level: EvidenceGrade; percent: number } {
  const relevant = papers.filter(p => p.relevanceScore >= 0.4);
  if (relevant.length === 0) return { level: "Very Low", percent: 10 };

  const rctCount  = relevant.filter(p => p.studyType === "RCT").length;
  const metaCount = relevant.filter(p => p.studyType === "Meta-Analysis").length;
  const cohortCount = relevant.filter(p => p.studyType === "Cohort").length;
  const srCount   = relevant.filter(p =>
    p.studyType === "Meta-Analysis" ||
    p.primaryClaim.toLowerCase().includes("systematic review") ||
    p.gradeRationale.toLowerCase().includes("systematic")
  ).length;

  if ((rctCount >= 2 && relevant.length >= 4) || (metaCount >= 1 && rctCount >= 1)) {
    return { level: "High", percent: 82 };
  }
  if (rctCount >= 1 || srCount >= 2 || (cohortCount >= 4 && relevant.length >= 5)) {
    return { level: "Moderate", percent: rctCount >= 1 ? 62 : 55 };
  }
  if (relevant.length >= 2) {
    return { level: "Low", percent: 35 };
  }
  return { level: "Very Low", percent: 12 };
}

export function validateConsensusGrade(consensus: ConsensusAnswer): ConsensusAnswer {
  const { level, percent } = deriveConfidence(consensus.papers);
  return { ...consensus, confidenceLevel: level, confidencePercent: percent };
}

export function gradeToPercent(grade: EvidenceGrade): number {
  const map: Record<EvidenceGrade, number> = {
    "High": 82, "Moderate": 62, "Low": 35, "Very Low": 12,
  };
  return map[grade];
}
