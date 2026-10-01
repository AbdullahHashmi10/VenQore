import * as React from "react";

/** Left-rail navigation row. */
export interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  /** Icon-only mode for the 76px rail */
  collapsed?: boolean;
  /** Count pill on the right */
  badge?: number | string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function SidebarItem(props: SidebarItemProps): JSX.Element;
