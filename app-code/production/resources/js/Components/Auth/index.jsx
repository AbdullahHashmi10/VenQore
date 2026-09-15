/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Auth primitives — the parts every auth screen is built from              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Thin wrappers over `Components/ds`, which is already token-native and already
 * implements DESIGN-RULES §13's input and button contracts. What these add is
 * the two things a form needs that a component gallery does not: Inertia's
 * error shape, and a fixed size so fifteen screens cannot drift apart again.
 *
 * Every control here is 48px tall (`--vq-control-lg`, §13's touch floor) and
 * full width. That is the whole trick — the inputs, the primary, the secondary
 * and the ghost button all express their edge the same way, so the column has
 * one left edge and one right edge instead of four.
 */
import React from 'react';
import { Button } from '@/Components/ds/core/Button';
import { Input } from '@/Components/ds/forms/Input';
import { Checkbox } from '@/Components/ds/forms/Checkbox';

/** A labelled field. `action` is the "Forgot?" link that sits opposite the label. */
export function AuthField({ label, action, error, hint, id, ...rest }) {
    const auto = React.useId();
    const fid = id || auto;
    return (
        <div className="flex flex-col gap-2">
            {label ? (
                <div className="flex items-center justify-between gap-3">
                    <label htmlFor={fid} className="text-sm font-medium text-ink-secondary">
                        {label}
                    </label>
                    {action}
                </div>
            ) : null}
            <Input id={fid} error={error} hint={hint} {...rest} />
        </div>
    );
}

/** Full-width, 48px. `variant` is the ds vocabulary: primary | secondary | ghost | danger. */
export function AuthButton({ children, ...rest }) {
    return (
        <Button full size="lg" {...rest}>
            {children}
        </Button>
    );
}

export function AuthCheckbox(props) {
    return <Checkbox {...props} />;
}

/** The "or" rule. A hairline, the word, a hairline. */
export function AuthDivider({ children = 'or' }) {
    return (
        <div className="flex items-center gap-4">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span className="text-sm text-ink-muted">{children}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
    );
}

/**
 * A form-level message. `tone` picks the semantic pair, so a failure and a
 * confirmation are never the same colour by accident.
 */
const NOTICE_TONES = {
    danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300',
    success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300',
    info: 'bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-300',
};

export function AuthNotice({ tone = 'danger', children }) {
    if (!children) return null;
    return (
        <div
            role={tone === 'danger' ? 'alert' : 'status'}
            className={`rounded-md px-4 py-3 text-sm font-medium ${NOTICE_TONES[tone] || NOTICE_TONES.info}`}
        >
            {children}
        </div>
    );
}

/**
 * The form body. A flex column with one gap, so the vertical rhythm is a single
 * number rather than a margin on every child.
 *
 * It matters that this is a flex gap and not `mt-*`: the ds Button is
 * `inline-flex`, so a button spaced by margin sits on a line box and picks up
 * the inherited strut — the declared 8px renders as 8px plus a descent, and the
 * rhythm below the form stops matching the rhythm above it. That was defect 6
 * in the V6 reference page.
 */
export function AuthForm({ onSubmit, children, className = '' }) {
    return (
        <form onSubmit={onSubmit} className={`flex flex-col gap-5 ${className}`}>
            {children}
        </form>
    );
}

/**
 * A stack of anything else — the alternative sign-in routes under the divider.
 * `gap` is a fixed set rather than a template literal, because Tailwind scans
 * source text and a class it cannot see written out does not get generated.
 */
const STACK_GAPS = { 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6', 8: 'gap-8' };

export function AuthStack({ gap = 6, children, className = '' }) {
    return (
        <div className={`flex flex-col ${STACK_GAPS[gap] || STACK_GAPS[6]} ${className}`}>
            {children}
        </div>
    );
}

/** An inline link in auth copy — "Forgot?", "Start building →", terms links. */
export function AuthLink({ className = '', ...rest }) {
    return (
        <a
            className={`font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover ${className}`}
            {...rest}
        />
    );
}
