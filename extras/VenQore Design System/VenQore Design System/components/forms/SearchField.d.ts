import * as React from "react";

/** Pill search input used in the app top bar. */
export interface SearchFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Keyboard hint rendered as a cap on the right; pass "" to hide */
  shortcut?: string;
  width?: number | string;
  style?: React.CSSProperties;
}
export declare function SearchField(props: SearchFieldProps): JSX.Element;
