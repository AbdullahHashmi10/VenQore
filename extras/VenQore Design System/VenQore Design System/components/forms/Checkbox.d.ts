import * as React from "react";

/** Checkbox; the tick springs in. */
export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
