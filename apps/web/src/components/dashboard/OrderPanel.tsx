"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export type OrderKind = "market" | "limit";

export type OrderSide = "buy" | "sell";

type Props = {
  lastMid: number | null;
  onSubmit: (payload: {
    side: OrderSide;
    kind: OrderKind;
    quantityOz: number;
    limitPrice: number | null;
  }) => void;
};

export function OrderPanel({ lastMid, onSubmit }: Props) {
  const baseId = useId();
  const [side, setSide] = useState<OrderSide>("buy");
  const [kind, setKind] = useState<OrderKind>("market");
  const [qty, setQty] = useState("0.1");
  const [limitPx, setLimitPx] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const quantityOz = parseFloat(qty);
    if (Number.isNaN(quantityOz) || quantityOz <= 0) return;
    let limitPrice: number | null = null;
    if (kind === "limit") {
      const lp = parseFloat(limitPx);
      if (Number.isNaN(lp) || lp <= 0) return;
      limitPrice = lp;
    }
    onSubmit({ side, kind, quantityOz, limitPrice });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
    >
      <h3 className="mb-3 text-sm font-medium text-zinc-300">下单</h3>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            side === "buy"
              ? "border-emerald-600 bg-emerald-950/50 text-emerald-300"
              : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          买入
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            side === "sell"
              ? "border-red-600 bg-red-950/50 text-red-300"
              : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          卖出
        </button>
      </div>

      <div className="mb-3 flex rounded-lg border border-zinc-800 p-0.5">
        {(["market", "limit"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
              kind === k ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {k === "market" ? "市价" : "限价"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor={`${baseId}-qty`} className="mb-1 block text-xs text-zinc-500">
            数量（盎司）
          </label>
          <input
            id={`${baseId}-qty`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/60"
            inputMode="decimal"
          />
        </div>
        {kind === "limit" && (
          <div>
            <label htmlFor={`${baseId}-lp`} className="mb-1 block text-xs text-zinc-500">
              限价
            </label>
            <input
              id={`${baseId}-lp`}
              value={limitPx}
              onChange={(e) => setLimitPx(e.target.value)}
              placeholder={lastMid != null ? lastMid.toFixed(2) : "例如 2650.00"}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/60"
              inputMode="decimal"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-amber-500/90 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
      >
        提交订单
      </button>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
        演示环境：订单仅保存在浏览器内存，未调用后端撮合。
      </p>
    </form>
  );
}
