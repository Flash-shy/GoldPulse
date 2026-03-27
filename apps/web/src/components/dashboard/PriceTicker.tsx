"use client";

import { Activity } from "lucide-react";

import type { QuoteMessage, WsStatus } from "@/hooks/useQuoteWebSocket";

type Props = {
  quote: QuoteMessage | null;
  status: WsStatus;
};

function statusLabel(s: WsStatus) {
  switch (s) {
    case "connecting":
      return "连接中…";
    case "open":
      return "实时";
    case "closed":
      return "重连中";
    case "error":
      return "连接异常";
    default:
      return "—";
  }
}

function statusDot(s: WsStatus) {
  if (s === "open") return "bg-emerald-500";
  if (s === "connecting") return "bg-amber-400 animate-pulse";
  return "bg-red-500";
}

export function PriceTicker({ quote, status }: Props) {
  const mid = quote ? parseFloat(quote.mid) : null;
  const bid = quote ? parseFloat(quote.bid) : null;
  const ask = quote ? parseFloat(quote.ask) : null;
  const spread =
    mid != null && bid != null && ask != null ? (ask - bid).toFixed(4) : "—";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Activity className="h-4 w-4 text-amber-400" aria-hidden />
          XAU/USD
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`inline-block h-2 w-2 rounded-full ${statusDot(status)}`} />
          {statusLabel(status)}
        </div>
      </div>
      <div className="font-mono text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums">
        {mid != null ? mid.toFixed(2) : "—.——"}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>
          <dt className="text-zinc-600">Bid</dt>
          <dd className="font-mono text-emerald-400/90 tabular-nums">
            {bid != null ? bid.toFixed(2) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-600">Ask</dt>
          <dd className="font-mono text-red-400/90 tabular-nums">
            {ask != null ? ask.toFixed(2) : "—"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-600">点差 / 来源</dt>
          <dd className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-300">
            <span className="font-mono tabular-nums">{spread}</span>
            <span className="text-zinc-500">{quote?.source ?? "—"}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
