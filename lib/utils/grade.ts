import type { EvidenceGrade, StudyType } from "../types/research.types";

const STUDY_GRADE_MAP: Record<StudyType, EvidenceGrade> = {
  "Meta-Analysis":     "High",
  "RCT":               "High",
  "Cohort":            "Moderate",
  "Case-Control":      "Low",
  "Cross-Sectional":   "Low",
  "Case-Report":       "Very Low",
  "Expert-Opinion":    "Very Low",
};

/**
 * Returns the base GRADE level for a study type before adjustments.
 */
export function baseGrade(studyType: StudyType): EvidenceGrade {
  return STUDY_GRADE_MAP[studyType];
}

/**
 * Maps EvidenceGrade to a 0-100 confidence percent for the UI ring widget.
 */
export function gradeToPercent(grade: EvidenceGrade): number {
  const map: Record<EvidenceGrade, number> = {
    "High":     90,
    "Moderate": 68,
    "Low":      42,
    "Very Low": 20,
  };
  return map[grade];
}
