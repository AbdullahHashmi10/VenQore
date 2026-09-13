import * as React from "react";

/** Bottom-right confirmation toast; springs in, 4s auto-dismiss for success. */
export interface ToastProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "success" | "warning" | "danger";
  onDismiss?: () => void;
  visible?: boolean;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
