import React from 'react';
import { Plus, Users, Clock, Globe } from 'lucide-react';
import { laneBadge, kitchenDone, cookWord } from './Tabs';
import { onlineStage, clock } from './OnlineOrderPane';
import { elapsed } from '@/Pos/Table/FloorPane';
import { STATES } from '@/Pos/Table/useTableService';
import { DELIVERY_META } from '@/Pos/Table/Delivery';

/* Takeaway reads as a pipeline: Cooking -> Ready -> (Collected = gone). */
const takeawayGroup = (card) => card.paid_at ? (kitchenDone(card) ? 'ready' : 'cooking') : (kitchenDone(card) && card.kitchen_progress?.fired ? 'ready' : 'cooking');
const GROUPS = () => [['cooking', cookWord()], ['ready', 'Ready']];

export default function OrderQueue({ tab, tables, money, onPick, onNew, online = [], onlineId = null, onPickOnline, kitchen = true, now = Date.now() }) {
    const isTable = tab === 'tables';
    const list = isTable ? tables.positions : tables.tickets.filter(ticket => ticket.order_type === tab && !ticket.collected_at);
    const mine = isTable ? [] : online.filter(o => (tab === 'delivery') === (o.fulfilment === 'delivery'));
    const renderOnline = (o) => { const st = onlineStage(o, kitchen); const left = o.accept_by ? new Date(o.accept_by).getTime() - now : null;
        return <button key={o.id} type="button" onClick={() => onPickOnline?.(o)} aria-pressed={onlineId === o.id}
            className="foh-register-order foh-register-online" data-active={onlineId === o.id ? '1' : '0'} data-new={o.status === 'pending' ? '1' : '0'}>
            <span className="foh-register-order-title"><b>{o.number}</b><span><Globe size={11} /> Online</span></span>
            <span className="text-ink-muted">{st.text}</span>
            {o.customer_name && <span className="foh-register-order-name">{o.customer_name}</span>}
            <span className="foh-register-order-foot"><span><Clock size={11} /> {o.status === 'pending' && left !== null ? (left > 0 ? `${clock(left)} left` : 'Late') : clock(now - new Date(o.created_at).getTime())}</span><b className="vq-num">{money(o.total)}</b></span>
        </button>; };
    const renderCard = (card) => <div key={card.id} className="contents">
        <button type="button" onClick={() => onPick(card)} aria-pressed={tables.selectedId === card.id}
            className="foh-register-order" data-active={tables.selectedId === card.id ? '1' : '0'}>
            <span className="foh-register-order-title"><b>{card.code}</b>{isTable && <span><Users size={11} /> {card.covers || card.capacity || 2}</span>}</span>
            <span className="text-ink-muted">{isTable ? card.occupancy_id ? (STATES[card.state]?.label || card.state?.replaceAll('_', ' ')) : 'Available' : tab === 'delivery' ? DELIVERY_META[card.delivery?.status || 'placed']?.label : laneBadge(card).text}</span>
            {!isTable && card.customer_name && <span className="foh-register-order-name">{card.customer_name}</span>}
            {card.occupancy_id && <span className="foh-register-order-foot"><span><Clock size={11} /> {elapsed(card.opened_at)}</span><b className="vq-num">{money(card.paid_at ? card.paid_total : card.order_total)}</b></span>}
            {tab === 'takeaway' && card.paid_at && kitchenDone(card) && <span role="button" tabIndex={0} className="foh-register-collect flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); tables.collected(card.occupancy_id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); tables.collected(card.occupancy_id); } }}>Collected</span>}
        </button>
    </div>;
    return <aside className="vq-pane foh-register-queue bg-surface border border-line/80 shadow-md">
        <header className="vq-pane-h bg-sunken/60 border-b border-line"><span>{isTable ? 'Tables' : 'Orders'}</span>
            {!isTable && <button onClick={onNew} className="ml-auto" aria-label={`New ${tab} order`}><Plus size={17} /></button>}
        </header>
        <nav className="vq-pane-body foh-register-queue-list" aria-label={isTable ? 'Tables' : `${tab} queue`}>
            {mine.length > 0 && <><p className="foh-register-group"><span>Online</span><span>{mine.length}</span></p>{mine.map(renderOnline)}</>}
            {tab === 'takeaway'
                ? GROUPS().map(([key, label]) => { const items = list.filter(card => takeawayGroup(card) === key); return items.length ? <React.Fragment key={key}><p className="foh-register-group"><span>{label}</span><span>{items.length}</span></p>{items.map(renderCard)}</React.Fragment> : null; })
                : list.map(renderCard)}
            {!list.length && !mine.length && <p className="p-3 text-sm text-ink-muted">No open orders. Start one with +.</p>}
        </nav>
    </aside>;
}
