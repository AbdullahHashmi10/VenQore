import * as React from "react";

/**
 * Floating panel — the base surface of every VenQore screen.
 * @startingPoint section="Surfaces" subtitle="Card shells: white, mint-filled, ink" viewport="700x260"
 */
export interface CardProps {
  title?: React.ReactNode;
  /** Mono uppercase kicker above the title */
  eyebrow?: React.ReactNode;
  /** Right-aligned header slot — usually a Select, Chip or IconButton */
  action?: React.ReactNode;
  children?: React.ReactNode;
  pad?: number;
  /** surface = white card, accent = mint gradient hero card, ink = near-black feature card */
  tone?: "surface" | "accent" | "ink";
  /** Enable the 2px hover lift (for clickable cards only) */
  lift?: boolean;
  radius?: string;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
