import { buildQuotesWebSocketUrl, defaultApiBase } from "@goldpulse/shared";

/** Next.js inlines `NEXT_PUBLIC_*` in this module at build time. Empty string counts as unset (CI vars may be ""). */
function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (raw == null || String(raw).trim() === "") return defaultApiBase;
  return raw.trim();
}

export const API_BASE = resolveApiBase();

export function getQuotesWebSocketUrl(): string {
  return buildQuotesWebSocketUrl({
    apiBase: API_BASE,
    wsUrlOverride: process.env.NEXT_PUBLIC_WS_URL,
  });
}
