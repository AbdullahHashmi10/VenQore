import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { LayoutDashboard, Utensils, ShoppingBag, Bike, Home, ScanBarcode, Search, ChefHat, Tv, Settings } from 'lucide-react';

const META = {
    overview: { label: 'Overview', Icon: LayoutDashboard },
    tables: { label: 'Tables', Icon: Utensils },
    takeaway: { label: 'Takeaway', Icon: ShoppingBag },
    delivery: { label: 'Delivery', Icon: Bike },
};

/**
 * The strip across the top of FOH: tabs with live counts and a dot when something
 * needs a person, order search, the neighbours (kitchen, TV, settings) and the way
 * back to the retail till.
 *
 * Keys: F1-F4 tabs, `/` search, `N` new order in a takeaway/delivery tab, Esc back.
 */
export default function FohTopBar({ tabs, tab, storeSlug, counts = {}, alerts = {}, onTab, onSearch, onNew, onEscape, canManage }) {
    const [q, setQ] = useState('');
    const input = useRef(null);

    useEffect(() => {
        const onKey = (e) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
            if (/^F[1-4]$/.test(e.key)) {
                const t = tabs[Number(e.key.slice(1)) - 1];
                if (t) { e.preventDefault(); onTab(t, true); }
                return;
            }
            if (typing || e.ctrlKey || e.metaKey || e.altKey) { if (e.key === 'Escape') e.target.blur?.(); return; }
            if (e.key === '/') { e.preventDefault(); input.current?.focus(); }
            else if (e.key === 'n' || e.key === 'N') { onNew?.(); }
            else if (e.key === 'Escape') { onEscape?.(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [tabs, onTab, onNew, onEscape]);

    const submit = (e) => { e.preventDefault(); if (q.trim() && onSearch(q.trim())) setQ(''); };
    const link = (name) => route(name, { store_slug: storeSlug });

    return (
        <header className="foh-top">
            <Link href={route('store.dashboard', { store_slug: storeSlug })} className="foh-top-home" title="Back to the dashboard" aria-label="Back to the dashboard"><Home size={16} /></Link>
            <nav className="foh-tabs" role="tablist" aria-label="Front of house">
                {tabs.map((t, i) => {
                    const m = META[t]; if (!m) return null;
                    const n = counts[t];
                    return (
                        <button key={t} type="button" role="tab" aria-selected={tab === t} data-on={tab === t ? '1' : '0'} onClick={() => onTab(t)} title={`F${i + 1}`}>
                            <m.Icon size={15} aria-hidden="true" /> {m.label}{n ? <b className="vq-num">{n}</b> : null}
                            {alerts[t] > 0 && <span className="foh-dot" aria-label="needs attention" />}
                        </button>
                    );
                })}
            </nav>
            <form className="foh-top-search" onSubmit={submit} role="search">
                <Search size={14} aria-hidden="true" />
                <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, table or phone  ( / )" aria-label="Find an order" />
            </form>
            <Link className="foh-top-pos" href={link('store.restaurant.kitchen')} title="Kitchen display"><ChefHat size={15} aria-hidden="true" /><span className="foh-hide-sm"> Kitchen</span></Link>
            <Link className="foh-top-pos" href={link('store.restaurant.queue')} title="Order TV screen"><Tv size={15} aria-hidden="true" /><span className="foh-hide-sm"> TV</span></Link>
            {canManage && <Link className="foh-top-pos" href={link('store.foh.settings')} title="FOH settings"><Settings size={15} aria-hidden="true" /></Link>}
            <button type="button" className="foh-top-pos" onClick={() => router.visit(link('store.pos'))} title="Open the retail till">
                <ScanBarcode size={15} aria-hidden="true" /><span className="foh-hide-sm"> Retail till</span>
            </button>
        </header>
    );
}
