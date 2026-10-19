/**
 * "From what you told us" — facts taken from the owner's OWN words, read back
 * before they count (plan §6.3). Never a guess about the trade, never ticked for them.
 */
import React from 'react';

// Labels read "you sell products", "you keep stock…" — capitalize for the
// start of a bullet instead of prefixing every single one with "We think".
const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ConfirmCard({ card, busy, onResolve }) {
    if (!card?.items?.length) return null;

    return (
        <div className="mx-auto mb-6 w-full max-w-2xl rounded-lg border border-line bg-surface p-4 shadow-sm" role="region" aria-label={card.title}>
            <p className="text-sm font-semibold text-ink">{card.title}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-ink">
                {card.items.map((i) => (
                    <li key={i.fact}>{sentence(i.text.startsWith('not: ') ? `Does not apply: ${i.text.slice(5)}` : i.text)}</li>
                ))}
            </ul>
            <div className="mt-3 flex gap-3">
                <button type="button" disabled={busy} onClick={() => onResolve(true)} className="min-h-[44px] rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-on disabled:opacity-50">
                    Yes, that's right
                </button>
                <button type="button" disabled={busy} onClick={() => onResolve(false)} className="min-h-[44px] rounded-full border border-line px-5 text-sm font-semibold text-ink-secondary disabled:opacity-50">
                    No, that's wrong
                </button>
            </div>
        </div>
    );
}
