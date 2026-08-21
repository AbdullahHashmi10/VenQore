import React from 'react';
import { Button } from '@/Components/ds';

/** Breeze's secondary button, backed by the V6 `Button`. See PrimaryButton. */
export default function SecondaryButton({ className = '', disabled, children, ...props }) {
    return (
        <Button variant="secondary" disabled={disabled} className={className} {...props}>
            {children}
        </Button>
    );
}
