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
 * against config/pricing.php, config/modules.php (46 top-level modules — see
 * V6_PUBLIC_PAGE_REGISTER.md §5) and ReckonerRegistry — do
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
        <aside className="vq-tools-promo" aria-label="About VenQore">
            <div className="vq-card vq-tools-promo__card">
                <span className="vq-eyebrow vq-eyebrow--accent">From the makers of this tool</span>
                <h3 className="vq-tools-promo__title">
                    You just built one document. VenQore builds the system that issues them.
                </h3>
                <p className="vq-tools-promo__body">
                    VenQore is the AI ERP builder. Describe your business in a sentence and it assembles
                    a working system — till, stock, purchasing and a real double-entry ledger — from the
                    46 modules it ships with. No consultant, no implementation fee.
                </p>

                <ul className="vq-tools-promo__list">
                    {points.map((p) => (
                        <li key={p}>
                            <Check size={15} aria-hidden="true" />
                            <span>{p}</span>
                        </li>
                    ))}
                </ul>

                <div className="vq-tools-promo__stats">
                    {stats.map((s) => (
                        <div key={s.label} className="vq-tools-promo__stat">
                            <span className="vq-num">{s.value}</span>
                            <span className="vq-caption">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="vq-tools-promo__actions">
                    <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--block">
                        Start building <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                    </Link>
                    <Link href="/demo" className="vq-btn vq-btn--ghost vq-btn--block">
                        Or try the live demo
                    </Link>
                </div>
            </div>
        </aside>
    );
}
