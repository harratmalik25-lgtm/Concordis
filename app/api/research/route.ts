import { NextRequest } from "next/server";
import { sanitizeQuery } from "@/lib/utils/sanitize";
import { planQuery, synthesizeConsensus } from "@/lib/agents/orchestrator";
import { fetchPapers, fetchWikiContext } from "@/lib/agents/fetcher";
import { analyzePaper } from "@/lib/agents/analyzer";
import type { StreamEvent } from "@/lib/types/research.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("q") ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(new TextEncoder().encode(encode(event)));

      try {
        const query = sanitizeQuery(raw);

        const plan = await planQuery(query);
        send({ type: "orchestrator:plan", data: plan });

        const [rawPapers, wikiContext] = await Promise.all([
          fetchPapers(query),
          fetchWikiContext(query),
        ]);
        send({ type: "papers:fetched", data: { count: rawPapers.length } });

        const analyzed = [];
        for (const paper of rawPapers) {
          const result = await analyzePaper(paper, query, wikiContext);
          if (result) {
            analyzed.push(result);
            send({ type: "paper:analyzed", data: result });
          }
        }

        const relevant = analyzed.filter(p =>
          p.relevanceScore >= 0.4 &&
          p.primaryClaim.length > 30 &&
          !p.primaryClaim.toLowerCase().includes("did not investigate")
        );

        if (relevant.length === 0) {
          send({ type: "error", data: { message: "No relevant papers found. Try rephrasing your query.", retryable: true } });
          controller.close();
          return;
        }

        const consensus = await synthesizeConsensus(query, relevant, plan.meshTerms, wikiContext);
        send({ type: "consensus:ready", data: consensus });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error.";
        send({ type: "error", data: { message, retryable: false } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
