/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the sheets (Live Connected)                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything that is one gesture away rather than resident. Connected directly
 * to live backend APIs for customers, parked sales, recent receipts, returns,
 * and double-entry ledger transactions.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Flag, Kbd, Money, RowButton, Sheet, n0, n2 } from '@/LayoutLaw/ui';
import { keymap } from '@/LayoutLaw/engine';
import PrintService from '@/Utils/PrintService';

export const PAY_METHODS = ['Cash', 'Card', 'Bank', 'UPI', 'Credit'];

/* ── The one line editor ─────────────────────────────────────────────────── */
export function LineSheet({ open, onClose, line, onChange, onRemove, perms, showMargin, narrow }) {
    const [total, setTotal] = useState('');
    const lineId = line ? line.u : null;

    useEffect(() => {
        if (open && line) setTotal(String(Math.round(line.qty * line.price - lineDiscount(line))));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, lineId]);
    if (!line) return <Sheet open={false} onClose={onClose} title="Line" />;

    const gross = line.qty * line.price;
    const disc = lineDiscount(line);
    const net = gross - disc;
    const margin = line.cost && line.price > 0 ? ((line.price - line.cost) / line.price) * 100 : null;

    const backSolve = (v) => {
        setTotal(v);
        const want = Number(String(v).replace(/[^\d.]/g, ''));
        if (!want || !line.qty) return;
        const pct = Math.min(99.99, Math.max(0, line.discount?.value || 0));
        const beforeDisc = line.discount?.mode === 'pct'
            ? want / (1 - pct / 100)
            : want + (line.discount?.value || 0);
        const next = beforeDisc / line.qty;
        if (!Number.isFinite(next)) return;
        onChange({ price: Math.round(next * 100) / 100, overridden: true });
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={line.name}
            size={narrow ? 'bottom' : 'side'}
            subtitle={line.sku}
            footer={(
                <div className="nqp-actions">
                    <button
                        type="button" className="nqp-cta" data-danger="true"
                        disabled={!perms?.['pos.void_item']}
                        title={perms?.['pos.void_item'] ? 'Remove this line' : 'Your role may not void a line'}
                        onClick={() => { onRemove(); onClose(); }}
                    >
                        Remove line
                    </button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            <div className="nqp-field">
                <label htmlFor="nqp-le-qty">Quantity <Kbd>F2</Kbd></label>
                <input
                    id="nqp-le-qty" className="num" inputMode="decimal" value={line.qty}
                    onChange={(e) => onChange({ qty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })}
                />
                <small>{line.unit}{line.band ? ` · wholesale band from ${line.band} ${line.unit}` : ''}{line.stock !== undefined ? ` · ${line.stock} in stock` : ''}</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-rate">Rate <Kbd>F5</Kbd></label>
                <input
                    id="nqp-le-rate" className="num" inputMode="decimal" value={line.price}
                    disabled={!perms?.['pos.price_override']}
                    onChange={(e) => onChange({ price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0, overridden: true })}
                />
                {!perms?.['pos.price_override'] ? <span className="nqp-err">Your role may not override a price.</span> : null}
                {line.overridden ? <small>Overridden from {n0(line.basePrice)}. <button type="button" style={{ minHeight: 0, textDecoration: 'underline' }} onClick={() => onChange({ price: line.basePrice, overridden: false })}>revert</button></small> : null}
                {showMargin && margin != null ? <small>Margin {margin.toFixed(1)}% · cost {n0(line.cost)}</small> : null}
            </div>

            <div className="nqp-field">
                <label>Discount <Kbd>F3</Kbd></label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="nqp-seg" style={{ flex: '0 0 108px' }}>
                        <button type="button" aria-pressed={line.discount?.mode === 'pct'} onClick={() => onChange({ discount: { ...line.discount, mode: 'pct' } })}>%</button>
                        <button type="button" aria-pressed={line.discount?.mode === 'amt'} onClick={() => onChange({ discount: { ...line.discount, mode: 'amt' } })}>Rs</button>
                    </span>
                    <input
                        className="num" inputMode="decimal" value={line.discount?.value || 0}
                        disabled={!perms?.['pos.discount']}
                        onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^\d.]/g, '')) || 0;
                            onChange({ discount: { ...line.discount, value: line.discount?.mode === 'pct' ? Math.min(100, v) : v } });
                        }}
                    />
                </div>
                <small>Takes {n2(disc)} off this line.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-tot">Line total — type it and the rate follows</label>
                <input id="nqp-le-tot" className="num" inputMode="decimal" value={total} onChange={(e) => backSolve(e.target.value)} />
                <small>Currently {n2(net)}.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-free">Free / bonus quantity</label>
                <input
                    id="nqp-le-free" className="num" inputMode="decimal" value={line.freeQty || 0}
                    onChange={(e) => onChange({ freeQty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })}
                />
                <small>Goes out with the sale, charged at zero.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-unit">Unit <Kbd>F6</Kbd></label>
                <select id="nqp-le-unit" value={line.unit || 'pc'} onChange={(e) => onChange({ unit: e.target.value })}>
                    {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen', 'meter'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            {line.batch ? (
                <div className="nqp-field">
                    <label>Batch</label>
                    <input value={line.batch} readOnly />
                    <small>FIFO batch tracking</small>
                </div>
            ) : null}

            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-le-note">Note on this line</label>
                <textarea id="nqp-le-note" value={line.note || ''} placeholder="Notes, serial numbers, customizations…" onChange={(e) => onChange({ note: e.target.value })} />
            </div>
        </Sheet>
    );
}

export function lineDiscount(line) {
    if (!line) return 0;
    const gross = (line.qty || 0) * (line.price || 0);
    const discVal = Number(line.discount?.value || 0);
    const off = line.discount?.mode === 'pct'
        ? (gross * Math.min(100, Math.max(0, discVal))) / 100
        : Math.max(0, discVal);
    return Math.min(gross, off);
}

/* ── Customer / Parties Sheet (Live Database Connected) ──────────────────── */
export function PartySheet({ open, onClose, onPick, current, storeSlug, defaultCustomer, narrow }) {
    const [q, setQ] = useState('');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(null);
    const searchTimeout = useRef(null);

    const walkInCustomer = defaultCustomer || { id: 0, name: 'Walk-in customer', phone: '', balance: 0, discount: 0, walkin: true };

    const fetchCustomers = useCallback((query = '') => {
        setLoading(true);
        const url = storeSlug ? route('store.customers.search', { store_slug: storeSlug }) : '/customers-search';
        axios.get(url, { params: { search: query } })
            .then((res) => {
                const results = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const formatted = results.map((p) => ({
                    id: p.id,
                    name: p.name,
                    phone: p.phone || p.mobile || '',
                    balance: Number(p.balance || p.current_balance || 0),
                    discount: Number(p.default_discount || 0),
                    credit: Number(p.credit_limit || 0),
                    walkin: false,
                }));
                // Ensure Walk-in customer is always present at top
                if (!query.trim()) {
                    setList([walkInCustomer, ...formatted.filter((c) => c.id !== walkInCustomer.id)]);
                } else {
                    setList(formatted);
                }
            })
            .catch(() => {
                setList([walkInCustomer]);
            })
            .finally(() => setLoading(false));
    }, [storeSlug, walkInCustomer]);

    useEffect(() => {
        if (open) {
            fetchCustomers(q);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onSearchChange = (val) => {
        setQ(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchCustomers(val);
        }, 250);
    };

    const handleCreateCustomer = () => {
        if (!creating?.name?.trim()) return;
        setLoading(true);
        const url = storeSlug ? route('store.parties.store', { store_slug: storeSlug }) : '/parties';
        axios.post(url, {
            name: creating.name,
            phone: creating.phone,
            party_type: 'customer',
            credit_limit: creating.credit || 0,
            default_discount: creating.discount || 0,
            opening_balance: 0,
        })
            .then((res) => {
                const created = res.data?.party || res.data || creating;
                const formatted = {
                    id: created.id || Date.now(),
                    name: created.name,
                    phone: created.phone || '',
                    balance: 0,
                    discount: Number(created.default_discount || creating.discount || 0),
                    credit: Number(created.credit_limit || creating.credit || 0),
                    walkin: false,
                };
                onPick(formatted);
                setCreating(null);
                onClose();
            })
            .catch((err) => {
                const errMsg = err.response?.data?.message || 'Could not save customer';
                alert(errMsg);
            })
            .finally(() => setLoading(false));
    };

    if (creating) {
        return (
            <Sheet
                open={open} onClose={() => setCreating(null)} title={creating.id ? 'Edit customer' : 'New customer'}
                size={narrow ? 'bottom' : 'side'}
                footer={(
                    <div className="nqp-actions">
                        <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setCreating(null)}>Back</button>
                        <button
                            type="button" className="nqp-cta"
                            disabled={!creating.name.trim() || loading}
                            onClick={handleCreateCustomer}
                        >
                            {loading ? 'Saving…' : 'Save and use'}
                        </button>
                    </div>
                )}
            >
                <div className="nqp-field"><label htmlFor="nqp-p-n">Name *</label><input id="nqp-p-n" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></div>
                <div className="nqp-field"><label htmlFor="nqp-p-ph">Phone</label><input id="nqp-p-ph" inputMode="tel" value={creating.phone} onChange={(e) => setCreating({ ...creating, phone: e.target.value })} /></div>
                <div className="nqp-field"><label htmlFor="nqp-p-d">Default discount %</label><input id="nqp-p-d" className="num" inputMode="decimal" value={creating.discount} onChange={(e) => setCreating({ ...creating, discount: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} /></div>
                <div className="nqp-field" style={{ paddingBottom: 20 }}><label htmlFor="nqp-p-c">Credit limit</label><input id="nqp-p-c" className="num" inputMode="decimal" value={creating.credit} onChange={(e) => setCreating({ ...creating, credit: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} /></div>
            </Sheet>
        );
    }

    return (
        <Sheet
            open={open} onClose={onClose} title="Customer" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setCreating({ name: '', phone: '', discount: 0, credit: 0, balance: 0 })}>
                        New customer <Kbd>Ctrl+D</Kbd>
                    </button>
                </div>
            )}
        >
            <div className="nqp-field"><input data-sheet-focus placeholder="Search name or phone number…" value={q} onChange={(e) => onSearchChange(e.target.value)} /></div>
            {list.map((p) => (
                <RowButton key={p.id} className="nqp-row" onClick={() => { onPick(p); onClose(); }}>
                    <span className="nqp-avatar">{p.name ? p.name[0].toUpperCase() : 'C'}</span>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{p.name}</span>
                        <span className="nqp-line-sub">
                            {p.walkin ? 'Walk-in cash customer' : `${p.phone || 'No phone'} · Balance: ${n0(p.balance)}${p.discount ? ` · ${p.discount}% discount` : ''}`}
                        </span>
                    </span>
                    {current && current.id === p.id ? <Flag>Selected</Flag> : null}
                </RowButton>
            ))}
            {!list.length && !loading ? <div className="nqp-empty">No matching customers found.</div> : null}
            {loading ? <div className="nqp-empty">Loading customers…</div> : null}
        </Sheet>
    );
}

/* ── Parked sales (Live Database Connected) ──────────────────────────────── */
export function ParkedSheet({ open, onClose, onRecall, onDelete, storeSlug, narrow }) {
    const [parked, setParked] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadParked = useCallback(() => {
        setLoading(true);
        const url = storeSlug ? route('store.sales.parked', { store_slug: storeSlug }) : '/sales/parked';
        axios.get(url)
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setParked(data);
            })
            .catch(() => setParked([]))
            .finally(() => setLoading(false));
    }, [storeSlug]);

    useEffect(() => {
        if (open) loadParked();
    }, [open, loadParked]);

    return (
        <Sheet open={open} onClose={onClose} title="Parked sales" subtitle={`${parked.length} held`} size={narrow ? 'bottom' : 'side'}>
            {parked.map((h) => {
                const cart = typeof h.cart_data === 'string' ? JSON.parse(h.cart_data || '[]') : (h.cart_data || []);
                const linesCount = Array.isArray(cart) ? cart.length : (h.items?.length || 0);
                const total = Number(h.total_amount || h.total || 0);
                return (
                    <div key={h.id} className="nqp-row" data-static="true">
                        <span className="nqp-rowmain">
                            <span className="nqp-rowtitle">{h.customer?.name || h.customer_name || 'Walk-in Customer'}</span>
                            <span className="nqp-line-sub">Ref: {h.reference_number || h.id} · {linesCount} items · {h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </span>
                        <Money value={total} font={15} avail={110} />
                        <button type="button" className="nqp-adjbtn" onClick={() => { onRecall(h); onClose(); }}>Recall</button>
                        {onDelete ? (
                            <button type="button" className="nqp-line-del" aria-label="Delete" onClick={() => onDelete(h.id)}>✕</button>
                        ) : null}
                    </div>
                );
            })}
            {!parked.length && !loading ? <div className="nqp-empty">No sales currently on hold.</div> : null}
            {loading ? <div className="nqp-empty">Loading held sales…</div> : null}
        </Sheet>
    );
}

/* ── Recent invoices (Live Database Connected) ─────────────────────────────── */
export function RecentSheet({ open, onClose, onReprint, onReturn, perms, narrow, storeSlug, settings }) {
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            const url = storeSlug ? route('store.pos.recent-sales', { store_slug: storeSlug }) : '/pos/recent-sales';
            axios.get(url)
                .then((res) => {
                    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    setRecent(data);
                })
                .catch(() => setRecent([]))
                .finally(() => setLoading(false));
        }
    }, [open, storeSlug]);

    return (
        <Sheet open={open} onClose={onClose} title="Recent invoices" subtitle="Latest completed sales" size={narrow ? 'bottom' : 'side'}>
            {recent.map((r) => (
                <div key={r.id} className="nqp-row" data-static="true">
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{r.customer?.name || r.customer_name || 'Walk-in Customer'}</span>
                        <span className="nqp-line-sub">
                            {r.invoice_number || r.reference_number || `INV-${r.id}`} · {r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} · {r.payment_method || 'Cash'}{r.status === 'returned' ? ' · Returned' : ''}
                        </span>
                    </span>
                    <Money value={Number(r.final_total || r.total || r.grand_total || 0)} font={14} avail={100} />
                    <button type="button" className="nqp-adjbtn" onClick={() => onReprint(r)}>Print</button>
                    <button
                        type="button" className="nqp-adjbtn"
                        disabled={!perms?.['pos.refund'] || r.status === 'returned'}
                        title={perms?.['pos.refund'] ? 'Start a return against this invoice' : 'Your role may not run a return'}
                        onClick={() => { onReturn(r); onClose(); }}
                    >
                        Return
                    </button>
                </div>
            ))}
            {!recent.length && !loading ? <div className="nqp-empty">No recent sales found today.</div> : null}
            {loading ? <div className="nqp-empty">Loading recent invoices…</div> : null}
        </Sheet>
    );
}

/* ── Return lookup (Live Database Connected) ─────────────────────────────── */
export function ReturnSheet({ open, onClose, onLoad, policy, windowDays, party, perms, narrow, storeSlug }) {
    const [ref, setRef] = useState('');
    const [found, setFound] = useState(null);
    const [searching, setSearching] = useState(false);
    const [recentList, setRecentList] = useState([]);

    const canOpen = policy === 'open';

    useEffect(() => {
        if (open) {
            const url = storeSlug ? route('store.pos.recent-sales', { store_slug: storeSlug }) : '/pos/recent-sales';
            axios.get(url).then((res) => {
                setRecentList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
            }).catch(() => {});
        }
    }, [open, storeSlug]);

    const searchInvoice = (invNum) => {
        setRef(invNum);
        if (!invNum.trim()) { setFound(null); return; }
        setSearching(true);
        const url = storeSlug ? route('store.sales.lookup', { store_slug: storeSlug }) : '/sales/lookup';
        axios.get(url, { params: { query: invNum.trim() } })
            .then((res) => {
                const sale = res.data?.sale || (Array.isArray(res.data) ? res.data[0] : res.data);
                setFound(sale || null);
            })
            .catch(() => setFound(null))
            .finally(() => setSearching(false));
    };

    return (
        <Sheet
            open={open} onClose={onClose} title="Return / Refund" size={narrow ? 'bottom' : 'side'}
            subtitle={policy === 'reference' ? 'Invoice reference required' : 'Select invoice to return'}
            footer={(
                <div className="nqp-actions">
                    <button
                        type="button" className="nqp-cta"
                        disabled={!perms?.['pos.refund'] || (!found && !canOpen)}
                        onClick={() => { onLoad(found || null); onClose(); }}
                    >
                        {found ? `Load ${found.invoice_number || found.reference_number || found.id}` : canOpen ? 'Start open return' : 'Load invoice'}
                    </button>
                </div>
            )}
        >
            {!perms?.['pos.refund'] ? (
                <div className="nqp-empty">Your role may not run a return. <code>pos.refund</code> is disabled.</div>
            ) : null}
            <div className="nqp-field">
                <label htmlFor="nqp-r-ref">Invoice number</label>
                <input id="nqp-r-ref" placeholder="e.g. INV-10021" value={ref} onChange={(e) => searchInvoice(e.target.value)} />
                {ref && !found && !searching ? <span className="nqp-err">No matching invoice found.</span> : null}
                {found ? (
                    <small style={{ color: 'var(--vq-success)' }}>
                        Found: {found.customer?.name || 'Walk-in'} · Total: PKR {n0(found.final_total || found.total)} · Paid: {found.payment_method}
                    </small>
                ) : null}
            </div>

            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vq-text-3)' }}>Recent Sales</div>
            {recentList.slice(0, 8).map((r) => (
                <button key={r.id} type="button" className="nqp-row" onClick={() => searchInvoice(r.invoice_number || r.reference_number || String(r.id))}>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{r.invoice_number || r.reference_number || `INV-${r.id}`}</span>
                        <span className="nqp-line-sub">{r.customer?.name || 'Walk-in'} · {r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </span>
                    <Money value={Number(r.final_total || r.total || 0)} font={14} avail={100} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── Quick create product ─────────────────────────────────────────────────── */
export function QuickProductSheet({ open, onClose, onCreate, categories = [], narrow }) {
    const [f, setF] = useState({ name: '', sku: '', price: '', stock: '', category_id: categories[1]?.id || categories[0]?.id || '' });
    useEffect(() => {
        if (open) setF({ name: '', sku: '', price: '', stock: '', category_id: categories[1]?.id || categories[0]?.id || '' });
    }, [open, categories]);

    const ok = f.name.trim() && Number(f.price) > 0;
    return (
        <Sheet
            open={open} onClose={onClose} title="New product" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={onClose}>Cancel</button>
                    <button
                        type="button" className="nqp-cta" disabled={!ok}
                        onClick={() => { onCreate(f); onClose(); }}
                    >
                        Create and add
                    </button>
                </div>
            )}
        >
            <div className="nqp-field"><label htmlFor="nqp-q-n">Product name *</label><input id="nqp-q-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-s">SKU or Barcode</label><input id="nqp-q-s" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-p">Selling price *</label><input id="nqp-q-p" className="num" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-st">Opening stock</label><input id="nqp-q-st" className="num" inputMode="decimal" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-q-c">Category</label>
                <select id="nqp-q-c" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
                    {categories.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </Sheet>
    );
}

/* ── Quick create bank account ───────────────────────────────────────────── */
export function QuickBankSheet({ open, onClose, onCreate, narrow }) {
    const [f, setF] = useState({ name: '', code: '' });
    useEffect(() => { if (open) setF({ name: '', code: '' }); }, [open]);
    return (
        <Sheet
            open={open} onClose={onClose} title="New bank account" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" disabled={!f.name.trim()} onClick={() => { onCreate(f); onClose(); }}>Create and use</button>
                </div>
            )}
        >
            <div className="nqp-field"><label htmlFor="nqp-b-n">Account name *</label><input id="nqp-b-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}><label htmlFor="nqp-b-c">Account number / IBAN</label><input id="nqp-b-c" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        </Sheet>
    );
}

/* ── Variant picker ──────────────────────────────────────────────────────── */
export function VariantSheet({ open, onClose, product, onPick, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title={product ? product.name : 'Select Variant'} subtitle="Choose option" size={narrow ? 'bottom' : 'side'}>
            {(product?.variants || []).map((v) => (
                <button key={v.id} type="button" className="nqp-row" onClick={() => { onPick(v); onClose(); }}>
                    <span className="nqp-rowmain"><span className="nqp-rowtitle">{v.name}</span><span className="nqp-line-sub">{v.sku || product.sku} · {v.stock !== undefined ? `${v.stock} in stock` : ''}</span></span>
                    <Money value={v.price} font={15} avail={100} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── Offline sync hub ────────────────────────────────────────────────────── */
export function OfflineSheet({ open, onClose, queue, onRetry, onRecall, onDelete, online, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Offline queue"
            subtitle={online ? 'Connected — syncing' : 'Offline Mode'}
            size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" disabled={!online || !queue.length} onClick={() => onRetry(null)}>Sync all now</button>
                </div>
            )}
        >
            {queue.map((q) => (
                <div key={q.id} className="nqp-row" data-static="true" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{q.id} · {q.lines || q.items?.length || 0} lines</span>
                        <span className="nqp-line-sub">{q.at} · {q.why || (q.state === 'pending' ? 'Waiting to post' : 'Error')}</span>
                    </span>
                    <Money value={q.total} font={14} avail={100} />
                    <Flag tone={q.state === 'error' ? 'bad' : q.state === 'syncing' ? 'info' : 'warn'}>{q.state}</Flag>
                    <span style={{ display: 'flex', gap: 6, width: '100%', marginTop: 6 }}>
                        <button type="button" className="nqp-adjbtn" disabled={!online} onClick={() => onRetry(q)}>Retry</button>
                        <button type="button" className="nqp-adjbtn" onClick={() => onRecall(q)}>Recall to tab</button>
                        <button type="button" className="nqp-adjbtn" onClick={() => onDelete(q)}>Discard</button>
                    </span>
                </div>
            ))}
            {!queue.length ? <div className="nqp-empty">No pending offline sales. All orders are synced.</div> : null}
        </Sheet>
    );
}

/* ── Keyboard map ────────────────────────────────────────────────────────── */
export function KeysSheet({ open, onClose, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Keyboard shortcuts" subtitle="Full POS keymap" size={narrow ? 'bottom' : 'side'}>
            <div className="nqp-keymap">
                {keymap().map(([k, action, where]) => (
                    <React.Fragment key={k}>
                        <Kbd>{k}</Kbd>
                        <span>{action}</span>
                        <span className="mono">{where}</span>
                    </React.Fragment>
                ))}
            </div>
        </Sheet>
    );
}

/* ── Bill breakup ────────────────────────────────────────────────────────── */
export function BreakupSheet({ open, onClose, m, tab, narrow }) {
    const rows = [
        ['Gross total', m.gross],
        ['Item discounts', -m.lineDisc],
        ['Subtotal', m.sub],
        [`Document discount${tab.discount?.mode === 'pct' && tab.discount?.value ? ` (${tab.discount.value}%)` : ''}`, -m.docDisc],
        ['Additional charges', m.charges],
        [`Tax ${m.taxLabel || ''}${tab.taxMode === 'inclusive' ? ' (included)' : ''}`, m.tax],
        m.round ? ['Round off', m.round] : null,
    ].filter(Boolean);
    return (
        <Sheet open={open} onClose={onClose} title="Bill breakdown" subtitle={tab.docNo || 'Active Sale'} size={narrow ? 'bottom' : 'side'}>
            {rows.map(([k, v]) => (
                <div className="nqp-tot" key={k}>
                    <span className="k">{k}</span>
                    <Money value={v} font={15} avail={140} className="v" />
                </div>
            ))}
            <div className="nqp-tot nqp-grand">
                <span className="k">Total</span>
                <Money value={m.total} font={28} avail={200} ccy="PKR" className="v" />
            </div>
            <div className="nqp-tot"><span className="k">Items</span><span className="v num">{m.count}</span></div>
            <div className="nqp-tot"><span className="k">Customer</span><span className="v">{tab.party?.name || 'Walk-in'}</span></div>
        </Sheet>
    );
}

/* ── Document discount ───────────────────────────────────────────────────── */
export function DiscountSheet({ open, onClose, tab, setTab, presetsList = [5, 10, 15, 20], onEditPreset, perms, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Document discount" size={narrow ? 'bottom' : 'side'}
            footer={<div className="nqp-actions"><button type="button" className="nqp-cta" onClick={onClose}>Done</button></div>}
        >
            {!perms?.['pos.discount'] ? <div className="nqp-empty">Your role may not give a discount.</div> : null}
            <div className="nqp-field">
                <label>Discount</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="nqp-seg" style={{ flex: '0 0 108px' }}>
                        <button type="button" aria-pressed={tab.discount?.mode === 'pct'} onClick={() => setTab({ discount: { ...tab.discount, mode: 'pct' } })}>%</button>
                        <button type="button" aria-pressed={tab.discount?.mode === 'amt'} onClick={() => setTab({ discount: { ...tab.discount, mode: 'amt' } })}>Rs</button>
                    </span>
                    <input
                        className="num" inputMode="decimal" value={tab.discount?.value || 0}
                        disabled={!perms?.['pos.discount']}
                        onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^\d.]/g, '')) || 0;
                            setTab({ discount: { ...tab.discount, value: tab.discount?.mode === 'pct' ? Math.min(100, v) : v } });
                        }}
                    />
                </div>
            </div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label>Discount presets</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {presetsList.map((v) => (
                        <button
                            key={v} type="button" className="nqp-catchip"
                            disabled={!perms?.['pos.discount']}
                            aria-pressed={tab.discount?.mode === 'pct' && tab.discount?.value === v}
                            onClick={() => setTab({ discount: { mode: 'pct', value: v } })}
                        >
                            {v}%
                        </button>
                    ))}
                </div>
            </div>
        </Sheet>
    );
}

/* ── Charges sheet ───────────────────────────────────────────────────────── */
export function ChargesSheet({ open, onClose, tab, setTab, narrow }) {
    const set = (i, patch) => setTab({ charges: tab.charges.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
    return (
        <Sheet
            open={open} onClose={onClose} title="Additional charges" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setTab({ charges: [...tab.charges, { label: 'Delivery', amount: 0 }] })}>Add charge</button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            {tab.charges.map((c, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div className="nqp-field" key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input value={c.label} onChange={(e) => set(i, { label: e.target.value })} />
                    <input className="num" inputMode="decimal" style={{ flex: '0 0 130px' }} value={c.amount} onChange={(e) => set(i, { amount: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                    <button type="button" className="nqp-line-del" aria-label="Remove charge" onClick={() => setTab({ charges: tab.charges.filter((_, j) => j !== i) })}>✕</button>
                </div>
            ))}
            {!tab.charges.length ? <div className="nqp-empty">No additional charges on this sale.</div> : null}
        </Sheet>
    );
}

/* ── Notes sheet ─────────────────────────────────────────────────────────── */
export function NotesSheet({ open, onClose, tab, setTab, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Sale remarks" size={narrow ? 'bottom' : 'side'}
            footer={<div className="nqp-actions"><button type="button" className="nqp-cta" onClick={onClose}>Done</button></div>}
        >
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-n">Invoice remarks</label>
                <textarea id="nqp-n" data-sheet-focus value={tab.notes || ''} placeholder="Add invoice notes or customer remarks…" onChange={(e) => setTab({ notes: e.target.value })} />
            </div>
        </Sheet>
    );
}

/* ── Split payment sheet ─────────────────────────────────────────────────── */
export function SplitSheet({ open, onClose, tab, setTab, total, banks = [], onNewBank, narrow }) {
    const paid = (tab.splits || []).reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const left = total - paid;
    const set = (i, patch) => setTab({ splits: tab.splits.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

    return (
        <Sheet
            open={open} onClose={onClose} title="Split payment" subtitle={`Paid: ${n0(paid)} of ${n0(total)}`} size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setTab({ splits: [...(tab.splits || []), { method: 'Cash', amount: Math.max(0, Math.round(left)), bank: banks[0]?.id }] })}>Add payment line</button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            <div className="nqp-splitrows" style={{ paddingTop: 12 }}>
                {(tab.splits || []).map((s, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className="nqp-splitrow" key={i}>
                        <select value={s.method} onChange={(e) => set(i, { method: e.target.value })}>
                            {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {s.method !== 'Cash' && s.method !== 'Credit' ? (
                            <select value={s.bank} onChange={(e) => set(i, { bank: Number(e.target.value) })}>
                                {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        ) : null}
                        <input className="num" inputMode="decimal" value={s.amount} onChange={(e) => set(i, { amount: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                        <button type="button" className="nqp-line-del" aria-label="Remove" onClick={() => setTab({ splits: tab.splits.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                ))}
            </div>
            {!tab.splits?.length ? <div className="nqp-empty">Click &quot;Add payment line&quot; to split across cash, bank, or card.</div> : null}
            <div className="nqp-tot"><span className="k">Remaining balance</span><Money value={left} font={17} avail={140} className="v" style={{ color: left <= 0 ? 'var(--vq-success)' : 'var(--vq-danger)' }} /></div>
            {onNewBank ? <div className="nqp-actions"><button type="button" className="nqp-cta" data-ghost="true" onClick={onNewBank}>Add bank account</button></div> : null}
        </Sheet>
    );
}

/* ── Overpayment sheet ───────────────────────────────────────────────────── */
export function OverpaySheet({ open, onClose, amount, party, onChoose, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Overpayment" size={narrow ? 'bottom' : 'side'}>
            <div className="nqp-tot nqp-grand"><span className="k">Change / Excess</span><Money value={amount} font={30} avail={200} ccy="PKR" className="v" /></div>
            <button type="button" className="nqp-row" onClick={() => { onChoose('change'); onClose(); }}>
                <span className="nqp-rowmain"><span className="nqp-rowtitle">Return as Cash Change</span><span className="nqp-line-sub">Opens drawer and registers cash change on invoice.</span></span>
            </button>
            <button
                type="button" className="nqp-row"
                disabled={!party || party.walkin}
                onClick={() => { onChoose('ledger'); onClose(); }}
            >
                <span className="nqp-rowmain">
                    <span className="nqp-rowtitle">Credit to {party && !party.walkin ? party.name : 'Customer'}&apos;s Ledger</span>
                    <span className="nqp-line-sub">{party && !party.walkin ? 'Records as advance customer deposit on ledger balance.' : 'Walk-in customer has no ledger account.'}</span>
                </span>
            </button>
        </Sheet>
    );
}

/* ── Receipt modal / Printable summary ───────────────────────────────────── */
export function ReceiptSheet({ open, onClose, sale, settings, store }) {
    if (!sale) return null;

    const total = Number(sale.total || sale.final_total || sale.amount_paid || 0);
    const paid = Number(sale.amount_paid || sale.cash || total);
    const change = Number(sale.change || Math.max(0, paid - total));
    const items = sale.items || sale.cart || [];

    const handlePrint = (type = 'thermal') => {
        PrintService.quickPrint(sale, type, settings);
    };

    return (
        <Sheet
            open={open} onClose={onClose}
            title="Sale Completed"
            subtitle={sale.invoice_number || sale.reference_number || `INV-${sale.id || 'POSTED'}`}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => handlePrint('regular')}>Standard (A4)</button>
                    <button type="button" className="nqp-cta" onClick={() => handlePrint('thermal')}>Print Receipt</button>
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={onClose}>Done</button>
                </div>
            )}
        >
            <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--vq-line)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--vq-accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {store?.name || 'VenQore POS'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--vq-font-numeric)', color: 'var(--vq-text)', marginTop: 4 }}>
                    PKR {n0(total)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--vq-text-3)', marginTop: 2 }}>
                    {sale.customer?.name || sale.customer_name || 'Walk-in Customer'} · {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--vq-line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vq-text-3)', marginBottom: 8 }}>
                    Items ({items.reduce((acc, i) => acc + (Number(i.qty || i.quantity) || 1), 0)})
                </div>
                {items.map((it, idx) => {
                    const lineQty = Number(it.qty || it.quantity || 1);
                    const linePrice = Number(it.price || it.unit_price || 0);
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                            <span>{lineQty} × {it.name || it.product?.name || `Item #${it.product_id}`}</span>
                            <span style={{ fontWeight: 600, fontFamily: 'var(--vq-font-numeric)' }}>PKR {n0(lineQty * linePrice)}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding: '12px 0' }}>
                <div className="nqp-tot"><span className="k">Paid</span><span className="v num">PKR {n0(paid)}</span></div>
                {change > 0 ? <div className="nqp-tot"><span className="k">Change</span><span className="v num" style={{ color: 'var(--vq-success)' }}>PKR {n0(change)}</span></div> : null}
                <div className="nqp-tot"><span className="k">Payment Method</span><span className="v">{sale.payment_method || 'Cash'}</span></div>
            </div>
        </Sheet>
    );
}

/* ── Command palette ─────────────────────────────────────────────────────── */
export function Palette({ open, onClose, commands }) {
    const [q, setQ] = useState('');
    useEffect(() => { if (open) setQ(''); }, [open]);
    if (!open) return null;
    const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="nqp-palette" role="dialog" aria-modal="true" aria-label="Commands">
            <input autoFocus placeholder="Type a command…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) { list[0].run(); onClose(); } }} />
            <div className="nqp-pb">
                {list.map((c) => (
                    <button key={c.label} type="button" className="nqp-row" onClick={() => { c.run(); onClose(); }}>
                        <span className="nqp-rowmain"><span className="nqp-rowtitle">{c.label}</span>{c.note ? <span className="nqp-line-sub">{c.note}</span> : null}</span>
                        {c.key ? <Kbd>{c.key}</Kbd> : null}
                    </button>
                ))}
                {!list.length ? <div className="nqp-empty">No matching commands.</div> : null}
            </div>
        </div>
    );
}

/* ── Nav drawer ──────────────────────────────────────────────────────────── */
export function NavDrawer({ open, onClose, items, current, width }) {
    return (
        <aside
            className="nqp-sheet" data-side="left" data-open={open ? 'true' : 'false'}
            style={{ width: width ? `${width}px` : undefined }}
            role="dialog" aria-modal="true" aria-label="Navigation" aria-hidden={!open}
        >
            <header className="nqp-sh">
                <span className="nqp-brand" style={{ color: 'var(--vq-text)' }}>VenQore</span>
                <span style={{ flex: 1 }} />
                <button type="button" className="nqp-iconbtn" aria-label="Close" onClick={onClose}>✕</button>
            </header>
            <div className="nqp-pb">
                {items.map((n) => (
                    <button
                        key={n.id} type="button" className="nqp-navitem" aria-current={n.id === current ? 'true' : undefined}
                        onClick={() => {
                            if (n.url) window.location.href = n.url;
                            onClose();
                        }}
                    >
                        <span aria-hidden style={{ width: 20, textAlign: 'center' }}>{n.glyph}</span>
                        {n.label}
                    </button>
                ))}
            </div>
        </aside>
    );
}
