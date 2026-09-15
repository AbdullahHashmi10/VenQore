import * as React from "react";

export interface DataTableColumn {
  key: string;
  label: string;
  /** Right-aligns and switches the cell to tabular mono */
  numeric?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: any) => React.ReactNode;
}

/**
 * Ledger-grade table: horizontal rules only, mono figures, optional totals row.
 * @startingPoint section="Data" subtitle="Invoice / ledger table with totals row" viewport="700x300"
 */
export interface DataTableProps {
  columns?: DataTableColumn[];
  rows?: any[];
  onRowClick?: (row: any) => void;
  /** Map of column key → total value; renders the rule-topped totals row */
  totals?: Record<string, React.ReactNode>;
  style?: React.CSSProperties;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
