import type { PaperAnalysis, EvidenceGrade, StudyType } from "../types/research.types";
import type { RawPaper } from "./fetcher";

const CEREBRAS_BASE = "https://api.cerebras.ai/v1/chat/completions";
const GROQ_BASE     = "https://api.groq.com/openai/v1/chat/completions";
const OR_BASE       = "https://openrouter.ai/api/v1/chat/completions";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
type ChatResponse = { choices: Array<{ message: { content: string } }> };

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function callCerebras(prompt: string): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) throw new Error("no_cerebras");
  const res = await fetch(CEREBRAS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.3-70b", max_tokens: 600, temperature: 0.1,
      messages: [{ role: "user", content: prompt }] }),
  });
  if (res.status === 429) { await sleep(3000); throw new Error("429"); }
  if (!res.ok) throw new Error(`Cerebras ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq");
  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", max_tokens: 600, temperature: 0.1,
      messages: [{ role: "user", content: prompt }] }),
  });
  if (res.status === 429) { await sleep(8000); throw new Error("429"); }
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callOR(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_or");
  const res = await fetch(OR_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://concordis-next.vercel.app", "X-Title": "Concordis" },
    body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", max_tokens: 600,
      messages: [{ role: "user", content: prompt }] }),
  });
  if (res.status === 429) { await sleep(8000); throw new Error("429"); }
  if (!res.ok) throw new Error(`OR ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callBest(prompt: string): Promise<string> {
  try { return await callCerebras(prompt); } catch { /* fall through */ }
  try { return await callGroq(prompt); } catch (e) {
    if ((e as Error).message === "429") await sleep(5000);
  }
  return callOR(prompt);
}

function parse(text: string): Partial<PaperAnalysis> | null {
  try { return JSON.parse(text) as Partial<PaperAnalysis>; } catch { return null; }
}

function validateEffectSize(effectSize: string | null, abstract: string): string | null {
  if (!effectSize || !abstract) return null;
  const numbers = effectSize.match(/\d+\.?\d*/g) ?? [];
  return numbers.some(n => abstract.includes(n)) ? effectSize : null;
}

function validateClaim(claim: string, abstract: string, title: string): string {
  if (!abstract) return claim;
  const nums = claim.match(/\d+\.?\d*%?/g) ?? [];
  for (const n of nums) {
    if (!abstract.includes(n.replace("%","")) && !title.includes(n.replace("%",""))) {
      return claim.replace(/\d+\.?\d*%/g, "a significant percentage")
                  .replace(/HR=[\d.]+/g, "reduced hazard ratio").trim();
    }
  }
  return claim;
}

const PROMPT = (query: string, title: string, journal: string, year: number, abstract: string) =>
`Analyze this paper. Extract ONLY from the abstract. Do NOT use prior knowledge.

Query: "${query}"
Title: "${title}"
Journal: ${journal} (${year})

ABSTRACT:
"""
${abstract.slice(0, 800) || "Not available — set effectSize to null"}
"""

RULES:
- effectSize: only if exact number appears in the abstract above
- primaryClaim: one sentence based ONLY on the abstract
- studyType: use "Meta-Analysis" if abstract mentions systematic review or meta-analysis
- grade: High=RCT/meta-analysis large-N. Moderate=cohort well-designed. Low=small/cross-sectional. Very Low=opinion
- relevanceScore: 1.0=directly answers query, 0.5=tangential, 0.0=unrelated

Reply ONLY with JSON:
{"studyType":"Cohort","sampleSize":null,"effectSize":null,"primaryClaim":"one sentence","limitations":["limit"],"conflictOfInterest":false,"grade":"Low","gradeRationale":"reason","relevanceScore":0.7}`;

function build(paper: RawPaper, p: Partial<PaperAnalysis>): PaperAnalysis {
  return {
    doi: paper.doi, title: paper.title, year: paper.year, journal: paper.journal,
    studyType:          (p.studyType as StudyType) ?? "Cohort",
    sampleSize:         p.sampleSize               ?? null,
    effectSize:         validateEffectSize(p.effectSize ?? null, paper.abstract),
    primaryClaim:       validateClaim(p.primaryClaim ?? `Study from ${paper.journal}`, paper.abstract, paper.title),
    limitations:        p.limitations              ?? [],
    conflictOfInterest: p.conflictOfInterest       ?? false,
    grade:              (p.grade as EvidenceGrade) ?? "Low",
    gradeRationale:     p.gradeRationale           ?? "",
    relevanceScore:     Math.min(1, Math.max(0, p.relevanceScore ?? 0.5)),
  };
}

export async function analyzePaper(paper: RawPaper, query: string, _wikiContext = ""): Promise<PaperAnalysis | null> {
  await sleep(500 + Math.random() * 500); // jitter to avoid simultaneous rate limit hits

  const prompt = PROMPT(query, paper.title, paper.journal, paper.year, paper.abstract);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text   = await callBest(prompt);
      const parsed = parse(text);
      if (!parsed?.primaryClaim || parsed.primaryClaim.length < 15) continue;
      if ((parsed.relevanceScore ?? 1) < 0.2) return null;
      return build(paper, parsed);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("Invalid")) throw new Error(msg);
      if (attempt < 2) await sleep(3000 * (attempt + 1));
    }
  }
  return null;
}
