/** Default when no env is set (simulator / local dev). */
export const defaultApiBase = "http://127.0.0.1:8000";

export type BuildQuotesWsUrlOptions = {
  apiBase: string;
  wsUrlOverride?: string;
};

/** Build `ws(s)://host/ws/quotes` from HTTP API base, or use explicit WS URL. */
export function buildQuotesWebSocketUrl(opts: BuildQuotesWsUrlOptions): string {
  if (opts.wsUrlOverride) {
    return opts.wsUrlOverride;
  }
  const u = new URL(opts.apiBase);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/ws/quotes";
  u.search = "";
  u.hash = "";
  return u.toString();
}
