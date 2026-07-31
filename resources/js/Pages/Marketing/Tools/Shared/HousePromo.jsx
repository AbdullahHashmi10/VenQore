import React from 'react';
import { Link } from '@inertiajs/react';
import { Check, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

/**
 * HousePromo — the right-hand rail on tool pages.
 *
 * DELIBERATELY a first-party VenQore promo, not a third-party ad network.
 * Rationale (documented so this isn't quietly reversed later):
 *
 *  - At the traffic these pages realistically reach, AdSense revenue is a
 *    rounding error, while a single trial conversion is worth $36–129/mo
 *    recurring. Ads would be trading a high-value action for pennies.
 *  - Ad scripts hurt Core Web Vitals, which is a ranking input — they'd
 *    undermine the exact SEO these pages exist to earn.
 *  - Third-party ads on a B2B SaaS site damage buyer trust.
 *
 * If ads are ever genuinely wanted, this is the single component to swap —
 * the layout slot already exists and nothing else needs to change.
 */
export default function HousePromo() {
    const points = [
        'Barcodes generated automatically on every product',
        'Offline-first POS that never stops selling',
        'Real double-entry books, always balanced',
        'Invoices, POs and receipts made from live inventory data',
        'FIFO stock costing and multi-store sync built in',
    ];

    const stats = [
        { value: '14', label: 'day free trial' },
        { value: '0', label: 'setup fees' },
    ];

    return (
        <aside className="hidden xl:block w-80 shrink-0 sticky top-36 self-start max-h-[calc(100vh-11rem)] overflow-y-auto space-y-4 pb-2">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/20 dark:to-violet-600/10 border border-indigo-500/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-3">
                        From the makers of this tool
                    </p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
                        Stop doing this by hand, one item at a time.
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                        VenQore is an offline-first POS &amp; ERP that generates barcodes, invoices, receipts and purchase orders automatically from the inventory you already have — no manual re-entry.
                    </p>

                    <ul className="space-y-2.5 mb-5">
                        {points.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span className="leading-snug">{p}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {stats.map((s) => (
                            <div key={s.label} className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10 text-center">
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{s.value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-500">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/pricing"
                        className="flex items-center justify-center gap-1.5 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform"
                    >
                        Start free trial <ArrowRight size={13} />
                    </Link>
                    <Link
                        href="/demo"
                        className="block text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-3 transition-colors"
                    >
                        Or try the live demo →
                    </Link>
                </div>

        </aside>
    );
}
