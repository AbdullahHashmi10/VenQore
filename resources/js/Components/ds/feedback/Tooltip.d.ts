import * as React from "react";

/** Hover label for icon-only controls and collapsed sidebar items. */
export interface TooltipProps {
  label: React.ReactNode;
  children?: React.ReactNode;
  side?: "top" | "right";
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
