import { withBackoff } from "../utils/backoff";
import { ANALYZER_SYSTEM, ANALYZER_USER } from "../prompts/analyzer.prompt";
import type { PaperAnalysis, EvidenceGrade, StudyType } from "../types/research.types";
import type { RawPaper } from "./fetcher";

const OR_BASE  = "https://openrouter.ai/api/v1/chat/completions";
const MODEL    = "google/gemma-4-31b-it:free";

type GemmaResponse = {
  choices: Array<{ message: { content: string } }>;
};

type AnalysisPayload = {
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

/**
 * Analyzes a single paper abstract using Gemma 4 31B via OpenRouter.
 * Returns null if analysis fails after retries rather than crashing the pipeline.
 * @param paper  Raw paper metadata including abstract
 * @param query  Original user query for relevance scoring
 */
export async function analyzePaper(
  paper: RawPaper,
  query: string,
): Promise<PaperAnalysis | null> {
  const userContent = ANALYZER_USER(query, paper.title, paper.journal, paper.year, paper.abstract);

  const callGemma = async (): Promise<string> => {
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
        max_tokens: 600,
        messages:   [
          { role: "system", content: ANALYZER_SYSTEM },
          { role: "user",   content: userContent },
        ],
      }),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (!res.ok) throw new Error(`Gemma ${res.status}`);

    const data = await res.json() as GemmaResponse;
    return data.choices[0]?.message.content ?? "";
  };

  try {
    const raw  = await withBackoff(callGemma);
    const text = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: AnalysisPayload;
    try {
      parsed = JSON.parse(text) as AnalysisPayload;
    } catch {
      // Re-prompt once with schema reminder
      const retry = await withBackoff(callGemma);
      parsed = JSON.parse(
        retry.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()
      ) as AnalysisPayload;
    }

    return {
      doi:                paper.doi,
      title:              paper.title,
      year:               paper.year,
      journal:            paper.journal,
      studyType:          parsed.studyType          ?? "Cohort",
      sampleSize:         parsed.sampleSize         ?? null,
      effectSize:         parsed.effectSize         ?? null,
      primaryClaim:       parsed.primaryClaim       ?? "",
      limitations:        parsed.limitations        ?? [],
      conflictOfInterest: parsed.conflictOfInterest ?? false,
      grade:              parsed.grade              ?? "Low",
      gradeRationale:     parsed.gradeRationale     ?? "",
      relevanceScore:     Math.min(1, Math.max(0, parsed.relevanceScore ?? 0.5)),
    };
  } catch {
    return null;
  }
}
