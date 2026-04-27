import type { PaperAnalysis, EvidenceGrade, StudyType } from "../types/research.types";
import type { RawPaper } from "./fetcher";

const OR_BASE   = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];
const OR_MODELS   = ["meta-llama/llama-3.3-70b-instruct:free", "mistralai/mistral-7b-instruct:free"];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
type ChatResponse = { choices: Array<{ message: { content: string } }> };

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function callGroq(model: string, prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq_key");
  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: 600, temperature: 0.1, messages: [{ role: "user", content: prompt }] }),
  });
  if (res.status === 429) { await sleep(5000); throw new Error("429"); }
  if (res.status === 401) throw new Error("Invalid Groq API key");
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callOR(model: string, prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_or_key");
  const res = await fetch(OR_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "HTTP-Referer": "http://localhost:3000", "X-Title": "Concordis" },
    body: JSON.stringify({ model, max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
  });
  if (res.status === 429) { await sleep(8000); throw new Error("429"); }
  if (res.status === 401) throw new Error("Invalid OpenRouter key");
  if (!res.ok) throw new Error(`OR ${res.status}`);
  const data = await res.json() as ChatResponse;
  return extractJSON(data.choices[0]?.message.content ?? "");
}

async function callBest(prompt: string): Promise<string> {
  for (const model of GROQ_MODELS) {
    try { return await callGroq(model, prompt); }
    catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Invalid Groq")) throw new Error(msg);
      if (msg === "429") await sleep(3000);
      continue;
    }
  }
  for (const model of OR_MODELS) {
    try { return await callOR(model, prompt); }
    catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Invalid OpenRouter")) throw new Error(msg);
      continue;
    }
  }
  throw new Error("All models failed");
}

function parse(text: string): Partial<PaperAnalysis> | null {
  try { return JSON.parse(text) as Partial<PaperAnalysis>; } catch { return null; }
}

function validateEffectSize(effectSize: string | null, abstract: string): string | null {
  if (!effectSize || !abstract) return null;
  const numbers = effectSize.match(/\d+\.?\d*/g) ?? [];
  if (numbers.length === 0) return null;
  const abstractHasNumber = numbers.some(n => {
    const num = parseFloat(n);
    return abstract.includes(n) ||
           (num < 2 && abstract.includes(num.toFixed(2))) ||
           (num < 2 && abstract.includes(num.toFixed(1)));
  });
  return abstractHasNumber ? effectSize : null;
}

function validateClaim(claim: string, abstract: string, title: string): string {
  if (!abstract) return claim;
  const claimNumbers = claim.match(/\d+\.?\d*%?/g) ?? [];
  for (const num of claimNumbers) {
    const bare = num.replace('%', '');
    if (!abstract.includes(bare) && !title.includes(bare)) {
      return claim
        .replace(/\d+\.?\d*%/g, 'a significant percentage')
        .replace(/HR=[\d.]+/g, 'reduced hazard ratio')
        .replace(/\d+\.?\d*-fold/g, 'several-fold')
        .trim();
    }
  }
  return claim;
}

const ANALYSIS_PROMPT = (query: string, title: string, journal: string, year: number, abstract: string) =>
`You are analyzing a scientific paper. Extract information ONLY from the abstract text provided. Do NOT use prior knowledge about this paper.

Query: "${query}"
Title: "${title}"
Journal: ${journal} (${year})

ABSTRACT (extract all numbers ONLY from this text):
"""
${abstract.slice(0, 800) || "Abstract not available — base analysis on title and journal only, set effectSize to null"}
"""

RULES:
- effectSize: ONLY include if the exact number appears verbatim in the abstract above. If unsure, set null.
- primaryClaim: Based ONLY on the abstract. Include specific numbers only if they appear in the abstract.
- grade: High=RCT or meta-analysis large-N consistent. Moderate=well-designed cohort or RCT with limitations. Low=small cohort/cross-sectional/mixed. Very Low=case report/opinion/hypothesis/animal.
- relevanceScore: 1.0=directly answers query, 0.5=tangentially related, 0.0=unrelated.

Reply with ONLY this JSON:
{"studyType":"Cohort","sampleSize":2315,"effectSize":null,"primaryClaim":"Specific finding from this paper in one sentence","limitations":["limitation 1","limitation 2"],"conflictOfInterest":false,"grade":"Moderate","gradeRationale":"Reason for this grade","relevanceScore":0.9}`;

function build(paper: RawPaper, p: Partial<PaperAnalysis>): PaperAnalysis {
  const validatedEffectSize = validateEffectSize(p.effectSize ?? null, paper.abstract);
  const validatedClaim = validateClaim(
    p.primaryClaim ?? `Study in ${paper.journal} (${paper.year}) examined the research topic.`,
    paper.abstract,
    paper.title
  );
  return {
    doi:                paper.doi,
    title:              paper.title,
    year:               paper.year,
    journal:            paper.journal,
    studyType:          (p.studyType as StudyType)    ?? "Cohort",
    sampleSize:         p.sampleSize                  ?? null,
    effectSize:         validatedEffectSize,
    primaryClaim:       validatedClaim,
    limitations:        p.limitations                 ?? [],
    conflictOfInterest: p.conflictOfInterest          ?? false,
    grade:              (p.grade as EvidenceGrade)    ?? "Low",
    gradeRationale:     p.gradeRationale              ?? "",
    relevanceScore:     Math.min(1, Math.max(0, p.relevanceScore ?? 0.5)),
  };
}

export async function analyzePaper(paper: RawPaper, query: string, _wikiContext = ""): Promise<PaperAnalysis | null> {
  const prompt = ANALYSIS_PROMPT(query, paper.title, paper.journal, paper.year, paper.abstract);
  await sleep(800);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text   = await callBest(prompt);
      const parsed = parse(text);
      if (!parsed?.primaryClaim || parsed.primaryClaim.length < 20) continue;
      if (parsed.relevanceScore !== undefined && parsed.relevanceScore < 0.3) return null;
      return build(paper, parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Invalid")) throw new Error(msg);
      if (attempt < 2) await sleep(2000);
    }
  }
  return null;
}
