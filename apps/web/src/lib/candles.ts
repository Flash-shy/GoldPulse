import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export const DEFAULT_INTERVAL_SEC = 60;

export type HistoryRow = { recorded_at: string; mid: string | number };

/** Group backend ticks into OHLC candles by fixed time buckets. */
export function aggregateHistoryToCandles(
  rows: HistoryRow[],
  intervalSec: number
): CandlestickData[] {
  const groups = new Map<number, number[]>();
  for (const r of rows) {
    const t = Math.floor(new Date(r.recorded_at).getTime() / 1000);
    const bucket = Math.floor(t / intervalSec) * intervalSec;
    const m = parseFloat(String(r.mid));
    if (Number.isNaN(m)) continue;
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket)!.push(m);
  }
  const buckets = [...groups.keys()].sort((a, b) => a - b);
  return buckets.map((bucket) => {
    const mids = groups.get(bucket)!;
    const open = mids[0]!;
    const close = mids[mids.length - 1]!;
    const high = Math.max(...mids);
    const low = Math.min(...mids);
    return {
      time: bucket as UTCTimestamp,
      open,
      high,
      low,
      close,
    };
  });
}

/** Incremental candle updates from live ticks (same bucket = update last bar). */
export class LiveCandleAggregator {
  private intervalSec: number;
  private currentBucket: number | null = null;
  private last: CandlestickData | null = null;

  constructor(intervalSec: number = DEFAULT_INTERVAL_SEC) {
    this.intervalSec = intervalSec;
  }

  resetFromCandles(candles: CandlestickData[]) {
    if (candles.length === 0) {
      this.currentBucket = null;
      this.last = null;
      return;
    }
    const last = candles[candles.length - 1]!;
    this.currentBucket = last.time as number;
    this.last = { ...last };
  }

  /** timeSec = unix seconds */
  onTick(timeSec: number, price: number): CandlestickData | null {
    if (Number.isNaN(price)) return null;
    const bucket = Math.floor(timeSec / this.intervalSec) * this.intervalSec;

    if (this.currentBucket === null || bucket > this.currentBucket) {
      this.currentBucket = bucket;
      this.last = {
        time: bucket as UTCTimestamp,
        open: price,
        high: price,
        low: price,
        close: price,
      };
      return this.last;
    }

    if (!this.last) return null;
    this.last = {
      time: this.last.time,
      open: this.last.open,
      high: Math.max(this.last.high, price),
      low: Math.min(this.last.low, price),
      close: price,
    };
    return this.last;
  }
}
