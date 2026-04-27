import { ORCHESTRATOR_SYSTEM, ORCHESTRATOR_PLAN_USER, ORCHESTRATOR_SYNTHESIZE_USER } from "../prompts/orchestrator.prompt";
import type { OrchestratorPlan, ConsensusAnswer, PaperAnalysis, EvidenceGrade } from "../types/research.types";
import { validateConsensusGrade } from "../utils/grade";

const OR_BASE   = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const OR_MODELS   = ["meta-llama/llama-3.3-70b-instruct:free", "mistralai/mistral-7b-instruct:free"];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
type ChatResponse = { choices: Array<{ message: { content: string } }> };

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function callGroq(model: string, system: string, user: string, maxTokens = 900): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq_key");
  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (res.status === 429) { await sleep(5000); throw new Error("429"); }
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callOR(model: string, system: string, user: string, maxTokens = 900): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_or_key");
  const res = await fetch(OR_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000", "X-Title": "Concordis" },
    body: JSON.stringify({ model, max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (res.status === 429) { await sleep(8000); throw new Error("429"); }
  if (!res.ok) throw new Error(`OR ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callBest(system: string, user: string, maxTokens = 900): Promise<string> {
  for (const model of GROQ_MODELS) {
    try { return await callGroq(model, system, user, maxTokens); }
    catch (e) { if ((e as Error).message === "429") await sleep(3000); continue; }
  }
  for (const model of OR_MODELS) {
    try { return await callOR(model, system, user, maxTokens); }
    catch { continue; }
  }
  throw new Error("All models failed");
}

export async function planQuery(query: string): Promise<OrchestratorPlan> {
  try {
    const text = await callBest(ORCHESTRATOR_SYSTEM, ORCHESTRATOR_PLAN_USER(query), 400);
    const p = JSON.parse(text) as OrchestratorPlan;
    return { subQuestions: p.subQuestions ?? [], meshTerms: p.meshTerms ?? [] };
  } catch {
    const terms = query.split(" ").filter(w => w.length > 3).slice(0, 5);
    return { subQuestions: [query], meshTerms: terms };
  }
}

export async function synthesizeConsensus(
  query: string,
  papers: PaperAnalysis[],
  terms: string[],
  wikiContext = ""
): Promise<ConsensusAnswer> {
  const relevant = papers
    .filter(p => p.relevanceScore >= 0.5)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8);

  const summaries = relevant.map((p, i) =>
    `[${i+1}] "${p.title}" (${p.year}, ${p.studyType}, n=${p.sampleSize ?? "unknown"}, Grade:${p.grade})\n` +
    `Finding: ${p.primaryClaim}` +
    (p.effectSize ? `\nEffect size: ${p.effectSize}` : "") +
    (p.limitations.length ? `\nLimitations: ${p.limitations.slice(0,2).join("; ")}` : "")
  ).join("\n\n");

  const contextBlock = wikiContext ? `\nBackground:\n${wikiContext.slice(0, 300)}\n\n` : "";

  try {
    const text = await callBest(
      ORCHESTRATOR_SYSTEM,
      contextBlock + ORCHESTRATOR_SYNTHESIZE_USER(query, summaries),
      900
    );

    const p = JSON.parse(text) as {
      consensusStatement: string;
      confidenceLevel: EvidenceGrade;
      confidencePercent: number;
      keyFindings: string[];
      dissent: string | null;
      practicalRecommendation: string;
    };

    const raw: ConsensusAnswer = {
      query,
      consensusStatement:      p.consensusStatement      ?? "",
      confidenceLevel:         p.confidenceLevel         ?? "Low",
      confidencePercent:       p.confidencePercent       ?? 40,
      keyFindings:             p.keyFindings             ?? [],
      dissent:                 p.dissent                 ?? null,
      practicalRecommendation: p.practicalRecommendation ?? "",
      papers: relevant,
      searchTermsUsed: terms,
      generatedAt: new Date().toISOString(),
    };

    return validateConsensusGrade(raw);

  } catch {
    const highGrade = relevant.filter(p => p.grade === "High" || p.grade === "Moderate");
    const raw: ConsensusAnswer = {
      query,
      consensusStatement: `Based on ${relevant.length} studies, the evidence includes findings from ${[...new Set(relevant.map(p => p.journal))].slice(0, 3).join(", ")}.`,
      confidenceLevel:    highGrade.length >= 3 ? "Moderate" : "Low",
      confidencePercent:  highGrade.length >= 3 ? 60 : 35,
      keyFindings:        relevant.slice(0, 4).map(p => p.primaryClaim),
      dissent:            null,
      practicalRecommendation: "Review the individual studies above for detailed findings.",
      papers: relevant,
      searchTermsUsed: terms,
      generatedAt: new Date().toISOString(),
    };
    return validateConsensusGrade(raw);
  }
}
