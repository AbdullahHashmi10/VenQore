import React from 'react';
import { Button } from '@/Components/ds';

/** Breeze's secondary button, backed by the V6 `Button`. See PrimaryButton. */
/*
 * `className` is accepted and DROPPED on purpose. The V6 `Button` declares no
 * such prop — it styles itself entirely through tokens — so React was
 * discarding it silently anyway (ds/no-unknown-prop). Swallowing it here is
 * the honest version of what already happened, and it keeps old call sites
 * compiling. New code should use `variant` and `size`, not utility classes.
 */
export default function SecondaryButton({ className: _ignoredClassName, disabled, children, ...props }) {
    return (
        <Button variant="secondary" disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
