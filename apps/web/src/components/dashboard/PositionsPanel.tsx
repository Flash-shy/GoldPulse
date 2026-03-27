"use client";

import { Trash2, Wallet } from "lucide-react";

export type PositionRow = {
  id: string;
  side: "buy" | "sell";
  quantityOz: number;
  entryPrice: number;
};

type Props = {
  positions: PositionRow[];
  lastMid: number | null;
  onClose: (id: string) => void;
};

function pnlUsd(row: PositionRow, mid: number | null) {
  if (mid == null) return null;
  const dir = row.side === "buy" ? 1 : -1;
  return dir * (mid - row.entryPrice) * row.quantityOz;
}

export function PositionsPanel({ positions, lastMid, onClose }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <Wallet className="h-4 w-4 text-amber-400" />
        持仓
      </div>
      {positions.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-600">暂无持仓</p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
          {positions.map((p) => {
            const u = pnlUsd(p, lastMid);
            const uFmt =
              u == null ? "—" : `${u >= 0 ? "+" : ""}${u.toFixed(2)} USD`;
            const uColor =
              u == null ? "text-zinc-500" : u >= 0 ? "text-emerald-400" : "text-red-400";
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-2 py-2"
              >
                <div>
                  <div className="font-medium text-zinc-200">
                    <span
                      className={
                        p.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {p.side === "buy" ? "多" : "空"}
                    </span>{" "}
                    {p.quantityOz} oz @{" "}
                    <span className="font-mono tabular-nums">
                      {p.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className={`mt-0.5 font-mono tabular-nums ${uColor}`}>
                    浮动 {uFmt}
                  </div>
                </div>
                <button
                  type="button"
                  title="平仓"
                  onClick={() => onClose(p.id)}
                  className="shrink-0 rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
