import { useEffect, useRef, useState } from "react";

import { parseQuoteMessage, type QuoteMessage, type WsStatus } from "@goldpulse/shared";

export type { QuoteMessage, WsStatus };

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
          const data = parseQuoteMessage(JSON.parse(ev.data as string));
          if (data) setQuote(data);
        } catch {
          /* ignore */
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
