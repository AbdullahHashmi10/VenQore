import * as React from "react";

/** Light/dark switch; sets data-theme on <html> and persists to localStorage. */
export interface ThemeToggleProps {
  size?: number;
  storageKey?: string;
  style?: React.CSSProperties;
}
export declare function ThemeToggle(props: ThemeToggleProps): JSX.Element;
