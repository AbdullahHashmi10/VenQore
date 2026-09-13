import * as React from "react";

/** Icon-only control for toolbars and card headers. */
export interface IconButtonProps {
  children?: React.ReactNode;
  /** Accessible name — required, the glyph is not a label */
  label: string;
  variant?: "secondary" | "ghost";
  size?: number;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
