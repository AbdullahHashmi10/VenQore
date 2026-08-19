import * as React from "react";

/** Single-series area + line chart, no chart library. Draws itself in on mount. */
export interface AreaChartProps {
  data?: number[];
  /** X labels, evenly distributed under the plot */
  labels?: string[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  valueFormat?: (v: number) => string;
  style?: React.CSSProperties;
}
export declare function AreaChart(props: AreaChartProps): JSX.Element;
