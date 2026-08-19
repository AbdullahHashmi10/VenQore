import * as React from "react";

/**
 * Pill-shaped action button. Primary carries the mint glow; only one per view.
 * @startingPoint section="Core" subtitle="Pill buttons — primary, secondary, soft, ghost, danger" viewport="700x220"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** primary = mint fill + glow, secondary = white card, soft = tinted wash, ghost = bare, danger */
  variant?: "primary" | "secondary" | "soft" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Leading glyph node */
  icon?: React.ReactNode;
  /** Trailing glyph node — nudges right on hover */
  iconAfter?: React.ReactNode;
  full?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
