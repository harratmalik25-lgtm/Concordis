import { withBackoff } from "../utils/backoff";
import {
  ORCHESTRATOR_SYSTEM,
  ORCHESTRATOR_PLAN_USER,
  ORCHESTRATOR_SYNTHESIZE_USER,
} from "../prompts/orchestrator.prompt";
import type {
  OrchestratorPlan,
  ConsensusAnswer,
  PaperAnalysis,
  EvidenceGrade,
} from "../types/research.types";

const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL   = "nvidia/nemotron-3-super-120b-a12b:free";

type NemotronResponse = {
  choices: Array<{ message: { content: string } }>;
};

async function callNemotron(userContent: string, maxTokens = 800): Promise<string> {
  const res = await fetch(OR_BASE, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer":  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title":       "Concordis",
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: maxTokens,
      messages:   [
        { role: "system", content: ORCHESTRATOR_SYSTEM },
        { role: "user",   content: userContent },
      ],
    }),
  });

  if (res.status === 429) throw new Error("rate_limit");
  if (!res.ok) throw new Error(`Nemotron ${res.status}: ${await res.text()}`);

  const data = await res.json() as NemotronResponse;
  return (data.choices[0]?.message.content ?? "")
    .replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * Decomposes a user query into sub-questions and MeSH search terms.
 * @param query  Sanitized user query string
 * @returns      Plan with subQuestions and meshTerms arrays
 */
export async function planQuery(query: string): Promise<OrchestratorPlan> {
  const text = await withBackoff(() => callNemotron(ORCHESTRATOR_PLAN_USER(query), 400));
  try {
    const p = JSON.parse(text) as OrchestratorPlan;
    return {
      subQuestions: p.subQuestions ?? [],
      meshTerms:    p.meshTerms    ?? [],
    };
  } catch {
    const terms = query.split(" ").filter(w => w.length > 3).slice(0, 5);
    return { subQuestions: [query], meshTerms: terms };
  }
}

/**
 * Synthesizes a ConsensusAnswer from analyzed papers.
 * @param query   Original user query
 * @param papers  Array of GRADE-analyzed PaperAnalysis objects
 * @param terms   Search terms used during paper retrieval
 * @returns       Final ConsensusAnswer
 */
export async function synthesizeConsensus(
  query:  string,
  papers: PaperAnalysis[],
  terms:  string[],
): Promise<ConsensusAnswer> {
  const summaries = papers
    .map((p, i) => `[${i + 1}] "${p.title}" (${p.year}, ${p.studyType}, Grade:${p.grade}): ${p.primaryClaim}`)
    .join("\n");

  const text = await withBackoff(() =>
    callNemotron(ORCHESTRATOR_SYNTHESIZE_USER(query, summaries), 900)
  );

  try {
    const p = JSON.parse(text) as {
      consensusStatement:      string;
      confidenceLevel:         EvidenceGrade;
      confidencePercent:       number;
      keyFindings:             string[];
      dissent:                 string | null;
      practicalRecommendation: string;
    };

    return {
      query,
      consensusStatement:      p.consensusStatement      ?? "",
      confidenceLevel:         p.confidenceLevel         ?? "Low",
      confidencePercent:       p.confidencePercent        ?? 40,
      keyFindings:             p.keyFindings             ?? [],
      dissent:                 p.dissent                 ?? null,
      practicalRecommendation: p.practicalRecommendation ?? "",
      papers,
      searchTermsUsed:         terms,
      generatedAt:             new Date().toISOString(),
    };
  } catch {
    return {
      query,
      consensusStatement:      "Synthesis encountered an error — review individual papers below.",
      confidenceLevel:         "Very Low",
      confidencePercent:        20,
      keyFindings:             papers.map(p => p.primaryClaim).slice(0, 4),
      dissent:                 null,
      practicalRecommendation: "Review individual paper findings above.",
      papers,
      searchTermsUsed:         terms,
      generatedAt:             new Date().toISOString(),
    };
  }
}
