import * as React from "react";

/**
 * Chunky rounded bar chart; unhighlighted bars sit in the track colour so one
 * bar can carry the story.
 */
export interface BarChartProps {
  data?: number[];
  labels?: string[];
  height?: number;
  color?: string;
  /** Index of the bar painted in the series colour (-1 = all track) */
  highlight?: number;
  style?: React.CSSProperties;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
