import type { QuoteMessage } from "./types/quote";

export function parseQuoteMessage(raw: unknown): QuoteMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.type !== "quote") return null;
  if (typeof o.symbol !== "string") return null;
  if (typeof o.mid !== "string") return null;
  if (typeof o.bid !== "string") return null;
  if (typeof o.ask !== "string") return null;
  if (typeof o.source !== "string") return null;
  if (typeof o.recorded_at !== "string") return null;
  return {
    type: "quote",
    symbol: o.symbol,
    mid: o.mid,
    bid: o.bid,
    ask: o.ask,
    source: o.source,
    recorded_at: o.recorded_at,
  };
}
