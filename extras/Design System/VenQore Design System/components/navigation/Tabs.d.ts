import * as React from "react";

/** Segmented control with a sliding thumb. */
export interface TabsProps {
  tabs?: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
