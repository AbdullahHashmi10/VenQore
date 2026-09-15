import * as React from "react";

/** Circular avatar; falls back to initials on a deterministic playful hue. */
export interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  /** Mint ring — used for the signed-in user only */
  ring?: boolean;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;

export interface AvatarStackProps {
  people?: Array<string | { name: string; src?: string }>;
  size?: number;
  max?: number;
}
export declare function AvatarStack(props: AvatarStackProps): JSX.Element;
