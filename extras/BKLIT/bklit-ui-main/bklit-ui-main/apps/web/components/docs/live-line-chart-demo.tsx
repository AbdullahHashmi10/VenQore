"use client";

import {
  ChartTooltip,
  LiveLine,
  LiveLineChart,
  type LiveLinePoint,
  LiveXAxis,
  LiveYAxis,
} from "@bklitui/ui/charts";
import { useCallback, useEffect, useRef, useState } from "react";

function useLiveData(initialPrice: number, intervalMs: number) {
  const [data, setData] = useState<LiveLinePoint[]>([]);
  const [value, setValue] = useState(initialPrice);
  const priceRef = useRef(initialPrice);
  const momentumRef = useRef(0);

  useEffect(() => {
    const nowSec = Date.now() / 1000;
    const seed: LiveLinePoint[] = [];
    let p = initialPrice;
    let mom = 0;
    for (let i = 30; i > 0; i--) {
      mom = mom * 0.92 + (Math.random() - 0.48) * 0.012;
      p *= 1 + mom;
      p = Math.max(p, 1);
      seed.push({
        time: nowSec - i * (intervalMs / 1000),
        value: Math.round(p * 100) / 100,
      });
    }
    priceRef.current = p;
    momentumRef.current = mom;
    setData(seed);
    setValue(p);
  }, [initialPrice, intervalMs]);

  useEffect(() => {
    const id = setInterval(() => {
      momentumRef.current =
        momentumRef.current * 0.88 + (Math.random() - 0.48) * 0.008;
      momentumRef.current *= 0.995;
      priceRef.current *= 1 + momentumRef.current;
      priceRef.current = Math.max(priceRef.current, 1);
      const rounded = Math.round(priceRef.current * 100) / 100;
      setData((prev) => {
        const cutoff = Date.now() / 1000 - 60;
        return [
          ...prev.filter((p) => p.time >= cutoff),
          { time: Date.now() / 1000, value: rounded },
        ];
      });
      setValue(rounded);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { data, value };
}

export function LiveLineChartDemo() {
  const { data, value } = useLiveData(142.5, 600);
  const formatUsd = useCallback((v: number) => `$${v.toFixed(2)}`, []);

  return (
    <div className="w-full">
      <LiveLineChart
        data={data}
        margin={{ top: 16, right: 16, bottom: 40, left: 56 }}
        style={{ height: 260 }}
        value={value}
        window={30}
      >
        <LiveLine
          dataKey="value"
          formatValue={formatUsd}
          stroke="var(--chart-line-primary)"
        />
        <ChartTooltip
          content={({ point }) => {
            const date = point.date instanceof Date ? point.date : new Date();
            const time = date.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const val = typeof point.value === "number" ? point.value : 0;
            return (
              <div className="px-3 py-2.5">
                <div className="mb-1.5 font-medium text-popover-foreground text-xs opacity-60">
                  {time}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="ml-auto font-medium text-popover-foreground tabular-nums">
                    {formatUsd(val)}
                  </span>
                </div>
              </div>
            );
          }}
          showDatePill={false}
        />
        <LiveXAxis />
        <LiveYAxis formatValue={formatUsd} position="left" />
      </LiveLineChart>
    </div>
  );
}
