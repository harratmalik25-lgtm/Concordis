import { NextRequest } from "next/server";
import { sanitizeQuery } from "@/lib/utils/sanitize";
import { planQuery, synthesizeConsensus } from "@/lib/agents/orchestrator";
import { fetchPapers, fetchWikiContext } from "@/lib/agents/fetcher";
import { analyzePaper } from "@/lib/agents/analyzer";
import type { StreamEvent } from "@/lib/types/research.types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("q") ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try { controller.enqueue(encode(event)); } catch { /* stream closed */ }
      };

      try {
        const query = sanitizeQuery(raw);

        const plan = await planQuery(query);
        send({ type: "orchestrator:plan", data: plan });

        const [rawPapers, wikiContext] = await Promise.all([
          fetchPapers(query),
          fetchWikiContext(query),
        ]);
        send({ type: "papers:fetched", data: { count: rawPapers.length } });

        if (rawPapers.length === 0) {
          send({ type: "error", data: { message: "No papers found. Try different keywords.", retryable: true } });
          controller.close();
          return;
        }

        const results = await Promise.allSettled(
          rawPapers.map(paper => analyzePaper(paper, query, wikiContext))
        );

        const analyzed = results
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof analyzePaper>>> =>
            r.status === "fulfilled" && r.value !== null)
          .map(r => r.value!);

        for (const paper of analyzed) {
          send({ type: "paper:analyzed", data: paper });
        }

        const relevant = analyzed.filter(p => p.relevanceScore >= 0.25);
        const toSynthesize = relevant.length > 0 ? relevant : analyzed;

        if (toSynthesize.length === 0) {
          send({ type: "error", data: { message: "Could not analyze any papers. Try rephrasing.", retryable: true } });
          controller.close();
          return;
        }

        const consensus = await synthesizeConsensus(query, toSynthesize, plan.meshTerms, wikiContext);
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
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-store",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
