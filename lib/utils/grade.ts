import type { EvidenceGrade, ConsensusAnswer } from "../types/research.types";

export function validateConsensusGrade(consensus: ConsensusAnswer): ConsensusAnswer {
  const papers = consensus.papers;
  const hasRCT          = papers.some(p => p.studyType === "RCT");
  const hasMetaAnalysis = papers.some(p => p.studyType === "Meta-Analysis");
  const cohortCount     = papers.filter(p => p.studyType === "Cohort").length;
  const highGradeCount  = papers.filter(p => p.grade === "High" || p.grade === "Moderate").length;
  const relevantCount   = papers.filter(p => p.relevanceScore >= 0.5).length;

  let correctedLevel: EvidenceGrade = consensus.confidenceLevel;
  let correctedPercent = consensus.confidencePercent;

  if (correctedLevel === "High" && !hasRCT && !hasMetaAnalysis) {
    correctedLevel   = "Moderate";
    correctedPercent = Math.min(correctedPercent, 74);
  }

  if (correctedLevel === "Moderate") {
    if (highGradeCount < 2 || relevantCount < 2) {
      correctedLevel   = "Low";
      correctedPercent = Math.min(correctedPercent, 49);
    }
    if (cohortCount >= 3 && highGradeCount >= 3) {
      correctedLevel = "Moderate";
    }
  }

  const caps: Record<EvidenceGrade, [number, number]> = {
    "High":     [75, 95],
    "Moderate": [50, 74],
    "Low":      [25, 49],
    "Very Low": [5,  24],
  };
  const [min, max] = caps[correctedLevel];
  correctedPercent = Math.max(min, Math.min(max, correctedPercent));

  return { ...consensus, confidenceLevel: correctedLevel, confidencePercent: correctedPercent };
}

export function gradeToPercent(grade: EvidenceGrade): number {
  const map: Record<EvidenceGrade, number> = { "High": 85, "Moderate": 62, "Low": 37, "Very Low": 15 };
  return map[grade];
}
