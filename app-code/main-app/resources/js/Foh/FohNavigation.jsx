import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, Utensils, ShoppingBag, Bike, Search, ChefHat, Tv, Settings, X, Plus, Maximize2, Unlock, Clock } from 'lucide-react';
import { alertAge } from '@/Pos/Table/useTableService';
import { isLate } from '@/Pos/Table/Delivery';
import { kitchenDone } from './Tabs';

const meta = { overview: [LayoutDashboard, 'Overview'], tables: [Utensils, 'Tables'], takeaway: [ShoppingBag, 'Takeaway'], delivery: [Bike, 'Delivery'] };
const actionClass = 'foh-register-action bg-surface border border-line text-ink-secondary hover:bg-interactive-hover rounded-xl shadow-xs';

export default function FohNavigation({ tab, tabs, tables, storeSlug, onTab, onPick, onNew, onSettings, onRiders, onFullscreen, onDrawer, onShift, isPosStaff, online, canManage, onlineOrders = [] }) {
    const [query, setQuery] = useState('');
    const [miss, setMiss] = useState(false);
    const cards = [...tables.positions.filter(p => p.occupancy_id), ...tables.tickets.filter(t => !t.collected_at)];
    const counts = { tables: tables.positions.filter(p => p.occupancy_id).length,
        takeaway: tables.tickets.filter(t => t.order_type === 'takeaway' && !t.collected_at).length,
        delivery: tables.tickets.filter(t => t.order_type === 'delivery' && !t.collected_at).length };
    counts.takeaway += onlineOrders.filter(o => o.fulfilment !== 'delivery').length;
    counts.delivery += onlineOrders.filter(o => o.fulfilment === 'delivery').length;
    counts.overview = counts.tables + counts.takeaway + counts.delivery;
    const onlineHot = key => onlineOrders.some(o => o.status === 'pending' && (key === 'overview' || (key === 'delivery') === (o.fulfilment === 'delivery')) && key !== 'tables');
    const attention = card => alertAge(card, Date.now()) > 0 || card.customer_pending > 0 || card.guest_call || card.state === 'check_dropped' || (card.paid_at && kitchenDone(card)) || isLate(card.delivery);
    const submit = event => {
        event.preventDefault();
        if (!query.trim()) return;
        const q = query.trim().toLowerCase();
        const found = cards.find(card => [card.code, card.label, card.phone, card.customer_name].some(value => String(value || '').toLowerCase().includes(q)));
        setMiss(!found);
        if (found) { onPick(found); setQuery(''); }
    };
    return <header className="vq-term-bar foh-register-bar">
        <nav className="foh-register-tabs" aria-label="Front of house">
            {tabs.map(key => { const [Icon, label] = meta[key];
                const hot = cards.some(card => (key === 'overview' || (card.kind === 'ticket' ? card.order_type : 'tables') === key) && attention(card));
                return <button key={key} type="button" onClick={() => onTab(key)} aria-current={tab === key ? 'page' : undefined}
                    className={`foh-register-tab rounded-xl border shadow-xs ${tab === key ? 'bg-surface text-brand-700 dark:text-brand-300 font-bold border-brand-500/40 ring-2 ring-brand-500/10' : 'bg-surface/60 text-ink-muted border-line/60 hover:bg-surface'}`}>
                    <Icon size={16} /><span>{label}</span><b className="vq-num">{counts[key]}</b>
                    {(hot || onlineHot(key)) && <span className="foh-register-dot" aria-label="Needs attention" />}
                </button>;
            })}
        </nav>
        <form onSubmit={submit} className="foh-register-search bg-surface border border-line rounded-xl" role="search">
            <Search size={15} /><input aria-label="Find order, table or phone" placeholder={miss ? 'No matching order' : 'Order, table or phone'} value={query} onChange={e => { setQuery(e.target.value); setMiss(false); }} />
        </form>
        <div className="foh-register-tools">
            {(tab === 'takeaway' || tab === 'delivery') && <button className={actionClass} onClick={onNew} disabled={!online} title="New order" aria-label="New order"><Plus size={18} /></button>}
            {tab === 'delivery' && <button className={actionClass} onClick={onRiders} title="Riders and cash-up" aria-label="Riders and cash-up"><Bike size={18} /></button>}
            <Link className={actionClass} href={route('store.restaurant.kitchen', { store_slug: storeSlug })} title="Kitchen" aria-label="Kitchen"><ChefHat size={18} /></Link>
            <Link className={actionClass} href={route('store.restaurant.queue', { store_slug: storeSlug })} title="Order TV" aria-label="Order TV"><Tv size={18} /></Link>
            <button className={`${actionClass} foh-register-secondary`} onClick={onDrawer} title="Cash drawer" aria-label="Cash drawer"><Unlock size={17} /></button>
            {isPosStaff && <button className={actionClass} onClick={onShift} title="Shift" aria-label="Shift"><Clock size={17} /></button>}
            <button className={`${actionClass} foh-register-secondary`} onClick={onFullscreen} title="Full screen" aria-label="Full screen"><Maximize2 size={17} /></button>
            <button className={actionClass} onClick={onSettings} title="FOH screen settings" aria-label="FOH screen settings"><Settings size={18} /></button>
            <Link className={actionClass} href={route('store.dashboard', { store_slug: storeSlug })} title="Close FOH" aria-label="Close FOH"><X size={18} /></Link>
        </div>
    </header>;
}
