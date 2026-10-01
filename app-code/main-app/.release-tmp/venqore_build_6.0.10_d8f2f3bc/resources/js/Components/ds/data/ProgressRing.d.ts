import * as React from "react";

/** Donut gauge with a centred figure; sweeps in on mount. */
export interface ProgressRingProps {
  /** 0–100 */
  value?: number;
  size?: number;
  thickness?: number;
  /** Overrides the centre text (defaults to "<value>%") */
  label?: string;
  sublabel?: string;
  color?: string;
  track?: string;
  style?: React.CSSProperties;
}
export declare function ProgressRing(props: ProgressRingProps): JSX.Element;
