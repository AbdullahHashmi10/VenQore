import React from 'react';
import { Button } from '@/Components/ds';

/** Breeze's destructive button, backed by the V6 `Button`. See PrimaryButton.
 *
 *  A destructive confirm should name the object it destroys in its label —
 *  "Delete invoice INV-2291", not "Confirm" (DESIGN-RULES v3.0 §13). */
/*
 * `className` is accepted and DROPPED on purpose. The V6 `Button` declares no
 * such prop — it styles itself entirely through tokens — so React was
 * discarding it silently anyway (ds/no-unknown-prop). Swallowing it here is
 * the honest version of what already happened, and it keeps old call sites
 * compiling. New code should use `variant` and `size`, not utility classes.
 */
export default function DangerButton({ className: _ignoredClassName, disabled, children, ...props }) {
    return (
        <Button variant="danger" disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
