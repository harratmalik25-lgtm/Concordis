"use client";
import { useEffect, useRef, useCallback } from "react";
import { useResearchStore } from "@/lib/store/research.store";
import type { StreamEvent } from "@/lib/types/research.types";

type Props = { query: string };

/**
 * Headless SSE consumer. Subscribes to /api/research and applies
 * each StreamEvent to the Zustand store as it arrives.
 */
export function ResearchStream({ query }: Props) {
  const applyEvent   = useResearchStore(s => s.applyEvent);
  const tick         = useResearchStore(s => s.tick);
  const esRef        = useRef<EventSource | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    esRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!query) return;
    cleanup();

    timerRef.current = setInterval(tick, 1000);

    const es = new EventSource(`/api/research?q=${encodeURIComponent(query)}`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const event = JSON.parse(e.data) as StreamEvent;
        applyEvent(event);
        if (event.type === "consensus:ready" || event.type === "error") cleanup();
      } catch { /* malformed frame — skip */ }
    };

    es.onerror = () => {
      applyEvent({ type: "error", data: { message: "Connection to research stream lost.", retryable: true } });
      cleanup();
    };

    return cleanup;
  }, [query, applyEvent, tick, cleanup]);

  return null;
}
