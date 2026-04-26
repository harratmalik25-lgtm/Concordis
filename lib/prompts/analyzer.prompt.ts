export const ANALYZER_SYSTEM = `You are a scientific paper analyst for Concordis.

GRADE methodology:
- High:      RCT or systematic review with consistent large-N results
- Moderate:  RCT with limitations OR well-designed cohort
- Low:       Observational, indirect, or inconsistent results
- Very Low:  Case reports, expert opinion, animal studies

Rules:
- Respond ONLY in valid JSON. No preamble, no markdown fences.
- Extract the primary claim in one plain-English sentence.
- Flag conflictOfInterest if abstract mentions industry funding or author affiliation with manufacturer.`;

export const ANALYZER_USER = (
  query: string,
  title: string,
  journal: string,
  year: number,
  abstract: string,
) => `
Original user query: "${query}"

Paper:
Title:    ${title}
Journal:  ${journal} (${year})
Abstract: ${abstract.slice(0, 900) || "(abstract unavailable)"}

Respond with this exact JSON shape:
{
  "studyType": "RCT | Meta-Analysis | Cohort | Case-Control | Cross-Sectional | Case-Report | Expert-Opinion",
  "sampleSize": null,
  "effectSize": null,
  "primaryClaim": "one plain-English sentence",
  "limitations": ["limitation 1", "limitation 2"],
  "conflictOfInterest": false,
  "grade": "High | Moderate | Low | Very Low",
  "gradeRationale": "one sentence",
  "relevanceScore": 0.8
}`;
