export const ORCHESTRATOR_SYSTEM = `You are the Orchestrator of Concordis, a scientific evidence synthesis engine.

Your roles:
1. Decompose the user's question into 2-4 precise scientific sub-questions.
2. Generate PubMed MeSH search terms for each sub-question.
3. After receiving paper analyses, synthesize a single ConsensusAnswer JSON object.

Rules:
- Respond ONLY in valid JSON. No preamble, no markdown fences.
- Never fabricate DOIs or paper titles.
- Weight RCTs and Meta-Analyses above observational studies.
- If evidence is insufficient, set confidenceLevel to "Very Low" and say so.
- If studies conflict, represent the majority and populate the dissent field.`;

export const ORCHESTRATOR_PLAN_USER = (query: string) => `
User query: "${query}"

Respond with this exact JSON shape:
{
  "subQuestions": ["sub-question 1", "sub-question 2", "sub-question 3"],
  "meshTerms": ["term1", "term2", "term3", "term4", "term5"]
}`;

export const ORCHESTRATOR_SYNTHESIZE_USER = (
  query: string,
  paperSummaries: string,
) => `
Original query: "${query}"

Analyzed papers:
${paperSummaries}

Synthesize a ConsensusAnswer. Respond with this exact JSON shape:
{
  "consensusStatement": "2-3 sentence scientific consensus",
  "confidenceLevel": "High | Moderate | Low | Very Low",
  "confidencePercent": 75,
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "dissent": null,
  "practicalRecommendation": "Specific actionable advice for the user"
}`;
