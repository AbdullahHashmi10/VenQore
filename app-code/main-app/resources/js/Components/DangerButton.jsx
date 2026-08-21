import React from 'react';
import { Button } from '@/Components/ds';

/** Breeze's destructive button, backed by the V6 `Button`. See PrimaryButton.
 *
 *  A destructive confirm should name the object it destroys in its label —
 *  "Delete invoice INV-2291", not "Confirm" (DESIGN-RULES v3.0 §13). */
export default function DangerButton({ className = '', disabled, children, ...props }) {
    return (
        <Button variant="danger" disabled={disabled} className={className} {...props}>
            {children}
        </Button>
    );
}
