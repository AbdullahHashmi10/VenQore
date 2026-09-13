import * as React from "react";

/** Business-activity feed row with a signed amount. */
export interface ActivityRowProps {
  title: string;
  meta?: string;
  /** Pre-formatted, signed: "+Rs 5,922.00" / "−Rs 1,700.00" */
  amount?: string;
  tone?: "in" | "out" | "neutral";
  icon?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function ActivityRow(props: ActivityRowProps): JSX.Element;
