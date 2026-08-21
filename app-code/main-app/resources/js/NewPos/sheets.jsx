/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the sheets                                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything that is one gesture away rather than resident. Two rules hold
 * across all of them:
 *
 *   A SHEET IS THE SAME CONTROLS, NOT FEWER. The payment sheet is the payment
 *   column with a keypad added, never a reduced version of it, so nothing a
 *   cashier learned in one composition is missing in another.
 *
 *   ONE EDITOR PER OBJECT. The shipped register had a line-discount modal and a
 *   price/qty/total converter modal that were 90% the same dialog; opening the
 *   wrong one was a top overwhelm complaint. There is now one line editor, and
 *   the back-solve is a field inside it.
 */

import React, { useEffect, useState } from 'react';
import { Flag, Kbd, Money, RowButton, Sheet, n0, n2 } from './ui';
import { keymap } from './engine';
import { CATEGORIES, PARKED, PARTIES, PAY_METHODS, RECENT, TAX_RATES } from './mock';

/* ── The one line editor ─────────────────────────────────────────────────── */
export function LineSheet({ open, onClose, line, onChange, onRemove, perms, showMargin, narrow }) {
    const [total, setTotal] = useState('');
    const lineId = line ? line.u : null;
    /* Keyed on the LINE, not the line object. patchLine mints a new object on
       every keystroke, so `[open, line]` re-ran this on each one and overwrote
       the field with a rounded integer — you could not type "300." at all. */
    useEffect(() => {
        if (open && line) setTotal(String(Math.round(line.qty * line.price - lineDiscount(line))));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, lineId]);
    if (!line) return <Sheet open={false} onClose={onClose} title="Line" />;

    const gross = line.qty * line.price;
    const disc = lineDiscount(line);
    const net = gross - disc;
    const margin = line.cost && line.price > 0 ? ((line.price - line.cost) / line.price) * 100 : null;

    /* The back-solve. Type what the line must come to and the rate follows —
       the old "converter" modal, folded into the editor that owns the line. */
    const backSolve = (v) => {
        setTotal(v);
        const want = Number(String(v).replace(/[^\d.]/g, ''));
        if (!want || !line.qty) return;
        // A 100% line discount makes the divisor zero. Unguarded that is
        // Infinity → NaN through every total on the screen, and Complete still
        // posts, because NaN fails both the short and the over comparison.
        const pct = Math.min(99.99, Math.max(0, line.discount.value || 0));
        const beforeDisc = line.discount.mode === 'pct'
            ? want / (1 - pct / 100)
            : want + (line.discount.value || 0);
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
                        disabled={!perms['pos.void_item']}
                        title={perms['pos.void_item'] ? 'Remove this line' : 'Your role may not void a line'}
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
                <small>{line.unit}{line.band ? ` · wholesale band from ${line.band} ${line.unit}` : ''}</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-rate">Rate <Kbd>F5</Kbd></label>
                <input
                    id="nqp-le-rate" className="num" inputMode="decimal" value={line.price}
                    disabled={!perms['pos.price_override']}
                    onChange={(e) => onChange({ price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0, overridden: true })}
                />
                {!perms['pos.price_override'] ? <span className="nqp-err">Your role may not override a price.</span> : null}
                {line.overridden ? <small>Overridden from {n0(line.basePrice)}. <button type="button" style={{ minHeight: 0, textDecoration: 'underline' }} onClick={() => onChange({ price: line.basePrice, overridden: false })}>revert</button></small> : null}
                {showMargin && margin != null ? <small>Margin {margin.toFixed(1)}% · cost {n0(line.cost)}</small> : null}
            </div>

            <div className="nqp-field">
                <label>Discount <Kbd>F3</Kbd></label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="nqp-seg" style={{ flex: '0 0 108px' }}>
                        <button type="button" aria-pressed={line.discount.mode === 'pct'} onClick={() => onChange({ discount: { ...line.discount, mode: 'pct' } })}>%</button>
                        <button type="button" aria-pressed={line.discount.mode === 'amt'} onClick={() => onChange({ discount: { ...line.discount, mode: 'amt' } })}>Rs</button>
                    </span>
                    <input
                        className="num" inputMode="decimal" value={line.discount.value}
                        disabled={!perms['pos.discount']}
                        onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^\d.]/g, '')) || 0;
                            onChange({ discount: { ...line.discount, value: line.discount.mode === 'pct' ? Math.min(100, v) : v } });
                        }}
                    />
                </div>
                <small>Takes {n2(disc)} off this line.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-tot">Line total — type it and the rate follows</label>
                <input id="nqp-le-tot" className="num" inputMode="decimal" value={total} onChange={(e) => backSolve(e.target.value)} />
                <small>Currently {n2(net)}. This is the old price/qty/total converter, in the editor that owns the line.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-free">Free / bonus quantity</label>
                <input
                    id="nqp-le-free" className="num" inputMode="decimal" value={line.freeQty}
                    onChange={(e) => onChange({ freeQty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })}
                />
                <small>Goes out with the sale, charged at zero. Was a global column toggle; it belongs to the line that needs it.</small>
            </div>

            <div className="nqp-field">
                <label htmlFor="nqp-le-unit">Unit <Kbd>F6</Kbd></label>
                <select id="nqp-le-unit" value={line.unit} onChange={(e) => onChange({ unit: e.target.value })}>
                    {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <small>F6 used to advertise this and emit a &ldquo;coming soon&rdquo; toast. It either works or it is not on the map.</small>
            </div>

            {/* There is deliberately no per-line tax control here. Tax is a
                DOCUMENT field in the capability inventory, and the total reads
                exactly one rate. A second tax input that no total reads is the
                same defect as F8's phantom charges — a control that advertises
                behaviour it does not have. */}
            {line.batch ? (
                <div className="nqp-field">
                    <label>Batch</label>
                    <input value={line.batch} readOnly />
                    <small>FIFO picked this batch. Change it in the full product editor.</small>
                </div>
            ) : null}

            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-le-note">Note on this line</label>
                <textarea id="nqp-le-note" value={line.note} placeholder="No onions, gift wrap, serial number…" onChange={(e) => onChange({ note: e.target.value })} />
            </div>
        </Sheet>
    );
}

/* A discount can take a line to zero and no further. Unclamped, 150% turned the
   line's net negative and the payment column showed rows that did not sum. */
export function lineDiscount(line) {
    const gross = line.qty * line.price;
    const off = line.discount.mode === 'pct'
        ? (gross * Math.min(100, Math.max(0, line.discount.value || 0))) / 100
        : Math.max(0, line.discount.value || 0);
    return Math.min(gross, off);
}

/* ── Customer ────────────────────────────────────────────────────────────── */
export function PartySheet({ open, onClose, onPick, current, narrow }) {
    const [q, setQ] = useState('');
    const [creating, setCreating] = useState(null);
    const list = PARTIES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone || '').includes(q));

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
                            disabled={!creating.name.trim()}
                            onClick={() => { onPick({ ...creating, id: creating.id ?? Date.now() }); setCreating(null); onClose(); }}
                        >
                            Save and use
                        </button>
                    </div>
                )}
            >
                <div className="nqp-field"><label htmlFor="nqp-p-n">Name</label><input id="nqp-p-n" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></div>
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
            <div className="nqp-field"><input data-sheet-focus placeholder="Name or phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {list.map((p) => (
                <RowButton key={p.id} className="nqp-row" onClick={() => { onPick(p); onClose(); }}>
                    <span className="nqp-avatar">{p.name[0]}</span>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{p.name}</span>
                        <span className="nqp-line-sub">
                            {p.walkin ? 'No account — cash sale' : `${p.phone} · balance ${n0(p.balance)}${p.discount ? ` · ${p.discount}% default discount` : ''}`}
                        </span>
                    </span>
                    {current && current.id === p.id ? <Flag>Current</Flag> : null}
                    {!p.walkin ? (
                        <button
                            type="button" className="nqp-adjbtn"
                            onClick={(e) => { e.stopPropagation(); setCreating({ ...p }); }}
                        >
                            Edit
                        </button>
                    ) : null}
                </RowButton>
            ))}
        </Sheet>
    );
}

/* ── Parked sales ────────────────────────────────────────────────────────── */
export function ParkedSheet({ open, onClose, onRecall, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Parked sales" subtitle={`${PARKED.length} held`} size={narrow ? 'bottom' : 'side'}>
            {PARKED.map((h) => (
                <button key={h.id} type="button" className="nqp-row" onClick={() => { onRecall(h); onClose(); }}>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{h.party}</span>
                        <span className="nqp-line-sub">{h.id} · {h.lines} lines · held {h.at} by {h.by}</span>
                    </span>
                    <Money value={h.total} font={15} avail={110} />
                </button>
            ))}
            {!PARKED.length ? <div className="nqp-empty">Nothing is on hold.</div> : null}
        </Sheet>
    );
}

/* ── Recent invoices ─────────────────────────────────────────────────────── */
export function RecentSheet({ open, onClose, onReprint, onReturn, perms, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Recent invoices" subtitle="today" size={narrow ? 'bottom' : 'side'}>
            {RECENT.map((r) => (
                <div key={r.id} className="nqp-row" data-static="true">
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{r.party}</span>
                        <span className="nqp-line-sub">{r.id} · {r.at} · {r.method}{r.status === 'returned' ? ' · returned' : ''}</span>
                    </span>
                    <Money value={r.total} font={14} avail={100} />
                    <button type="button" className="nqp-adjbtn" onClick={() => onReprint(r)}>Reprint</button>
                    <button
                        type="button" className="nqp-adjbtn"
                        disabled={!perms['pos.refund'] || r.status === 'returned'}
                        title={perms['pos.refund'] ? 'Start a return against this invoice' : 'Your role may not run a return'}
                        onClick={() => { onReturn(r); onClose(); }}
                    >
                        Return
                    </button>
                </div>
            ))}
        </Sheet>
    );
}

/* ── Return lookup ───────────────────────────────────────────────────────── */
export function ReturnSheet({ open, onClose, onLoad, policy, windowDays, party, perms, narrow }) {
    const [ref, setRef] = useState('');
    const needsRef = policy === 'reference';
    const canOpen = policy === 'open';
    const identified = party && !party.walkin;
    const byParty = policy === 'party_or_ref';
    const found = RECENT.find((r) => r.id.toLowerCase() === ref.trim().toLowerCase());

    return (
        <Sheet
            open={open} onClose={onClose} title="Return" size={narrow ? 'bottom' : 'side'}
            subtitle={policy === 'reference' ? 'reference required' : policy === 'party_or_ref' ? 'customer or reference' : 'open returns'}
            footer={(
                <div className="nqp-actions">
                    <button
                        type="button" className="nqp-cta"
                        // Reference required → an invoice must load. Customer-or-
                        // reference → one of the two must identify the sale; the old
                        // condition tested `!party`, which is never true because a
                        // walk-in IS a party, so it disabled nothing.
                        disabled={!perms['pos.refund'] || (needsRef && !found) || (byParty && !found && !identified)}
                        onClick={() => { onLoad(found || null); onClose(); }}
                    >
                        {found ? `Load ${found.id}` : canOpen ? 'Start an open return' : 'Load'}
                    </button>
                </div>
            )}
        >
            {!perms['pos.refund'] ? (
                <div className="nqp-empty">Your role may not run a return. <code>pos.refund</code> is off.</div>
            ) : null}
            <div className="nqp-field">
                <label htmlFor="nqp-r-ref">Invoice number</label>
                <input id="nqp-r-ref" placeholder="INV-10231" value={ref} onChange={(e) => setRef(e.target.value)} aria-invalid={ref && !found ? 'true' : undefined} />
                {ref && !found ? <span className="nqp-err">No invoice with that number.</span> : null}
                {found ? <small>{found.party} · {found.at} · {n0(found.total)} · {found.method}</small> : null}
                {found && windowDays ? <small>Within the {windowDays}-day return window.</small> : null}
            </div>
            {canOpen ? (
                <div className="nqp-note" style={{ margin: '12px 16px' }}>
                    Open returns are on: an item may come back without a reference. The return still posts a
                    reversing journal — it is not a negative sale.
                </div>
            ) : null}
            {byParty ? (
                <div className="nqp-note" style={{ margin: '12px 16px' }}>
                    {identified
                        ? `${party.name} identifies the original sale, so a reference is optional.`
                        : 'This sale is on a walk-in, so a reference is required. Pick a customer, or enter one.'}
                </div>
            ) : null}
            <div style={{ padding: '4px 16px 8px', fontSize: 11, color: 'var(--vq-text-3)' }}>Today&rsquo;s invoices</div>
            {RECENT.filter((r) => r.status !== 'returned').map((r) => (
                <button key={r.id} type="button" className="nqp-row" onClick={() => setRef(r.id)}>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{r.id}</span>
                        <span className="nqp-line-sub">{r.party} · {r.at}</span>
                    </span>
                    <Money value={r.total} font={14} avail={100} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── Quick create: product ───────────────────────────────────────────────── */
export function QuickProductSheet({ open, onClose, onCreate, narrow }) {
    const [f, setF] = useState({ name: '', sku: '', price: '', stock: '', cat: 'gro' });
    useEffect(() => { if (open) setF({ name: '', sku: '', price: '', stock: '', cat: 'gro' }); }, [open]);
    const ok = f.name.trim() && Number(f.price) > 0;
    return (
        <Sheet
            open={open} onClose={onClose} title="New product" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={onClose}>Full editor</button>
                    <button
                        type="button" className="nqp-cta" disabled={!ok}
                        onClick={() => { onCreate(f); onClose(); }}
                    >
                        Create and add
                    </button>
                </div>
            )}
        >
            <div className="nqp-note" style={{ margin: '12px 16px' }}>
                Five fields. The shipped button opened the full 1,768-line six-tab editor in the middle of a
                sale; the rest of the record can wait for the Full editor link below.
            </div>
            <div className="nqp-field"><label htmlFor="nqp-q-n">Name</label><input id="nqp-q-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-s">SKU or barcode</label><input id="nqp-q-s" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-p">Selling price</label><input id="nqp-q-p" className="num" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div className="nqp-field"><label htmlFor="nqp-q-st">Opening stock</label><input id="nqp-q-st" className="num" inputMode="decimal" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-q-c">Category</label>
                <select id="nqp-q-c" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </Sheet>
    );
}

/* ── Quick create: bank account ──────────────────────────────────────────── */
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
            <div className="nqp-field"><label htmlFor="nqp-b-n">Account name</label><input id="nqp-b-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}><label htmlFor="nqp-b-c">Account number</label><input id="nqp-b-c" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        </Sheet>
    );
}

/* ── Variant picker ──────────────────────────────────────────────────────── */
export function VariantSheet({ open, onClose, product, onPick, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title={product ? product.name : 'Variant'} subtitle="pick one" size={narrow ? 'bottom' : 'side'}>
            {(product?.variants || []).map((v) => (
                <button key={v.id} type="button" className="nqp-row" onClick={() => { onPick(v); onClose(); }}>
                    <span className="nqp-rowmain"><span className="nqp-rowtitle">{v.name}</span><span className="nqp-line-sub">{v.sku}</span></span>
                    <Money value={v.price} font={15} avail={100} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── Offline sync hub ────────────────────────────────────────────────────────
   `state` is the whole point. The shipped register caught EVERY server error and
   queued it as an "offline sale" — a 422 validation error and a plan-limit
   rejection both became pending sales that would never post, and nobody was
   told why. Only a genuine network failure queues now; a 4xx is an error with a
   reason attached to the field that caused it. */
export function OfflineSheet({ open, onClose, queue, onRetry, onRecall, onDelete, online, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Offline queue"
            subtitle={online ? 'online — syncing' : 'offline'}
            size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" disabled={!online} onClick={() => onRetry(null)}>Retry all</button>
                </div>
            )}
        >
            {queue.map((q) => (
                <div key={q.id} className="nqp-row" data-static="true" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{q.id} · {q.lines} lines</span>
                        <span className="nqp-line-sub">{q.at} · {q.why}</span>
                    </span>
                    <Money value={q.total} font={14} avail={100} />
                    <Flag tone={q.state === 'error' ? 'bad' : q.state === 'syncing' ? 'info' : 'warn'}>{q.state}</Flag>
                    <span style={{ display: 'flex', gap: 6, width: '100%', marginTop: 6 }}>
                        <button type="button" className="nqp-adjbtn" disabled={!online} onClick={() => onRetry(q)}>Retry</button>
                        <button type="button" className="nqp-adjbtn" onClick={() => onRecall(q)}>Recall into a tab</button>
                        <button type="button" className="nqp-adjbtn" onClick={() => onDelete(q)}>Discard</button>
                    </span>
                </div>
            ))}
            {!queue.length ? <div className="nqp-empty">Nothing is waiting. Every sale has posted.</div> : null}
        </Sheet>
    );
}

/* ── Keyboard map ────────────────────────────────────────────────────────────
   The FULL map, not the ten the old strip advertised — and every row on it is
   wired. F10 (loyalty) is absent because it does not exist yet; advertising a
   key that emits "coming soon" is worse than not having it. */
export function KeysSheet({ open, onClose, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Keyboard" subtitle="one map for the whole product" size={narrow ? 'bottom' : 'side'}>
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

/* ── Bill breakup ────────────────────────────────────────────────────────────
   Was Ctrl+F only. It is now also a tap on the total, which is where anyone
   looking for it actually looks. */
export function BreakupSheet({ open, onClose, m, tab, narrow }) {
    const rows = [
        ['Gross', m.gross],
        ['Line discounts', -m.lineDisc],
        ['Subtotal', m.sub],
        [`Document discount${tab.discount.mode === 'pct' && tab.discount.value ? ` (${tab.discount.value}%)` : ''}`, -m.docDisc],
        ['Additional charges', m.charges],
        [`Tax ${m.taxLabel}${m.taxMode === 'inclusive' ? ' (included)' : ''}`, m.tax],
        m.round ? ['Round off', m.round] : null,
    ].filter(Boolean);
    return (
        <Sheet open={open} onClose={onClose} title="Bill breakdown" subtitle={tab.docNo || 'unsaved'} size={narrow ? 'bottom' : 'side'}>
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
            <div className="nqp-tot"><span className="k">Idempotency key</span><span className="v mono" style={{ fontSize: 11 }}>{tab.idem}</span></div>
            <div className="nqp-note" style={{ margin: '10px 16px 20px' }}>
                One discount value and one formula. The shipped register had two — <code>discount</code> and
                <code> discountValue</code> — and the total only ever read the second, so F9 appeared to do
                nothing.
            </div>
        </Sheet>
    );
}

/* ── Document discount, charges, notes ───────────────────────────────────── */
export function DiscountSheet({ open, onClose, tab, setTab, presetsList, onEditPreset, perms, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Document discount" size={narrow ? 'bottom' : 'side'}
            footer={<div className="nqp-actions"><button type="button" className="nqp-cta" onClick={onClose}>Done</button></div>}
        >
            {!perms['pos.discount'] ? <div className="nqp-empty">Your role may not give a discount.</div> : null}
            <div className="nqp-field">
                <label>Discount</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="nqp-seg" style={{ flex: '0 0 108px' }}>
                        <button type="button" aria-pressed={tab.discount.mode === 'pct'} onClick={() => setTab({ discount: { ...tab.discount, mode: 'pct' } })}>%</button>
                        <button type="button" aria-pressed={tab.discount.mode === 'amt'} onClick={() => setTab({ discount: { ...tab.discount, mode: 'amt' } })}>Rs</button>
                    </span>
                    <input
                        className="num" inputMode="decimal" value={tab.discount.value}
                        disabled={!perms['pos.discount']}
                        onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^\d.]/g, '')) || 0;
                            setTab({ discount: { ...tab.discount, value: tab.discount.mode === 'pct' ? Math.min(100, v) : v } });
                        }}
                    />
                </div>
            </div>
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label>Presets — press and hold one to change it</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {presetsList.map((v) => (
                        <button
                            key={v} type="button" className="nqp-catchip"
                            disabled={!perms['pos.discount']}
                            aria-pressed={tab.discount.mode === 'pct' && tab.discount.value === v}
                            onClick={() => setTab({ discount: { mode: 'pct', value: v } })}
                            onContextMenu={(e) => { e.preventDefault(); onEditPreset(v); }}
                        >
                            {v}%
                        </button>
                    ))}
                </div>
                <small>Long-press (or right-click) a preset to replace it. They live in your settings, not in the sale.</small>
            </div>
        </Sheet>
    );
}

export function ChargesSheet({ open, onClose, tab, setTab, narrow }) {
    const set = (i, patch) => setTab({ charges: tab.charges.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
    return (
        <Sheet
            open={open} onClose={onClose} title="Additional charges" size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setTab({ charges: [...tab.charges, { label: 'Delivery', amount: 0 }] })}>Add a charge</button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            <div className="nqp-note" style={{ margin: '12px 16px' }}>
                A charge is a document field and part of the total, on every screen. F8 used to store one on
                the session that no total ever read.
            </div>
            {tab.charges.map((c, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div className="nqp-field" key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input value={c.label} onChange={(e) => set(i, { label: e.target.value })} />
                    <input className="num" inputMode="decimal" style={{ flex: '0 0 130px' }} value={c.amount} onChange={(e) => set(i, { amount: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                    <button type="button" className="nqp-line-del" aria-label="Remove charge" onClick={() => setTab({ charges: tab.charges.filter((_, j) => j !== i) })}>✕</button>
                </div>
            ))}
            {!tab.charges.length ? <div className="nqp-empty">No charges on this sale.</div> : null}
        </Sheet>
    );
}

export function NotesSheet({ open, onClose, tab, setTab, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Sale remarks" size={narrow ? 'bottom' : 'side'}
            footer={<div className="nqp-actions"><button type="button" className="nqp-cta" onClick={onClose}>Done</button></div>}
        >
            <div className="nqp-field" style={{ paddingBottom: 20 }}>
                <label htmlFor="nqp-n">Remarks</label>
                <textarea id="nqp-n" data-sheet-focus value={tab.notes} placeholder="Anything that should be on the invoice…" onChange={(e) => setTab({ notes: e.target.value })} />
                <small>
                    Resident, with one payload path. F12 used to collect remarks that only reached the server
                    on Ctrl+S, Ctrl+P or Ctrl+N — the normal Complete button sent an empty string.
                </small>
            </div>
        </Sheet>
    );
}

/* ── Split tender ────────────────────────────────────────────────────────── */
export function SplitSheet({ open, onClose, tab, setTab, total, banks, onNewBank, narrow }) {
    const paid = tab.splits.reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const left = total - paid;
    const set = (i, patch) => setTab({ splits: tab.splits.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
    return (
        <Sheet
            open={open} onClose={onClose} title="Split payment" subtitle={`${n0(paid)} of ${n0(total)}`} size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={() => setTab({ splits: [...tab.splits, { method: 'Cash', amount: Math.max(0, Math.round(left)), bank: banks[0].id }] })}>Add a method</button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            <div className="nqp-splitrows" style={{ paddingTop: 12 }}>
                {tab.splits.map((s, i) => (
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
            {!tab.splits.length ? <div className="nqp-empty">One method pays the whole bill. Add a second to split it.</div> : null}
            <div className="nqp-tot"><span className="k">Still to pay</span><Money value={left} font={17} avail={140} className="v" style={{ color: left <= 0 ? 'var(--vq-success)' : 'var(--vq-danger)' }} /></div>
            <div className="nqp-actions"><button type="button" className="nqp-cta" data-ghost="true" onClick={onNewBank}>New bank account</button></div>
        </Sheet>
    );
}

/* ── Overpayment ─────────────────────────────────────────────────────────── */
export function OverpaySheet({ open, onClose, amount, party, onChoose, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="More than the bill" size={narrow ? 'bottom' : 'side'}>
            <div className="nqp-tot nqp-grand"><span className="k">Overpaid by</span><Money value={amount} font={30} avail={200} ccy="PKR" className="v" /></div>
            <button type="button" className="nqp-row" onClick={() => { onChoose('change'); onClose(); }}>
                <span className="nqp-rowmain"><span className="nqp-rowtitle">Give it back as change</span><span className="nqp-line-sub">The drawer opens and the receipt shows the change.</span></span>
            </button>
            <button
                type="button" className="nqp-row"
                disabled={!party || party.walkin}
                onClick={() => { onChoose('ledger'); onClose(); }}
            >
                <span className="nqp-rowmain">
                    <span className="nqp-rowtitle">Keep it on {party && !party.walkin ? party.name : 'the customer'}&rsquo;s account</span>
                    <span className="nqp-line-sub">{party && !party.walkin ? 'Posts as an advance against their balance.' : 'A walk-in has no account to hold it.'}</span>
                </span>
            </button>
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
                {!list.length ? <div className="nqp-empty">Nothing matches.</div> : null}
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
                    <button key={n.id} type="button" className="nqp-navitem" aria-current={n.id === current ? 'true' : undefined}>
                        <span aria-hidden style={{ width: 20, textAlign: 'center' }}>{n.glyph}</span>
                        {n.label}
                    </button>
                ))}
            </div>
        </aside>
    );
}
