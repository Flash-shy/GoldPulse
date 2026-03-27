import { buildQuotesWebSocketUrl, defaultApiBase } from "@goldpulse/shared";

/** Next.js inlines `NEXT_PUBLIC_*` in this module at build time. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? defaultApiBase;

export function getQuotesWebSocketUrl(): string {
  return buildQuotesWebSocketUrl({
    apiBase: API_BASE,
    wsUrlOverride: process.env.NEXT_PUBLIC_WS_URL,
  });
}
