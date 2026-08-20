"use client";

import { Gauge } from "@bklitui/ui/charts";

export function GaugeChartDemo() {
  return (
    <div className="mx-auto w-full min-w-[300px] max-w-lg py-4">
      <Gauge
        centerValue={428_000}
        defaultLabel="ARR run rate"
        formatOptions={{
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }}
        inactiveFillOpacity={0.4}
        spacing={25}
        value={66}
      />
    </div>
  );
}
