import * as React from "react";

/**
 * KPI tile — mono uppercase label, big tabular figure, delta chip.
 * @startingPoint section="Data" subtitle="KPI tiles with delta chips" viewport="700x200"
 */
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Small trailing unit ("items", "net / revenue") */
  unit?: string;
  /** Delta text, e.g. "12.4%" — rendered with an arrow glyph AND a sign */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  caption?: string;
  icon?: React.ReactNode;
  /** accent = the one mint-filled focal tile per screen */
  tone?: "surface" | "accent";
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
