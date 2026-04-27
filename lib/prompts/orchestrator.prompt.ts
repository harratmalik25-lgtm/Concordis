export const ORCHESTRATOR_SYSTEM = `You are the Orchestrator of Concordis, a scientific evidence synthesis engine.

Your roles:
1. Decompose the user question into 2-3 precise scientific sub-questions.
2. Generate 5 highly specific PubMed MeSH search terms directly about the topic.
3. After receiving paper analyses, synthesize a ConsensusAnswer.

Rules:
- Respond ONLY in valid JSON. No preamble, no markdown.
- MeSH terms must be tightly focused on the exact topic.
- Weight RCTs and Meta-Analyses above observational studies.
- If studies conflict, represent the majority and populate the dissent field.`;

export const ORCHESTRATOR_PLAN_USER = (query: string) => `
User query: "${query}"

Generate focused search terms for this EXACT topic. For "sauna cardiovascular risk" use terms like "sauna bathing cardiovascular mortality", "Finnish sauna heart disease" NOT generic terms.

Respond with this exact JSON:
{
  "subQuestions": ["specific sub-question 1", "specific sub-question 2"],
  "meshTerms": ["exact topic term 1", "exact topic term 2", "exact topic term 3", "exact topic term 4", "exact topic term 5"]
}`;

export const ORCHESTRATOR_SYNTHESIZE_USER = (
  query: string,
  paperSummaries: string,
) => `
Original query: "${query}"

Analyzed papers:
${paperSummaries}

GRADING RULES:
- "High": ONLY if multiple RCTs or systematic review of RCTs. Cohorts alone cannot be High.
- "Moderate": Multiple consistent prospective cohorts OR single RCT with limitations.
- "Low": Inconsistent results, single cohort, or indirect evidence.
- "Very Low": Case reports, hypotheses, animal studies, or fewer than 2 relevant papers.

confidencePercent: High=75-90, Moderate=50-74, Low=25-49, Very Low=5-24.

CLAIM RULES:
- keyFindings must only state what papers actually found. No extrapolation.
- Numbers (HR, RR, %) must come from a paper listed above.
- dissent: populate if any paper contradicts the majority.
- Ignore off-topic papers.

Respond with this exact JSON:
{
  "consensusStatement": "2-3 sentence consensus directly answering the query, noting if evidence is observational",
  "confidenceLevel": "Moderate",
  "confidencePercent": 65,
  "keyFindings": ["specific finding with source year", "specific finding with source year", "specific finding with source year"],
  "dissent": null,
  "practicalRecommendation": "Specific actionable advice noting level of evidence"
}`;
