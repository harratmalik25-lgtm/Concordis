import { NextRequest } from "next/server";
import { sanitizeQuery } from "@/lib/utils/sanitize";
import { planQuery, synthesizeConsensus } from "@/lib/agents/orchestrator";
import { fetchPapers, fetchWikiContext } from "@/lib/agents/fetcher";
import { analyzePaper } from "@/lib/agents/analyzer";
import type { StreamEvent, PaperAnalysis } from "@/lib/types/research.types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

function stubAnalysis(paper: { pmid: string; title: string; abstract: string; year: number; journal: string; doi: string }): PaperAnalysis {
  return {
    doi: paper.doi, title: paper.title, year: paper.year, journal: paper.journal,
    studyType: "Cohort", sampleSize: null, effectSize: null,
    primaryClaim: paper.abstract.slice(0, 200).split(".")[0] ?? `Study from ${paper.journal} (${paper.year})`,
    limitations: ["Full analysis unavailable"], conflictOfInterest: false,
    grade: "Low", gradeRationale: "Grade defaulted — automated analysis unavailable",
    relevanceScore: 0.5,
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("q") ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try { controller.enqueue(encode(event)); } catch { /* already closed */ }
      };

      try {
        const query = sanitizeQuery(raw);

        const plan = await planQuery(query);
        send({ type: "orchestrator:plan", data: plan });

        const [rawPapers, wikiContext] = await Promise.all([
          fetchPapers(query, plan.meshTerms),
          fetchWikiContext(query),
        ]);
        send({ type: "papers:fetched", data: { count: rawPapers.length } });

        if (rawPapers.length === 0) {
          send({ type: "error", data: { message: "No papers found. Try different keywords.", retryable: true } });
          controller.close();
          return;
        }

        const analyzed: PaperAnalysis[] = [];

        for (const paper of rawPapers) {
          try {
            const result = await Promise.race([
              analyzePaper(paper, query, wikiContext),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
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

        if (analyzed.length === 0) {
          send({ type: "error", data: { message: "All paper analyses failed. Check your API keys.", retryable: false } });
          controller.close();
          return;
        }

        const sorted = analyzed.sort((a, b) => b.relevanceScore - a.relevanceScore);
        const consensus = await synthesizeConsensus(query, sorted, plan.meshTerms, wikiContext);
        send({ type: "consensus:ready", data: consensus });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error.";
        send({ type: "error", data: { message, retryable: false } });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
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
