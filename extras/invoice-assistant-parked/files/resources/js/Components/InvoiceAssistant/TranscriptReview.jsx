import React, { useEffect, useRef, useState } from 'react';
import { Field } from '@/Documents/DocumentShell';

/**
 * A recording becomes TEXT the operator can read and correct before anything
 * is drafted. The transcript is held in component state only.
 */
export default function TranscriptReview({ initialText, warnings = [], language, busy, maxChars = 4000, onUse, onRetry }) {
    const [text, setText] = useState(initialText || '');
    const ref = useRef(null);
    useEffect(() => { setText(initialText || ''); }, [initialText]);
    useEffect(() => { ref.current?.focus(); }, []);

    return (
        <div style={{ display: 'grid', gap: 'var(--d-s4, 16px)' }}>
            <Field label="What I heard — fix anything wrong before drafting" span={12}
                hint={language ? `Language heard: ${language}` : undefined}>
                <textarea
                    ref={ref}
                    className="vqdoc-in"
                    dir="auto"
                    rows={5}
                    maxLength={maxChars}
                    value={text}
                    disabled={busy}
                    onChange={(e) => setText(e.target.value)}
                />
            </Field>
            {warnings.length > 0 && (
                <ul aria-label="Check these" style={{ margin: 0, paddingLeft: 'var(--d-s5, 20px)', color: 'var(--vq-text-2)' }}>
                    {warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
            )}
            <div className="vqdoc-actions">
                <button type="button" className="vqdoc-btn" disabled={busy} onClick={onRetry}>Record again</button>
                <button type="button" className="vqdoc-btn pri" disabled={busy || text.trim().length < 2} onClick={() => onUse(text.trim())}>
                    {busy ? 'Drafting…' : 'Use this text'}
                </button>
            </div>
        </div>
    );
}
