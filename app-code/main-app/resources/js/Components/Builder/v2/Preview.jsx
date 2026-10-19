/**
 * The preview (plan §6.4): areas the setup produces, the free gifts as an ACTIVE
 * choice (never pre-ticked), an honest line, and two ways forward.
 */
import React, { useState } from 'react';
import { Check, Gift, Plus, QrCode, Sparkles, Store } from 'lucide-react';

const GIFT_COPY = {
    ai_insights: { title: 'AI Business Advisor', note: 'Tells you what is selling and what to do next, in plain words. Always included.', icon: Sparkles, fixed: true },
    online_store: { title: 'Your Online Store', note: 'A web shop with your products, ready to share. Switched on but not public until you publish it.', icon: Store },
    onsite_catalogue: { title: 'QR Menu & Catalogue', note: 'Customers scan a code and browse on their phone. Switched on but not public until you publish it.', icon: QrCode },
};

export function AreaCards({ areas }) {
    const [open, setOpen] = useState(null);

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {areas.map((a) => (
                <div key={a.key} className="rounded-lg border border-line bg-surface p-4">
                    <button type="button" onClick={() => setOpen(open === a.key ? null : a.key)} aria-expanded={open === a.key} className="flex min-h-[44px] w-full items-center justify-between text-left">
                        <span className="text-base font-semibold text-ink">{a.name}</span>
                        <span className="text-xs text-ink-muted">{a.modules.length} {a.modules.length === 1 ? 'tool' : 'tools'}</span>
                    </button>
                    {open === a.key && (
                        <ul className="mt-2 space-y-2">
                            {a.modules.map((m) => (
                                <li key={m.key} className="text-sm">
                                    <span className="font-semibold text-ink">{m.label}</span>
                                    {m.tab ? <span className="text-ink-muted"> · {m.tab}</span> : null}
                                    <ul className="mt-0.5 text-xs text-ink-muted">
                                        {m.reasons.map((r, i) => (
                                            <li key={i}>{r.assumed ? 'Assumed: ' : ''}{r.text}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Preview({ review, done, busy, estimate, onGift, onContinue, onReview }) {
    const [showAreas, setShowAreas] = useState(false);

    return (
        <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Here is your setup so far</h2>

            <div className="mt-4 rounded-xl border border-line bg-surface p-5 shadow-sm">
                <p className="text-lg leading-relaxed text-ink">
                    {review.preview_text || 'We are putting together the tools your business needs.'}
                </p>
                {review.areas?.length > 0 && (
                    <button type="button" onClick={() => setShowAreas((v) => !v)} aria-expanded={showAreas} className="mt-3 min-h-[44px] text-sm font-semibold text-accent-text underline-offset-2 hover:underline">
                        {showAreas ? 'Hide the details' : 'See what is included'}
                    </button>
                )}
                {showAreas && <div className="mt-3"><AreaCards areas={review.areas} /></div>}
            </div>

            <section className="mt-6 overflow-hidden rounded-xl border-2 border-accent bg-accent-quiet" aria-labelledby="gifts-h">
                <div className="flex items-center gap-3 px-5 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-fill text-accent-on"><Gift className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                        <h3 id="gifts-h" className="text-lg font-semibold text-ink">Free with your workspace</h3>
                        <p className="text-sm text-ink-secondary">No card needed, and nothing to pay for these.</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-3 p-4 pt-0 sm:grid-cols-3">
                    {review.gifts.map((g) => {
                        const c = GIFT_COPY[g.key];
                        if (!c) return null;
                        const Icon = c.icon;
                        return (
                            <div key={g.key} className={`flex flex-col rounded-lg border p-4 ${g.included ? 'border-accent bg-surface' : 'border-line bg-surface'}`}>
                                <div className="flex items-center justify-between">
                                    <Icon className="h-6 w-6 text-accent-text" aria-hidden="true" />
                                    {g.included && <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-text"><Check className="h-4 w-4" aria-hidden="true" />Yours</span>}
                                </div>
                                <p className="mt-3 text-base font-semibold text-ink">{c.title}</p>
                                <p className="mt-1 flex-1 text-sm text-ink-secondary">{c.note}</p>
                                {!c.fixed && (
                                    <button type="button" disabled={busy} onClick={() => onGift(g.key, g.included ? 'remove' : 'add')} className={`mt-3 inline-flex min-h-[44px] items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${g.included ? 'border border-line text-ink-secondary' : 'bg-accent-fill text-accent-on'}`}>
                                        {g.included ? 'Remove' : (<><Plus className="h-4 w-4" aria-hidden="true" />Add it free</>)}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <p className="mt-6 text-sm text-ink-secondary">
                {done ? 'We have what we need.' : estimate > 0 ? `About ${estimate} more question${estimate === 1 ? '' : 's'} would fine-tune this.` : 'A couple more questions would fine-tune this.'}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {!done && (
                    <button type="button" onClick={onContinue} className="min-h-[48px] w-full rounded-full bg-accent-fill px-7 text-center text-base font-semibold text-accent-on sm:w-auto">
                        Continue questions
                    </button>
                )}
                <button type="button" onClick={onReview} className={`min-h-[48px] w-full rounded-full px-7 text-center text-base font-semibold sm:w-auto ${done ? 'bg-accent-fill text-accent-on' : 'border border-line text-ink'}`}>
                    Looks right — review my setup
                </button>
            </div>
        </div>
    );
}
