import type { EvidenceGrade, ConsensusAnswer } from "../types/research.types";

export function validateConsensusGrade(consensus: ConsensusAnswer): ConsensusAnswer {
  const papers = consensus.papers;
  const rctCount        = papers.filter(p => p.studyType === "RCT").length;
  const hasMetaAnalysis = papers.some(p => p.studyType === "Meta-Analysis");
  const cohortCount     = papers.filter(p => p.studyType === "Cohort").length;
  const highGradeCount  = papers.filter(p => p.grade === "High" || p.grade === "Moderate").length;
  const relevantCount   = papers.filter(p => p.relevanceScore >= 0.5).length;

  let level   = consensus.confidenceLevel;
  let percent = consensus.confidencePercent;

  if (level === "High" && !(hasMetaAnalysis || rctCount >= 2)) {
    level   = "Moderate";
    percent = Math.min(percent, 74);
  }

  if (level === "Moderate") {
    const hasRCT = rctCount >= 1;
    const hasStrongCohorts = cohortCount >= 3 && highGradeCount >= 3;
    if (!hasRCT && !hasStrongCohorts && relevantCount < 3) {
      level   = "Low";
      percent = Math.min(percent, 49);
    }
  }

  const caps: Record<EvidenceGrade, [number, number]> = {
    "High":     [75, 90],
    "Moderate": [50, 74],
    "Low":      [25, 49],
    "Very Low": [5,  24],
  };
  const [min, max] = caps[level];
  percent = Math.max(min, Math.min(max, percent));

  return { ...consensus, confidenceLevel: level, confidencePercent: percent };
}

export function gradeToPercent(grade: EvidenceGrade): number {
  const map: Record<EvidenceGrade, number> = {
    "High": 85, "Moderate": 62, "Low": 37, "Very Low": 15,
  };
  return map[grade];
}
