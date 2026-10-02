import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle } from 'lucide-react';

const CHOOSABLE = new Set(['customer', 'product', 'unit']);

/**
 * The questions the assistant could not answer by itself.
 *
 * A question with candidates becomes a radio group; the picks are sent to the
 * server as structured selections (no model call). A question without
 * candidates (a missing quantity, an ambiguous edit, an invalid date) is shown
 * as text and answered in the message box below.
 *
 * The server validates every selected id against the candidate set it offered,
 * so nothing typed or forged here can attach a different customer or product.
 */
export default function ClarificationList({ unresolved = [], busy = false, onChoose }) {
    const asks = useMemo(() => unresolved.filter((u) => CHOOSABLE.has(u.field) && (u.candidates || []).length > 0), [unresolved]);
    const answerInChat = useMemo(() => unresolved.filter((u) => !(CHOOSABLE.has(u.field) && (u.candidates || []).length > 0)), [unresolved]);
    const [picked, setPicked] = useState({});

    // A new set of questions invalidates any pick made for an old one.
    const setIds = asks.map((a) => a.candidate_set_id).join('|');
    useEffect(() => { setPicked({}); }, [setIds]);

    if (!unresolved.length) return null;

    const ready = asks.filter((a) => picked[a.candidate_set_id]);

    const submit = () => {
        if (!ready.length || busy) return;
        onChoose(ready.map((a) => ({
            field: a.field,
            ...(a.line_key ? { line_key: a.line_key } : {}),
            candidate_set_id: a.candidate_set_id,
            selected_id: picked[a.candidate_set_id],
        })));
    };

    return (
        <section aria-label="Questions from the assistant" className="vqdoc-note" data-tone="warn" style={{ display: 'grid', gap: 'var(--d-s4, 16px)' }}>
            <span className="eyebrow"><HelpCircle size={14} aria-hidden="true" /> {unresolved.length === 1 ? 'One thing to confirm' : `${unresolved.length} things to confirm`}</span>

            {asks.map((a) => {
                const name = `clar-${a.candidate_set_id}`;
                return (
                    <fieldset key={a.candidate_set_id} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 'var(--d-s2, 8px)' }}>
                        <legend style={{ fontWeight: 600, padding: 0, marginBottom: 'var(--d-s2, 8px)' }}>{a.question}</legend>
                        {a.candidates.map((c) => {
                            const id = `${name}-${c.id}`;
                            return (
                                <label key={c.id} htmlFor={id} className="vqdoc-opt" style={{ display: 'flex', gap: 'var(--d-s3, 12px)', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        id={id}
                                        type="radio"
                                        name={name}
                                        value={c.id}
                                        checked={picked[a.candidate_set_id] === String(c.id)}
                                        disabled={busy}
                                        onChange={() => setPicked((p) => ({ ...p, [a.candidate_set_id]: String(c.id) }))}
                                    />
                                    <span style={{ display: 'grid' }}>
                                        <strong>{c.label}</strong>
                                        {c.detail ? <span style={{ color: 'var(--vq-text-2)' }}>{c.detail}</span> : null}
                                    </span>
                                </label>
                            );
                        })}
                    </fieldset>
                );
            })}

            {answerInChat.map((a, i) => (
                <p key={`${a.field}-${a.line_key || ''}-${a.reason}-${i}`} style={{ margin: 0 }}>
                    {a.question}
                </p>
            ))}
            {answerInChat.length > 0 && (
                <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>Answer in the box below.</p>
            )}

            {asks.length > 0 && (
                <div className="vqdoc-actions">
                    <button type="button" className="vqdoc-btn pri" disabled={busy || ready.length === 0} onClick={submit}>
                        {ready.length > 1 ? 'Apply choices' : 'Apply choice'}
                    </button>
                </div>
            )}
        </section>
    );
}
