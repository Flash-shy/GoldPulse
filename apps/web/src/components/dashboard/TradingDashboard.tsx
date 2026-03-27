"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutDashboard, LineChart } from "lucide-react";
import type { CandlestickData } from "lightweight-charts";

import { fetchPriceHistory } from "@goldpulse/shared";

import { API_BASE, getQuotesWebSocketUrl } from "@/lib/env";
import {
  aggregateHistoryToCandles,
  DEFAULT_INTERVAL_SEC,
  LiveCandleAggregator,
} from "@/lib/candles";
import { useQuoteWebSocket } from "@/hooks/useQuoteWebSocket";
import { GoldChart } from "@/components/dashboard/GoldChart";
import { OrderPanel } from "@/components/dashboard/OrderPanel";
import type { PositionRow } from "@/components/dashboard/PositionsPanel";
import { PositionsPanel } from "@/components/dashboard/PositionsPanel";
import { PriceTicker } from "@/components/dashboard/PriceTicker";

export function TradingDashboard() {
  const wsUrl = useMemo(() => getQuotesWebSocketUrl(), []);
  const { quote, status } = useQuoteWebSocket(wsUrl);

  const [historyCandles, setHistoryCandles] = useState<CandlestickData[]>([]);
  const [liveCandle, setLiveCandle] = useState<CandlestickData | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const aggRef = useRef(new LiveCandleAggregator(DEFAULT_INTERVAL_SEC));

  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [pendingLimits, setPendingLimits] = useState<
    {
      id: string;
      side: "buy" | "sell";
      quantityOz: number;
      limitPrice: number;
    }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchPriceHistory({ baseUrl: API_BASE, limit: 500 });
        if (cancelled) return;
        const candles = aggregateHistoryToCandles(rows, DEFAULT_INTERVAL_SEC);
        setHistoryCandles(candles);
        aggRef.current.resetFromCandles(candles);
        setHistoryError(null);
      } catch (e) {
        if (!cancelled) {
          setHistoryError(e instanceof Error ? e.message : "加载历史失败");
          setHistoryCandles([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!quote) return;
    const t = Math.floor(new Date(quote.recorded_at).getTime() / 1000);
    const p = parseFloat(quote.mid);
    if (Number.isNaN(p)) return;
    const c = aggRef.current.onTick(t, p);
    if (c) setLiveCandle({ ...c });
  }, [quote]);

  const lastMid = quote ? parseFloat(quote.mid) : null;

  const onOrder = useCallback(
    (payload: {
      side: "buy" | "sell";
      kind: "market" | "limit";
      quantityOz: number;
      limitPrice: number | null;
    }) => {
      if (payload.kind === "limit" && payload.limitPrice != null) {
        const lp = payload.limitPrice;
        setPendingLimits((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            side: payload.side,
            quantityOz: payload.quantityOz,
            limitPrice: lp,
          },
        ]);
        return;
      }
      if (lastMid == null || Number.isNaN(lastMid)) return;
      setPositions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          side: payload.side,
          quantityOz: payload.quantityOz,
          entryPrice: lastMid,
        },
      ]);
    },
    [lastMid]
  );

  const onClosePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const cancelPending = useCallback((id: string) => {
    setPendingLimits((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <LayoutDashboard className="h-5 w-5 text-amber-400" aria-hidden />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">GoldPulse</span>
          <span className="text-[11px] text-zinc-500">模拟交易 · XAU/USD</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <LineChart className="h-4 w-4" />
          1 分钟 K
        </div>
      </header>

      {historyError && (
        <div className="border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-xs text-amber-200/90">
          历史行情：{historyError}（图表将仅从 WebSocket 开始累积）
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <main className="flex min-h-[420px] min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col px-1">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>K 线图</span>
              <span className="font-mono text-zinc-600">TradingView Lightweight Charts</span>
            </div>
            <GoldChart candles={historyCandles} liveCandle={liveCandle} />
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[22rem] lg:overflow-y-auto">
          <PriceTicker quote={quote} status={status} />
          <OrderPanel lastMid={lastMid} onSubmit={onOrder} />
          <PositionsPanel
            positions={positions}
            lastMid={lastMid}
            onClose={onClosePosition}
          />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">限价挂单</h3>
            {pendingLimits.length === 0 ? (
              <p className="text-xs text-zinc-600">无挂单</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {pendingLimits.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2"
                  >
                    <span>
                      <span className={o.side === "buy" ? "text-emerald-400" : "text-red-400"}>
                        {o.side === "buy" ? "买" : "卖"}
                      </span>{" "}
                      {o.quantityOz} oz @{" "}
                      <span className="font-mono">{o.limitPrice.toFixed(2)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelPending(o.id)}
                      className="text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                    >
                      撤销
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
