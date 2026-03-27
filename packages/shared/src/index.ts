export {
  buildQuotesWebSocketUrl,
  defaultApiBase,
  type BuildQuotesWsUrlOptions,
} from "./config";
export { fetchPriceHistory } from "./api/quotes";
export { parseQuoteMessage } from "./parseQuote";
export type { PriceHistoryRow, QuoteMessage, WsStatus } from "./types/quote";

export const GOLDPULSE_SHARED_VERSION = "0.0.2";
