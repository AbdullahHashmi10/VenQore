import * as React from "react";

/** Status pill with a dot; the word always carries the meaning, not the colour. */
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  /** Show the leading 6px dot (default true) */
  dot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
