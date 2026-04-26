import { NextRequest } from "next/server";
import { sanitizeQuery }      from "@/lib/utils/sanitize";
import { planQuery, synthesizeConsensus } from "@/lib/agents/orchestrator";
import { fetchPapers }        from "@/lib/agents/fetcher";
import { analyzePaper }       from "@/lib/agents/analyzer";
import type { StreamEvent }   from "@/lib/types/research.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * SSE streaming research endpoint.
 * GET /api/research?q=<query>
 * Streams StreamEvent objects as server-sent events.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("q") ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(new TextEncoder().encode(encode(event)));

      try {
        const query = sanitizeQuery(raw);

        // Step 1: Orchestrate
        const plan = await planQuery(query);
        send({ type: "orchestrator:plan", data: plan });

        const allTerms = [...plan.meshTerms, ...plan.subQuestions];

        // Step 2: Fetch papers
        const rawPapers = await fetchPapers(allTerms);
        send({ type: "papers:fetched", data: { count: rawPapers.length } });

        // Step 3: Analyze each paper — emit as they complete
        const analyzed = [];
        for (const raw of rawPapers) {
          const result = await analyzePaper(raw, query);
          if (result) {
            analyzed.push(result);
            send({ type: "paper:analyzed", data: result });
          }
        }

        if (analyzed.length === 0) {
          send({ type: "error", data: { message: "No papers could be analyzed. Try a different query.", retryable: true } });
          controller.close();
          return;
        }

        // Step 4: Synthesize consensus
        const consensus = await synthesizeConsensus(query, analyzed, plan.meshTerms);
        send({ type: "consensus:ready", data: consensus });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error occurred.";
        send({ type: "error", data: { message, retryable: false } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
