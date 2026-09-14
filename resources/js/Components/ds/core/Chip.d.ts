import * as React from "react";

/** Selectable filter chip with an optional count. */
export interface ChipProps {
  children?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  /** Optional trailing count badge */
  count?: number;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
