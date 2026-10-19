/**
 * The builder's waiting screen: the same particle mark as the header, larger,
 * with a short line that changes so it feels like someone is working, not a spinner.
 */
import React, { useEffect, useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';

const LINES = {
    default: ['Getting things ready…', 'Looking at how your business works…', 'Picking the right tools for you…'],
    review: ['Putting your workspace together…', 'Checking nothing important is missing…', 'Writing your summary…'],
    next: ['Thinking about your answer…', 'Choosing the next question…'],
};

export default function BuilderLoading({ kind = 'default' }) {
    const lines = LINES[kind] || LINES.default;
    const [i, setI] = useState(0);

    useEffect(() => {
        setI(0);
        const t = window.setInterval(() => setI((n) => (n + 1) % lines.length), 2200);
        return () => window.clearInterval(t);
    }, [kind, lines.length]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 py-16 text-center" role="status" aria-live="polite">
            <ThinkingOrb state="working" size={96} aria-label="VenQore AI is working" />
            <p className="text-base text-ink-secondary">{lines[i]}</p>
        </div>
    );
}
