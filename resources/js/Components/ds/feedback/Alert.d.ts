import * as React from "react";

/** Inline alert row for the dashboard alerts rail and form-level errors. */
export interface AlertProps {
  children?: React.ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  /** Right-aligned action slot (usually a small ghost Button) */
  action?: React.ReactNode;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
export declare function Alert(props: AlertProps): JSX.Element;
