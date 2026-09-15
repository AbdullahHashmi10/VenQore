import * as React from "react";

/** Text field with the label above it. Placeholder is never a label substitute. */
export interface InputProps {
  label?: string;
  hint?: string;
  /** Error message — turns the border and the hint red */
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: "md" | "lg";
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
