/**
 * "Is this you?" (plan §6.5). A short paragraph from what the owner confirmed,
 * every fact a tappable chip, then Included / We assumed / Not included, and
 * three exits: build it · change something · something's missing.
 */
import React, { useState } from 'react';
import { AreaCards } from './Preview';

const ENUM_EDIT = {
    'place.stock_counts': { label: 'Stock counts', options: [['one', 'One count for everything'], ['separate', 'Separate counts for different places']] },
    'people.users': { label: 'Who uses VenQore', options: [['solo', 'Only me'], ['shared', 'A few people, same access'], ['roles', 'A team with different access']] },
    'tax.mode': { label: 'Sales tax', options: [['added', 'Added on top of prices'], ['included', 'Already inside my prices'], ['none', 'No tax'], ['unsure', 'Not sure']] },
};

const ID_EDIT = [
    ['id.variants', 'Sizes, colours or versions'],
    ['id.batch_expiry', 'Batch numbers or expiry dates'],
    ['id.serial_owned', 'A serial or IMEI on each item'],
    ['id.measured', 'Weight, length or volume'],
    ['id.scan_labels', 'Barcodes or price labels'],
];

export default function ReadBack({ review, busy, typeLabel, onRevise, onOverride, onNotify, onBuild, onMissing, building }) {
    const [editing, setEditing] = useState(null);   // fact key being changed
    const [changeMode, setChangeMode] = useState(false);

    const editor = (fact) => {
        if (ENUM_EDIT[fact]) {
            const e = ENUM_EDIT[fact];
            return (
                <div className="mt-2 flex flex-wrap gap-2">
                    {e.options.map(([v, l]) => (
                        <button key={v} type="button" disabled={busy} onClick={() => { onRevise(fact, v); setEditing(null); }} className="min-h-[44px] rounded-full border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">{l}</button>
                    ))}
                </div>
            );
        }
        if (fact === 'id') {
            return (
                <div className="mt-2 flex flex-wrap gap-2">
                    {ID_EDIT.map(([k, l]) => (
                        <button key={k} type="button" disabled={busy} onClick={() => { onRevise(k, true); setEditing(null); }} className="min-h-[44px] rounded-full border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">Turn on: {l}</button>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-2xl font-semibold text-ink">Is this you?</h2>
            <p className="mt-1 text-sm font-semibold text-accent-text">{review.label}</p>
            {typeLabel && <p className="mt-1 text-xs text-ink-muted">Starting point: {typeLabel}</p>}

            {review.summary ? (
                <>
                    <p className="mt-4 text-lg leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: review.summary_html }} />
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="What we understood">
                        {review.chips.map((c, i) => (
                            <button key={c.fact + i} type="button" onClick={() => setEditing(editing === c.fact + i ? null : c.fact + i)} aria-expanded={editing === c.fact + i} className={`min-h-[40px] rounded-full border px-3 text-sm ${changeMode ? 'border-accent bg-accent-quiet' : 'border-line bg-surface'} text-ink`}>
                                {c.text}
                            </button>
                        ))}
                    </div>
                    {review.chips.map((c, i) => editing === c.fact + i && (
                        <div key={'e' + i} className="mt-2 rounded-lg border border-line bg-sunken p-3">
                            <p className="text-sm text-ink-secondary">{c.text}</p>
                            {ENUM_EDIT[c.fact] ? editor(c.fact) : (
                                <button type="button" disabled={busy} onClick={() => { onRevise(c.fact, false); setEditing(null); }} className="mt-2 min-h-[44px] rounded-full border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">
                                    That's not right — remove it
                                </button>
                            )}
                        </div>
                    ))}
                </>
            ) : (
                <p className="mt-4 text-base text-ink-secondary">We don't have enough yet to describe your business. Add what you need below.</p>
            )}

            {review.conflicts?.map((c) => (
                <div key={c.module} className="mt-4 rounded-lg border border-line bg-sunken p-3" role="alert">
                    <p className="text-sm text-ink">{c.message}</p>
                    <div className="mt-2 flex gap-2">
                        <button type="button" disabled={busy} onClick={() => c.needed_by.forEach((m) => onOverride(m, 'remove'))} className="min-h-[44px] rounded-full border border-line px-4 text-sm font-semibold text-ink">Remove both</button>
                        <span className="self-center text-sm text-ink-muted">or leave it as it is.</span>
                    </div>
                </div>
            ))}

            <h3 className="mt-8 text-lg font-semibold text-ink">Included</h3>
            <div className="mt-2"><AreaCards areas={review.areas} /></div>

            {review.assumptions.length > 0 && (
                <>
                    <h3 className="mt-8 text-lg font-semibold text-ink">We assumed</h3>
                    <ul className="mt-2 space-y-2">
                        {review.assumptions.map((a) => (
                            <li key={a.fact} className="rounded-lg border border-line bg-surface p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-ink">{a.text}</span>
                                    {(ENUM_EDIT[a.fact] || a.fact === 'id') && (
                                        <button type="button" onClick={() => setEditing(editing === 'a' + a.fact ? null : 'a' + a.fact)} className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-accent-text">Change</button>
                                    )}
                                </div>
                                {editing === 'a' + a.fact && editor(a.fact)}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {(review.not_included.length > 0 || review.gaps.length > 0) && (
                <>
                    <h3 className="mt-8 text-lg font-semibold text-ink">Not included</h3>
                    <ul className="mt-2 space-y-2">
                        {review.not_included.map((n, i) => (
                            <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
                                <span className="text-sm text-ink">{n.module ? <strong>{n.module.replace(/_/g, ' ')}: </strong> : null}{n.reason}</span>
                                {n.reason_key === 'coming_soon' ? (
                                    <button type="button" disabled={busy} onClick={() => onNotify(n.module)} className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-accent-text">Notify me</button>
                                ) : n.module ? (
                                    <button type="button" disabled={busy} onClick={() => onOverride(n.module, 'add')} className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-accent-text">Add</button>
                                ) : n.fact ? (
                                    <button type="button" disabled={busy} onClick={() => onRevise(n.fact, true)} className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-accent-text">Add</button>
                                ) : null}
                            </li>
                        ))}
                        {review.gaps.map((g) => (
                            <li key={g.need} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
                                <span className="text-sm text-ink">{g.label} — {g.status === 'requested' ? 'we have your request' : 'coming soon'}</span>
                                {g.status !== 'requested' && (
                                    <button type="button" disabled={busy} onClick={() => onNotify(g.label)} className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-accent-text">Notify me</button>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {review.requests?.length > 0 && (
                <p className="mt-6 text-sm text-ink-secondary">You asked for: {review.requests.join('; ')}</p>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={building || busy} onClick={onBuild} className="min-h-[52px] rounded-full bg-accent-fill px-8 text-base font-semibold text-accent-on disabled:opacity-50">
                    Yes, that's my business — build it
                </button>
                <button type="button" onClick={() => setChangeMode((v) => !v)} aria-pressed={changeMode} className="min-h-[52px] rounded-full border border-line px-8 text-base font-semibold text-ink">
                    Change something
                </button>
                <button type="button" onClick={onMissing} className="min-h-[52px] rounded-full border border-line px-8 text-base font-semibold text-ink">
                    Something's missing
                </button>
            </div>
            {changeMode && <p className="mt-3 text-sm text-ink-muted">Tap any part of the summary above to change it. Your setup updates straight away.</p>}
        </div>
    );
}
