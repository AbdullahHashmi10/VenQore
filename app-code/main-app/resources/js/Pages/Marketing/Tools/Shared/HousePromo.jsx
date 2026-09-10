import React from 'react';
import { Link } from '@inertiajs/react';
import { Check, ArrowRight } from 'lucide-react';

/**
 * HousePromo — the right-hand rail on tool pages.
 *
 * DELIBERATELY a first-party VenQore promo, not a third-party ad network.
 * Rationale (documented so this isn't quietly reversed later):
 *
 *  - At the traffic these pages realistically reach, AdSense revenue is a
 *    rounding error, while a single trial conversion is worth $18–129/mo
 *    recurring. Ads would be trading a high-value action for pennies.
 *  - Ad scripts hurt Core Web Vitals, which is a ranking input — they'd
 *    undermine the exact SEO these pages exist to earn.
 *  - Third-party ads on a B2B SaaS site damage buyer trust.
 *
 * If ads are ever genuinely wanted, this is the single component to swap —
 * the layout slot already exists and nothing else needs to change.
 *
 * ── Positioning ───────────────────────────────────────────────────────────
 * This rail carries the CURRENT positioning: VenQore is the AI ERP builder.
 * The visitor describes their business, the AI assembles the system. The
 * bridge from a free tool is "this document you just made by hand is one
 * the system would have issued for you". Every figure below is verified
 * against config/pricing.php, config/modules.php and ReckonerRegistry — do
 * not add a number here that is not true in code.
 */
export default function HousePromo() {
    const points = [
        'Describe your business — Blueprint proposes the system',
        '46 modules in, only the ones you use out',
        'Every document here, issued automatically from live stock',
        'One Core Ledger, so no two screens disagree on a number',
        'A photo of a bill in, a posted transaction out',
    ];

    const stats = [
        { value: '$49', label: 'a month to start' },
        { value: '14', label: 'day free trial' },
    ];

    return (
        <aside className="hidden xl:block w-80 shrink-0 sticky top-36 self-start max-h-[calc(100vh-11rem)] overflow-y-auto space-y-4 pb-2">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-500/5 dark:from-brand-600/20 dark:to-brand-600/10 border border-brand-500/20">
                <p className="text-2xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300 mb-3">
                    From the makers of this tool
                </p>
                <h3 className="text-lg font-bold text-ink mb-2 leading-snug">
                    You just built one document. VenQore builds the system that issues them.
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-5">
                    VenQore is the AI ERP builder. Describe your business in a sentence and it assembles
                    a working system — till, stock, purchasing and a real double-entry ledger — from the
                    46 modules it ships with. No consultant, no implementation fee.
                </p>

                <ul className="space-y-2.5 mb-5">
                    {points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-ink-secondary">
                            <Check size={13} className="text-success-500 mt-0.5 shrink-0" />
                            <span className="leading-snug">{p}</span>
                        </li>
                    ))}
                </ul>

                <div className="grid grid-cols-2 gap-2 mb-5">
                    {stats.map((s) => (
                        <div key={s.label} className="p-3 rounded-xl bg-surface/60 dark:bg-white/[0.04] border border-line dark:border-white/10 text-center">
                            <p className="text-xl font-bold text-ink leading-none mb-1">{s.value}</p>
                            <p className="text-2xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
                        </div>
                    ))}
                </div>

                <Link
                    href="/build-workspace"
                    className="group/p flex items-center justify-center gap-1.5 w-full py-3 bg-accent-fill text-accent-on rounded-xl text-xs font-bold uppercase tracking-wide transition-transform"
                >
                    Start building <ArrowRight size={13} className="transition-transform duration-slow group-hover/p:translate-x-0.5" />
                </Link>
                <Link
                    href="/demo"
                    className="block text-center text-1xs font-bold text-ink-muted hover:text-ink dark:hover:text-white mt-3 transition-colors"
                >
                    Or try the live demo →
                </Link>
            </div>
        </aside>
    );
}
