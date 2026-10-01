/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — the sheets                                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything one gesture away rather than resident. Same two rules as the
 * register: a sheet is the SAME controls and not fewer, and there is ONE editor
 * per object.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Kbd, Money, Sheet, focusTrap } from '@/LayoutLaw/ui';
import { LAW } from '@/LayoutLaw/law';
import { TYPES, buildPayload, has, label, off, overflowActions } from './fields';
import {
    PRODUCTS, RECENT_DOCS, SOURCE_DOCS, TAX_RATES, partiesFor, searchProducts,
} from './mock';
import { keep, n0, n2, nz, r2 } from './zones';

/* ── The party picker. Its LIST is derived from the document's side ────────── */
export function PartySheet({ open, onClose, type, current, onPick, narrow }) {
    const [q, setQ] = useState('');
    const [creating, setCreating] = useState(null);
    // Without this the sheet reopens on the half-filled create form it was left
    // on, and the focus target never gets the caret.
    useEffect(() => { if (open) { setQ(''); setCreating(null); } }, [open]);
    const list = partiesFor(type.side).filter(
        (p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone || '').includes(q),
    );
    const noun = label(type, 'party', 'Party');

    if (creating) {
        return (
            <Sheet
                open={open} onClose={() => setCreating(null)} title={`New ${noun.toLowerCase()}`}
                size={narrow ? 'bottom' : 'side'} ns="nqd"
                footer={(
                    <div className="nqd-actions">
                        <button type="button" className="nqd-btn" onClick={() => setCreating(null)}>Back</button>
                        <button
                            type="button" className="nqd-btn" data-pri="true"
                            disabled={!creating.name.trim()}
                            onClick={() => { onPick({ ...creating, id: Date.now(), side: type.side }); setCreating(null); onClose(); }}
                        >
                            Save and use
                        </button>
                    </div>
                )}
            >
                <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="nqd-f"><label htmlFor="nqd-np-n">Name</label><input id="nqd-np-n" className="nqd-ctl" data-sheet-focus value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></div>
                    <div className="nqd-f"><label htmlFor="nqd-np-p">Phone</label><input id="nqd-np-p" className="nqd-ctl" inputMode="tel" value={creating.phone} onChange={(e) => setCreating({ ...creating, phone: e.target.value })} /></div>
                    <div className="nqd-f"><label htmlFor="nqd-np-d">Default discount %</label><input id="nqd-np-d" className="nqd-ctl num" inputMode="decimal" value={creating.discount} onChange={(e) => setCreating({ ...creating, discount: keep(e.target.value) })} /></div>
                </div>
            </Sheet>
        );
    }

    return (
        <Sheet
            open={open} onClose={onClose} title={noun}
            subtitle={type.side === 'buy' ? 'suppliers only' : 'customers only'}
            size={narrow ? 'bottom' : 'side'} ns="nqd"
            footer={(
                <div className="nqd-actions">
                    <button type="button" className="nqd-btn" onClick={() => setCreating({ name: q, phone: '', discount: 0, balance: 0, terms: 'Net 30' })}>
                        New {noun.toLowerCase()} <Kbd ns="nqd">Ctrl+D</Kbd>
                    </button>
                </div>
            )}
        >
            <div className="nqd-note" style={{ margin: '12px 16px' }}>
                This list is <b>{type.side === 'buy' ? 'suppliers' : 'customers'}</b>, derived from the
                document&rsquo;s side. Every picker in the shipped code except V3 Purchase asked for
                <code> type=all</code>, so a purchase order would happily accept a customer.
            </div>
            <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr', paddingBottom: 0 }}>
                <input className="nqd-ctl" data-sheet-focus placeholder="Name or phone…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {list.map((p) => (
                <button key={p.id} type="button" className="nqd-row" onClick={() => { onPick(p); onClose(); }}>
                    <span className="nqd-avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{p.name[0]}</span>
                    <span className="nqd-rowmain">
                        <span className="nqd-rowtitle">{p.name}</span>
                        <span className="nqd-rowsub">{p.ref} · {p.phone} · balance {n0(p.balance)} · {p.terms}</span>
                    </span>
                    {current && current.id === p.id ? <span className="nqd-flag">Current</span> : null}
                </button>
            ))}
            {!list.length ? <div className="nqd-empty">No {type.side === 'buy' ? 'supplier' : 'customer'} matches.</div> : null}
        </Sheet>
    );
}

/* ── The product picker, also used by "Add a line" ─────────────────────────── */
export function ProductSheet({ open, onClose, onPick, onCreate, narrow, products = PRODUCTS }) {
    const [q, setQ] = useState('');
    const [creating, setCreating] = useState(null);
    useEffect(() => { if (open) { setQ(''); setCreating(null); } }, [open]);
    // The LIVE list. Closing over the module constant meant a product created
    // here was added to the line and then vanished from the catalogue for ever.
    const { matches } = searchProducts(q, products);
    const list = q.trim() ? matches : products;

    if (creating) {
        return (
            <Sheet
                open={open} onClose={() => setCreating(null)} title="New product"
                size={narrow ? 'bottom' : 'side'} ns="nqd"
                footer={(
                    <div className="nqd-actions">
                        <button type="button" className="nqd-btn" onClick={() => setCreating(null)}>Back</button>
                        <button
                            type="button" className="nqd-btn" data-pri="true"
                            disabled={!creating.name.trim() || !Number(creating.rate)}
                            onClick={() => { onCreate(creating); setCreating(null); onClose(); }}
                        >
                            Create and add
                        </button>
                    </div>
                )}
            >
                <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="nqd-f"><label htmlFor="nqd-npr-n">Name</label><input id="nqd-npr-n" className="nqd-ctl" data-sheet-focus value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></div>
                    <div className="nqd-f"><label htmlFor="nqd-npr-s">SKU</label><input id="nqd-npr-s" className="nqd-ctl" value={creating.sku} onChange={(e) => setCreating({ ...creating, sku: e.target.value })} /></div>
                    <div className="nqd-f"><label htmlFor="nqd-npr-r">Rate</label><input id="nqd-npr-r" className="nqd-ctl num" inputMode="decimal" value={creating.rate} onChange={(e) => setCreating({ ...creating, rate: keep(e.target.value) })} /></div>
                    <div className="nqd-f"><label htmlFor="nqd-npr-u">Unit</label><input id="nqd-npr-u" className="nqd-ctl" value={creating.uom} onChange={(e) => setCreating({ ...creating, uom: e.target.value })} /></div>
                </div>
            </Sheet>
        );
    }

    return (
        <Sheet
            open={open} onClose={onClose} title="Item" size={narrow ? 'bottom' : 'side'} ns="nqd"
            footer={(
                <div className="nqd-actions">
                    <button type="button" className="nqd-btn" onClick={() => setCreating({ name: q, sku: '', rate: '', uom: 'pc' })}>New product</button>
                </div>
            )}
        >
            <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr', paddingBottom: 0 }}>
                <input className="nqd-ctl" data-sheet-focus placeholder="Name or SKU…" aria-label="Search items" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {list.map((p) => (
                <button key={p.id} type="button" className="nqd-row" onClick={() => { onPick(p); onClose(); }}>
                    <span className="nqd-rowmain">
                        <span className="nqd-rowtitle">{p.name}</span>
                        <span className="nqd-rowsub">{p.sku} · HSN {p.hsn} · {p.stock} {p.uom} on hand</span>
                    </span>
                    <Money value={p.rate} font={14} avail={100} />
                </button>
            ))}
            {!list.length ? <div className="nqd-empty">Nothing matches.</div> : null}
        </Sheet>
    );
}

/* ── The document type picker — one editor, thirteen configurations ────────── */
export function TypeSheet({ open, onClose, current, onPick, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Document type" subtitle="one editor, thirteen"
            size={narrow ? 'bottom' : 'side'} ns="nqd"
        >
            <div className="nqd-note" style={{ margin: '12px 16px' }}>
                A type is a <b>configuration</b> — labels, a set of switched-on capabilities and a
                default density — never a different screen. Eight of the thirteen in the codebase are
                the same file copy-pasted.
            </div>
            {TYPES.map((t) => (
                <button key={t.id} type="button" className="nqd-row" onClick={() => { onPick(t.id); onClose(); }}>
                    <span className="nqd-rowmain">
                        <span className="nqd-rowtitle">{t.name}</span>
                        <span className="nqd-rowsub">{t.prefix} · {t.side} side · wants {t.density} · {t.on.length} capabilities on{t.off.length ? `, ${t.off.length} off` : ''}</span>
                    </span>
                    {current === t.id ? <span className="nqd-flag">Current</span> : null}
                </button>
            ))}
        </Sheet>
    );
}

/* ── Against-document picker ───────────────────────────────────────────────── */
export function SourceSheet({ open, onClose, onPick, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Against document" size={narrow ? 'bottom' : 'side'} ns="nqd">
            {SOURCE_DOCS.map((d) => (
                <button key={d.id} type="button" className="nqd-row" onClick={() => { onPick(d); onClose(); }}>
                    <span className="nqd-rowmain">
                        <span className="nqd-rowtitle">{d.id}</span>
                        <span className="nqd-rowsub">{d.party} · {d.at}</span>
                    </span>
                    <Money value={d.total} font={14} avail={110} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── ONE LINE, ALL OF IT ─────────────────────────────────────────────────────
   The density decides which columns are INLINE. It does not decide what exists.
   Free quantity is switched on for four sell-side types and its column lives
   only at Pro; unit, per-line tax, batch, expiry and the line note had no
   control at all in the table fit. A width may veto a density; it may never
   veto a capability — so every field a line can carry is here, at every width,
   one tap from the line itself. */
export function LineSheet({ open, onClose, line, type, perms, onPatch, onRemove, onChangeItem, narrow }) {
    if (!line) return <Sheet open={false} onClose={onClose} title="Line" ns="nqd" />;
    const canPrice = perms['documents.price_override'] && !off(type, 'rate_edit') && !has(type, 'qty_only');
    const canDisc = perms['documents.discount'] && !off(type, 'disc');
    const batch = has(type, 'batch_entry') || has(type, 'batch_pick');
    const num = (k, lbl, opts = {}) => (
        <div className="nqd-f" key={k}>
            <label htmlFor={`nqd-l-${k}`}>{lbl}</label>
            <input
                id={`nqd-l-${k}`} className="nqd-ctl num" inputMode="decimal" disabled={opts.disabled}
                value={line[k] ?? ''} onChange={(e) => onPatch(line.u, { [k]: keep(e.target.value) })}
            />
            {opts.hint ? <span className="hint">{opts.hint}</span> : null}
        </div>
    );
    return (
        <Sheet
            open={open} onClose={onClose} title={line.name} subtitle={line.sku}
            size={narrow ? 'bottom' : 'side'} ns="nqd"
            footer={(
                <button
                    type="button" className="nqd-btn" data-rank="2" disabled={!perms['documents.delete_line']}
                    onClick={() => { onRemove(line); onClose(); }}
                >
                    Remove this line
                </button>
            )}
        >
            <div className="nqd-hdr" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', padding: '12px 16px' }}>
                <div className="nqd-f" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="nqd-l-item">Item</label>
                    <button type="button" id="nqd-l-item" className="nqd-ctl" data-sheet-focus aria-label={`Item: ${line.name}. Change it.`} onClick={() => onChangeItem(line.u)}>
                        <span>{line.name}</span>
                        <span className="chev" aria-hidden>⌄</span>
                    </button>
                </div>
                {num('qty', has(type, 'expected_counted_difference') ? 'Counted quantity' : 'Quantity')}
                {has(type, 'free_qty') ? num('free', 'Free quantity', { hint: 'reached the database from 2 of 7 sell-side types' }) : null}
                <div className="nqd-f">
                    <label htmlFor="nqd-l-uom">Unit</label>
                    <select id="nqd-l-uom" className="nqd-ctl" value={line.uom} onChange={(e) => onPatch(line.u, { uom: e.target.value })}>
                        {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <span className="hint">StoreSaleRequest requires it; no shipped screen collects it</span>
                </div>
                {has(type, 'qty_only') ? null : num('rate', label(type, 'rate', 'Rate'), { disabled: !canPrice })}
                {off(type, 'disc') || has(type, 'qty_only') ? null : num('disc', 'Discount %', { disabled: !canDisc })}
                {has(type, 'per_line_tax') ? num('tax', 'Tax %') : null}
                {batch ? (
                    <div className="nqd-f">
                        <label htmlFor="nqd-l-batch">{has(type, 'expiry_entry') ? 'Batch / expiry' : 'Batch'}</label>
                        <input id="nqd-l-batch" className="nqd-ctl" value={line.batch || ''} onChange={(e) => onPatch(line.u, { batch: e.target.value })} />
                    </div>
                ) : null}
                <div className="nqd-f" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="nqd-l-note">Line note</label>
                    <input id="nqd-l-note" className="nqd-ctl" value={line.note || ''} onChange={(e) => onPatch(line.u, { note: e.target.value })} />
                    <span className="hint">the payload has always carried it; nothing ever wrote it</span>
                </div>
            </div>
            <div className="nqd-note" style={{ margin: '4px 16px 20px' }}>
                A density decides which of these are <b>columns</b>. It never decides which
                <b> exist</b> — that is the type&rsquo;s to decide, and it decides it at every width.
            </div>
        </Sheet>
    );
}

/* ── The breakdown. Ctrl+F, and a tap on the total ─────────────────────────── */
export function BreakdownSheet({ open, onClose, type, doc, computed, narrow, showMargin }) {
    const taxRate = TAX_RATES.find((t) => t.id === doc.taxRate) || TAX_RATES[1];
    /* The same rows as the summary, in the same order, with the ones the
       density hides added back. ONE meaning of the word "subtotal" on the
       screen: it is the gross, before discounts, everywhere. The breakdown
       used to call the net-of-item-discounts figure "Subtotal" too, which is
       two definitions of one word two inches apart. */
    const taxLbl = has(type, 'no_lines') ? 'Tax (as entered)'
        : computed.perLineTax ? 'Tax (per line)'
            : `Tax · ${taxRate.breakdown || `${taxRate.rate}%`}${computed.inclusive ? ' — included in the prices' : ''}`;
    const rows = [
        [computed.inclusive ? 'Subtotal (ex tax)' : 'Subtotal', computed.gross],
        ['Item discounts', -computed.lineDisc],
        ['Document discount', -computed.docDisc],
        ['Delivery', nz(doc.shipping)],
        ['Other charges', nz(doc.extra)],
        [taxLbl, computed.tax],
        computed.round ? ['Round off', computed.round] : null,
    ].filter(Boolean);
    return (
        <Sheet open={open} onClose={onClose} title="Breakdown" subtitle={doc.docno} size={narrow ? 'bottom' : 'side'} ns="nqd">
            {rows.map(([k, v]) => (
                <div className="nqd-sumrow" key={k}>
                    <span className="k">{k}</span>
                    <Money value={v} font={13} avail={150} className="v" />
                </div>
            ))}
            <div className="nqd-sumrow" data-kind="tot">
                <span className="k">{label(type, 'total', 'Total')}</span>
                <Money value={computed.total} font={26} avail={210} ccy="PKR" className="v" />
            </div>
            <div className="nqd-sumrow"><span className="k">Lines</span><span className="v num">{doc.lines.length}</span></div>
            <div className="nqd-sumrow"><span className="k">Units</span><span className="v num">{n2(computed.units)}</span></div>
            {/* FIX · landed costs rendered on a purchase bill, posted, and moved
                no number on the screen. It does not belong IN the total — a
                freight bill is not owed to this supplier — so it is stated here,
                where the thing it does change is named. */}
            {has(type, 'landed_costs') && nz(doc.landedCosts) ? (
                <div className="nqd-sumrow" title="Allocated to the cost of the items received. It is not part of what is owed to this supplier, so it is not in the total.">
                    <span className="k">Landed costs (to item cost)</span>
                    <Money value={nz(doc.landedCosts)} font={13} avail={150} className="v" />
                </div>
            ) : null}
            {/* Margin is behind the Settings switch, on the sell side only, and
                it is stated here in full rather than as the header's badge. */}
            {showMargin && type.side === 'sell' ? (
                <>
                    <div className="nqd-sumrow"><span className="k">Cost of goods</span><Money value={computed.cost} font={13} avail={150} className="v" /></div>
                    <div className="nqd-sumrow">
                        <span className="k">Margin · {computed.marginPct}%</span>
                        <Money value={computed.margin} font={13} avail={150} className="v" />
                    </div>
                </>
            ) : null}
            <div className="nqd-note" style={{ margin: '10px 16px 20px' }}>
                Round-off is a <b>document</b> property, applied once, here. Only the sales invoice
                and the recurring invoice ever called <code>roundTotal()</code>, so the same cart
                totalled differently depending on which of the thirteen screens you were on.
            </div>
        </Sheet>
    );
}

/* ── The payload. Shown, because the contract is the point ─────────────────── */
export function PayloadSheet({ open, onClose, type, doc, computed, narrow }) {
    const payload = buildPayload(doc, type, computed);
    const pruned = JSON.parse(JSON.stringify(payload, (k, v) => (v === undefined ? undefined : v)));
    return (
        <Sheet open={open} onClose={onClose} title="What this would post" subtitle={type.id} size={narrow ? 'bottom' : 'wide'} ns="nqd">
            <div className="nqd-note" style={{ margin: '12px 16px' }}>
                One payload builder, for all thirteen types. <b>A field that renders is a field that
                posts.</b> Quotation collected tax, delivery, extra charges, amount paid, free
                quantity, date and reference in the UI and dropped all seven; sales order sent five
                keys its controller ignored. Both are unreachable from here.
            </div>
            <pre className="nqd-pre">{JSON.stringify(pruned, null, 2)}</pre>
        </Sheet>
    );
}

/* ── Charges, discount, tax — document fields, one each ────────────────────── */
export function MoneySheet({ open, onClose, doc, set, perms, narrow }) {
    return (
        <Sheet
            open={open} onClose={onClose} title="Document totals" size={narrow ? 'bottom' : 'side'} ns="nqd"
            footer={<div className="nqd-actions"><button type="button" className="nqd-btn" data-pri="true" onClick={onClose}>Done</button></div>}
        >
            <div className="nqd-hdr" style={{ gridTemplateColumns: '1fr' }}>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-tax">Document tax <Kbd ns="nqd">F7</Kbd></label>
                    <select id="nqd-m-tax" className="nqd-ctl" data-sheet-focus value={doc.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) })}>
                        {TAX_RATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <span className="hint">from settings.tax_rates — read by every type, not only the sales invoice</span>
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-disc">Document discount <Kbd ns="nqd">F9</Kbd></label>
                    <input
                        id="nqd-m-disc" className="nqd-ctl num" inputMode="decimal" disabled={!perms['documents.discount']}
                        value={doc.discount}
                        onChange={(e) => set({ discount: keep(e.target.value) })}
                    />
                    <span className="hint">a percentage of the subtotal, clamped at 100</span>
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-ship">Delivery <Kbd ns="nqd">F8</Kbd></label>
                    <input id="nqd-m-ship" className="nqd-ctl num" inputMode="decimal" value={doc.shipping} onChange={(e) => set({ shipping: keep(e.target.value) })} />
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-extra">Other charges</label>
                    <input id="nqd-m-extra" className="nqd-ctl num" inputMode="decimal" value={doc.extra} onChange={(e) => set({ extra: keep(e.target.value) })} />
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-settled">Amount settled</label>
                    <input id="nqd-m-settled" className="nqd-ctl num" inputMode="decimal" value={doc.settled} onChange={(e) => set({ settled: keep(e.target.value) })} />
                </div>
            </div>
        </Sheet>
    );
}

/* ── The keymap. The FULL map, and every row on it is wired ────────────────── */
export function KeysSheet({ open, onClose, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Keyboard" subtitle="one map for the whole product" size={narrow ? 'bottom' : 'side'} ns="nqd">
            <div className="nqd-note" style={{ margin: '12px 16px' }}>
                The documented F-key map existed only in <code>Pos.jsx</code>.
                <code> KeyboardShortcutsModal.jsx</code> advertised it to every user and no document
                screen implemented any of it.
            </div>
            <div className="nqd-keymap">
                {LAW.pos.keymap.filter(([, , where]) => where.includes('document') || where === 'everywhere').map(([k, action, where]) => (
                    <React.Fragment key={k}>
                        <Kbd ns="nqd">{k}</Kbd>
                        <span>{action}</span>
                        <span className="mono">{where}</span>
                    </React.Fragment>
                ))}
            </div>
        </Sheet>
    );
}

/* ── Everything else this type can do ──────────────────────────────────────── */
export function ActionsSheet({ open, onClose, type, onRun, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Document actions" subtitle={type.name} size={narrow ? 'bottom' : 'side'} ns="nqd">
            <div className="nqd-note" style={{ margin: '12px 16px' }}>
                No email, WhatsApp, PDF, duplicate or record-payment action exists on any editor in
                the shipped code — email and WhatsApp live only on <code>Sales/Show.jsx</code>. They
                are document actions, so they belong to the document.
            </div>
            {overflowActions(type).map((a) => (
                <button key={a} type="button" className="nqd-row" onClick={() => { onRun(a); onClose(); }}>
                    <span className="nqd-rowmain"><span className="nqd-rowtitle">{a}</span></span>
                </button>
            ))}
        </Sheet>
    );
}

/* ── Recent documents ──────────────────────────────────────────────────────── */
export function RecentSheet({ open, onClose, onOpenDoc, narrow }) {
    return (
        <Sheet open={open} onClose={onClose} title="Recent documents" size={narrow ? 'bottom' : 'side'} ns="nqd">
            {RECENT_DOCS.map((d) => (
                <button key={d.id} type="button" className="nqd-row" onClick={() => { onOpenDoc(d); onClose(); }}>
                    <span className="nqd-rowmain">
                        <span className="nqd-rowtitle">{d.id} · {d.party}</span>
                        <span className="nqd-rowsub">{d.at} · {d.status}</span>
                    </span>
                    <Money value={d.total} font={14} avail={110} />
                </button>
            ))}
        </Sheet>
    );
}

/* ── Command palette ───────────────────────────────────────────────────────── */
export function Palette({ open, onClose, commands }) {
    const [q, setQ] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (open) setQ(''); }, [open]);
    const trap = focusTrap(ref, open);
    if (!open) return null;
    const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
    return (
        // The palette is its own dialog rather than a Sheet, so it needs the
        // same promise kept by hand.
        <div ref={ref} className="nqd-palette" role="dialog" aria-modal="true" aria-label="Commands" onKeyDown={trap}>
            <input autoFocus placeholder="Type a command…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) { list[0].run(); onClose(); } }} />
            <div className="nqd-sb">
                {list.map((c) => (
                    <button key={c.label} type="button" className="nqd-row" onClick={() => { c.run(); onClose(); }}>
                        <span className="nqd-rowmain"><span className="nqd-rowtitle">{c.label}</span>{c.note ? <span className="nqd-rowsub">{c.note}</span> : null}</span>
                        {c.key ? <Kbd ns="nqd">{c.key}</Kbd> : null}
                    </button>
                ))}
                {!list.length ? <div className="nqd-empty">Nothing matches.</div> : null}
            </div>
        </div>
    );
}

/* ── Nav drawer ────────────────────────────────────────────────────────────── */
export function NavDrawer({ open, onClose, items, current, width }) {
    // Built on Sheet, so it gets the focus move, the focus restore and the trap
    // — hand-rolling the same markup is how it had none of the three.
    return (
        <Sheet open={open} onClose={onClose} title="VenQore" side="left" width={width} ns="nqd">
            {items.map((n) => (
                <button key={n.id} type="button" className="nqd-navitem" aria-current={n.id === current ? 'true' : undefined}>
                    <span aria-hidden style={{ width: 20, textAlign: 'center' }}>{n.glyph}</span>
                    {n.label}
                </button>
            ))}
        </Sheet>
    );
}

export { n0, n2, r2 };
