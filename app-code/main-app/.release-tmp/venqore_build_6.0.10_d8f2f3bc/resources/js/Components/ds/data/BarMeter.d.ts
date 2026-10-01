import * as React from "react";

/** Horizontal meter row — label + dot on the left, tabular value on the right. */
export interface BarMeterProps {
  label: string;
  value: number;
  max?: number;
  /** Overrides the right-hand readout */
  display?: string;
  color?: string;
  style?: React.CSSProperties;
}
export declare function BarMeter(props: BarMeterProps): JSX.Element;
