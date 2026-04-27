import { NextRequest } from "next/server";
import { sanitizeQuery }   from "@/lib/utils/sanitize";
import { planQuery, synthesizeConsensus } from "@/lib/agents/orchestrator";
import { fetchPapers, fetchWikiContext }  from "@/lib/agents/fetcher";
import { analyzePaper }    from "@/lib/agents/analyzer";
import type { StreamEvent, PaperAnalysis } from "@/lib/types/research.types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

function classifyQuery(query: string): "scientific" | "lifestyle" | "factual" | "general" {
  const q = query.toLowerCase();
  if (/evidence|rct|study|research|clinical|trial|meta.?analysis|systematic|mechanism|efficacy|randomized/.test(q))
    return "scientific";
  if (/supplement|vitamin|mineral|protein|creatine|caffeine|magnesium|omega|collagen|probiotic|melatonin|adapalene|tretinoin|retinol|sleep|fast|diet|exercise|workout|sauna|cold|testosterone|cortisol|insulin|glucose|inflammation|cancer|diabetes|hypertension|depression|anxiety|alzheimer|dementia|obesity|cardiovascular|cholesterol|blood pressure|immune/.test(q))
    return "lifestyle";
  if (/why is|how does|what is|who invented|when did|history of|explain|define/.test(q))
    return "factual";
  return "general";
}

async function generateDirectAnswer(query: string, wikiContext: string): Promise<string> {
  const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No GROQ_API_KEY");

  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are Concordis, a knowledgeable research assistant. Answer the question clearly, accurately, and helpfully. If scientific evidence exists, mention key findings. If it is general knowledge, answer directly. Be concise and note uncertainty when relevant.${wikiContext ? `\n\nBackground:\n${wikiContext}` : ""}`,
        },
        { role: "user", content: query },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message.content ?? "";
}

type RawPaper = { pmid: string; title: string; abstract: string; year: number; journal: string; doi: string };

function stubAnalysis(paper: RawPaper): PaperAnalysis {
  return {
    doi: paper.doi, title: paper.title, year: paper.year, journal: paper.journal,
    studyType: "Cohort", sampleSize: null, effectSize: null,
    primaryClaim: paper.abstract.slice(0, 200).split(".")[0] ?? `Study from ${paper.journal} (${paper.year})`,
    limitations: ["Full analysis unavailable"], conflictOfInterest: false,
    grade: "Low", gradeRationale: "Grade defaulted", relevanceScore: 0.5,
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("q") ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try { controller.enqueue(encode(event)); } catch { /* closed */ }
      };

      try {
        const query   = sanitizeQuery(raw);
        const qType   = classifyQuery(query);
        const wikiCtx = await fetchWikiContext(query);

        // Factual/general → skip PubMed, answer directly with AI
        if (qType === "factual" || qType === "general") {
          send({ type: "orchestrator:plan", data: { subQuestions: [query], meshTerms: [] } });
          send({ type: "papers:fetched", data: { count: 0 } });
          const answer = await generateDirectAnswer(query, wikiCtx);
          send({
            type: "consensus:ready",
            data: {
              query,
              consensusStatement: answer,
              confidenceLevel: "Low", confidencePercent: 35,
              keyFindings: [], dissent: null,
              practicalRecommendation: "For health decisions, consult a qualified professional.",
              papers: [], searchTermsUsed: [], generatedAt: new Date().toISOString(),
            },
          });
          controller.close();
          return;
        }

        // Scientific/lifestyle → full PubMed pipeline
        const plan = await planQuery(query);
        send({ type: "orchestrator:plan", data: plan });

        const rawPapers = await fetchPapers(query, plan.meshTerms);
        send({ type: "papers:fetched", data: { count: rawPapers.length } });

        if (rawPapers.length === 0) {
          const answer = await generateDirectAnswer(query, wikiCtx);
          send({
            type: "consensus:ready",
            data: {
              query,
              consensusStatement: answer,
              confidenceLevel: "Very Low", confidencePercent: 12,
              keyFindings: [], dissent: null,
              practicalRecommendation: "No published literature found. Consult a healthcare professional.",
              papers: [], searchTermsUsed: plan.meshTerms, generatedAt: new Date().toISOString(),
            },
          });
          controller.close();
          return;
        }

        const analyzed: PaperAnalysis[] = [];
        for (const paper of rawPapers) {
          try {
            const result = await Promise.race([
              analyzePaper(paper, query, wikiCtx),
              new Promise<null>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
            ]);
            const final = result ?? stubAnalysis(paper);
            analyzed.push(final);
            send({ type: "paper:analyzed", data: final });
          } catch {
            const stub = stubAnalysis(paper);
            analyzed.push(stub);
            send({ type: "paper:analyzed", data: stub });
          }
        }

        const relevant = analyzed.filter(p => p.relevanceScore >= 0.25);
        const toSynthesize = relevant.length > 0 ? relevant : analyzed;
        const consensus = await synthesizeConsensus(query, toSynthesize, plan.meshTerms, wikiCtx);
        send({ type: "consensus:ready", data: consensus });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error.";
        send({ type: "error", data: { message, retryable: false } });
      } finally {
        try { controller.close(); } catch { /* closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
