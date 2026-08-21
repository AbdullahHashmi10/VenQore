import React from 'react';
import { Button } from '@/Components/ds';

/**
 * Breeze's primary button, now backed by the V6 `Button`.
 *
 * The original was a hand-styled `<button>` with its own indigo, its own
 * radius and its own focus ring, and it had zero page imports — the app never
 * adopted it. Rather than delete the name and break the next person who reaches
 * for it, it forwards to the design system.
 *
 * New code should import `{ Button } from '@/Components/ds'` directly. This
 * exists so old code and muscle memory keep working.
 */
/*
 * `className` is accepted and DROPPED on purpose. The V6 `Button` declares no
 * such prop — it styles itself entirely through tokens — so React was
 * discarding it silently anyway (ds/no-unknown-prop). Swallowing it here is
 * the honest version of what already happened, and it keeps old call sites
 * compiling. New code should use `variant` and `size`, not utility classes.
 */
export default function PrimaryButton({ className: _ignoredClassName, disabled, children, ...props }) {
    return (
        <Button variant="primary" disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
