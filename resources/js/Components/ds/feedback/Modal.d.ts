import * as React from "react";

/** Centred dialog: 28px radius, blurred scrim, spring entrance. */
export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Right-aligned action row */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** 560 confirm · 720 form · 960 data */
  width?: number;
}
export declare function Modal(props: ModalProps): JSX.Element;
