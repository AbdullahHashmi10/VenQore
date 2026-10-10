import React, { useEffect, useRef, useState } from 'react';
import { Bike, Check, Loader2 } from 'lucide-react';
import { AddressPicker, DeliveryFields, DELIVERY_META, DELIVERY_STATES } from '@/Pos/Table/Delivery';

const formFor = (card, defaults) => ({
    customerName: card?.customer_name || '', phone: card?.phone || '', address: card?.address || '',
    partyId: card?.party_id || null, deliveryNote: card?.delivery?.note || '',
    deliveryFee: String(card?.delivery?.fee ?? defaults.delivery_fee ?? 0),
    etaMinutes: String(card?.delivery?.eta_minutes ?? defaults.delivery_eta ?? 30),
    rider: card?.delivery?.rider || '', riderId: card?.delivery?.rider_id || null,
});

/** Always-open address card; uses the same address book, rider picker and delivery endpoint as Dispatch. */
export default function DeliveryWorkspace({ card, storeSlug, defaults, onEnsure, onUpdate, onDraft, onError, disabled, saveRef }) {
    const [form, setForm] = useState(() => formFor(card, defaults));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);
    const dirtyRef = useRef(false);
    const latest = useRef(form);
    const creating = useRef(false);
    const inflight = useRef(null);
    const version = useRef(0);
    useEffect(() => {
        if (creating.current) return;
        const next = formFor(card, defaults);
        latest.current = next; setForm(next); dirtyRef.current = false; setDirty(false); setSaved(false);
    }, [card?.occupancy_id]); // Same-order polling must not replace typed text.
    const set = (key, value) => {
        latest.current = { ...latest.current, [key]: value };
        setForm(latest.current); dirtyRef.current = true; setDirty(true); setSaved(false); version.current += 1;
        onDraft?.(latest.current);
    };
    const save = async () => {
        if (inflight.current) { await inflight.current; return save(); }
        if (!dirtyRef.current) return true;
        if (disabled) return false;
        const submitted = version.current;
        const current = { ...latest.current };
        setSaving(true); creating.current = !card;
        const task = (async () => {
            try {
                const target = card || await onEnsure('delivery');
                if (!target) return false;
                const result = await onUpdate(target.occupancy_id, {
                    customer_name: current.customerName, phone: current.phone, address: current.address,
                    party_id: current.partyId, note: current.deliveryNote,
                    fee: Number(current.deliveryFee) || 0, eta_minutes: Number(current.etaMinutes) || 30,
                    rider: current.rider, rider_id: current.riderId,
                });
                if (!result) return false;
                if (version.current === submitted) { dirtyRef.current = false; setDirty(false); setSaved(true); }
                return true;
            } catch (error) { onError?.(error?.response?.data?.message || 'Delivery details could not be saved.'); return false; }
            finally { setSaving(false); creating.current = false; inflight.current = null; }
        })();
        inflight.current = task;
        return task;
    };
    if (saveRef) saveRef.current = save;
    return <section className="vq-pane foh-register-delivery bg-surface border border-line/80 shadow-md">
        <header className="vq-pane-h bg-sunken/60 border-b border-line"><Bike size={16} /><span>Delivery details</span>
            <span className="ml-auto text-xs normal-case" role="status">{saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : dirty ? 'Unsaved' : ''}</span>
        </header>
        <fieldset disabled={disabled || saving} className="vq-pane-body foh-delivery-fields" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) save();
        }}>
            <AddressPicker storeSlug={storeSlug} value={form.phone} onPick={match => {
                const next = { ...latest.current, customerName: match.name || '', phone: match.phone || '', address: match.address || '', partyId: match.party_id || null };
                latest.current = next; setForm(next); dirtyRef.current = true; setDirty(true); setSaved(false); version.current += 1; onDraft?.(next);
            }} />
            <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Phone</span><input className="vqt-input" value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" placeholder="Customer phone" /></label>
            <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Customer</span><input className="vqt-input" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Customer name" /></label>
            <DeliveryFields v={form} set={set} storeSlug={storeSlug} />
            {card && <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Delivery status</span>
                <select className="vqt-input" value={card.delivery?.status || 'placed'} onChange={async e => {
                    const status = e.target.value;
                    if (await save()) await onUpdate(card.occupancy_id, { status });
                }}>{DELIVERY_STATES.map(status => <option key={status} value={status}>{DELIVERY_META[status]?.label || status}</option>)}</select>
            </label>}
            <p className="text-xs text-ink-muted">Details save when you leave this panel. The delivery fee appears on the bill.</p>
        </fieldset>
    </section>;
}
