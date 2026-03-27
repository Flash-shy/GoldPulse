export type QuoteMessage = {
  type: "quote";
  symbol: string;
  mid: string;
  bid: string;
  ask: string;
  source: string;
  recorded_at: string;
};

/** Row from `GET /api/v1/quotes/history` */
export type PriceHistoryRow = {
  id: string;
  symbol: string;
  mid: string;
  bid: string | null;
  ask: string | null;
  source: string;
  recorded_at: string;
};

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";
