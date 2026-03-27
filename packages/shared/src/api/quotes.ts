import type { PriceHistoryRow } from "../types/quote";

export async function fetchPriceHistory(params: {
  baseUrl: string;
  limit?: number;
}): Promise<PriceHistoryRow[]> {
  const limit = params.limit ?? 500;
  const base = params.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/quotes/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<PriceHistoryRow[]>;
}
