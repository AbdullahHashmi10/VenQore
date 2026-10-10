import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Receipt, FileText, ShoppingBag, Monitor } from 'lucide-react';

/**
 * Header bell for unfinished work. It renders NOTHING until a draft actually has
 * data (a customer/supplier picked, a product added, a POS cart filled) — the
 * blank placeholder tab that always exists does not count.
 *
 * groups: [{ key, label, icon, rows: [{ id, title, meta, onOpen }] }]
 */
const ICONS = { invoice: Receipt, sales: Receipt, 'sale-return': Receipt, presale: FileText, 'sales-order': FileText, quotation: FileText, purchase: ShoppingBag, 'purchase-order': ShoppingBag, 'debit-note': ShoppingBag, pos: Monitor };

export default function DraftsBell({ groups }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const live = (groups || []).filter((g) => g.rows.length > 0);
    const total = live.reduce((n, g) => n + g.rows.length, 0);

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);

    useEffect(() => { if (total === 0) setOpen(false); }, [total]);

    if (total === 0) return null;

    return (
        <div className="hidden lg:block relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={`${total} unfinished`}
                title={`${total} unfinished`}
                className="relative h-11 w-11 flex items-center justify-center rounded-xl border shadow-sm bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-colors"
            >
                <ShoppingCart size={18} />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-2xs font-bold leading-[18px] text-center">{total}</span>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-[14px] shadow-xl border border-line z-dropdown p-2 space-y-1">
                    {live.map((g) => {
                        const Icon = ICONS[g.key] || FileText;
                        return (
                            <div key={g.key}>
                                <div className="px-2 pt-1.5 pb-1 text-3xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Icon size={12} /> {g.label}
                                    <span className="ml-auto text-brand-600 dark:text-brand-400">{g.rows.length}</span>
                                </div>
                                {g.rows.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => { setOpen(false); r.onOpen(); }}
                                        className="w-full flex items-center justify-between gap-2 px-2.5 h-9 rounded-[12px] text-sm text-ink hover:bg-interactive-hover transition-colors"
                                    >
                                        <span className="truncate">{r.title}</span>
                                        {r.meta && <span className="text-xs text-ink-muted shrink-0">{r.meta}</span>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
