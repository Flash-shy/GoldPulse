"use client";

import { useEffect, useRef, useState } from "react";

export type QuoteMessage = {
  type: "quote";
  symbol: string;
  mid: string;
  bid: string;
  ask: string;
  source: string;
  recorded_at: string;
};

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export function useQuoteWebSocket(wsUrl: string) {
  const [quote, setQuote] = useState<QuoteMessage | null>(null);
  const [status, setStatus] = useState<WsStatus>("idle");
  const [reconnectTick, setReconnectTick] = useState(0);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (cancelled) return;
        attemptRef.current = 0;
        setStatus("open");
        try {
          ws?.send("ping");
        } catch {
          /* ignore */
        }
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as QuoteMessage;
          if (data.type === "quote") {
            setQuote(data);
          }
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => {
        if (!cancelled) setStatus("error");
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus("closed");
        const delay = Math.min(30_000, 1000 * 2 ** attemptRef.current);
        attemptRef.current += 1;
        timer = setTimeout(() => {
          if (!cancelled) setReconnectTick((t) => t + 1);
        }, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, [wsUrl, reconnectTick]);

  return { quote, status };
}
