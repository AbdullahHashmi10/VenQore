import * as React from "react";

/** Empty region: tinted glyph, what goes here, one action. */
export interface EmptyStateProps {
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;

/** Loading shimmer block. */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: string;
  style?: React.CSSProperties;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
