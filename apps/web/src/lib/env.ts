/** Browser-safe API base URL (Next.js inlines NEXT_PUBLIC_* at build time). */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export function getQuotesWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";
  const u = new URL(base);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/ws/quotes";
  u.search = "";
  u.hash = "";
  return u.toString();
}
