/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — the sheets                                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything one gesture away rather than resident. Same two rules as the
 * register: a sheet is the SAME controls and not fewer, and there is ONE editor
 * per object.
 */

import React, { useEffect, useState } from 'react';
import { Kbd, Money, Sheet } from '@/LayoutLaw/ui';
import { LAW } from '@/LayoutLaw/law';
import { TYPES, buildPayload, label, overflowActions } from './fields';
import {
    PRODUCTS, RECENT_DOCS, SOURCE_DOCS, TAX_RATES, partiesFor, searchProducts,
} from './mock';
import { n0, n2, r2 } from './zones';

/* ── The party picker. Its LIST is derived from the document's side ────────── */
export function PartySheet({ open, onClose, type, current, onPick, narrow }) {
    const [q, setQ] = useState('');
    const [creating, setCreating] = useState(null);
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
                    <div className="nqd-f"><label htmlFor="nqd-np-d">Default discount %</label><input id="nqd-np-d" className="nqd-ctl num" inputMode="decimal" value={creating.discount} onChange={(e) => setCreating({ ...creating, discount: Math.min(100, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })} /></div>
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
export function ProductSheet({ open, onClose, onPick, onCreate, narrow }) {
    const [q, setQ] = useState('');
    const [creating, setCreating] = useState(null);
    useEffect(() => { if (open) { setQ(''); setCreating(null); } }, [open]);
    const { matches } = searchProducts(q, PRODUCTS);
    const list = q.trim() ? matches : PRODUCTS;

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
                    <div className="nqd-f"><label htmlFor="nqd-npr-r">Rate</label><input id="nqd-npr-r" className="nqd-ctl num" inputMode="decimal" value={creating.rate} onChange={(e) => setCreating({ ...creating, rate: e.target.value.replace(/[^\d.]/g, '') })} /></div>
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

/* ── The breakdown. Ctrl+F, and a tap on the total ─────────────────────────── */
export function BreakdownSheet({ open, onClose, type, doc, computed, narrow }) {
    const taxRate = TAX_RATES.find((t) => t.id === doc.taxRate) || TAX_RATES[1];
    /* The same rows as the summary, in the same order, with the ones the
       density hides added back. ONE meaning of the word "subtotal" on the
       screen: it is the gross, before discounts, everywhere. The breakdown
       used to call the net-of-item-discounts figure "Subtotal" too, which is
       two definitions of one word two inches apart. */
    const rows = [
        ['Subtotal', computed.gross],
        ['Item discounts', -computed.lineDisc],
        ['Document discount', -computed.docDisc],
        ['Delivery', doc.shipping],
        ['Other charges', doc.extra],
        [`Tax ${taxRate.breakdown || `${taxRate.rate}%`}${doc.taxInclusive ? ' (included)' : ''}`, computed.tax],
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
            <div className="nqd-sumrow"><span className="k">Units</span><span className="v num">{computed.units}</span></div>
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
                        onChange={(e) => set({ discount: Math.min(100, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })}
                    />
                    <span className="hint">a percentage of the subtotal, clamped at 100</span>
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-ship">Delivery <Kbd ns="nqd">F8</Kbd></label>
                    <input id="nqd-m-ship" className="nqd-ctl num" inputMode="decimal" value={doc.shipping} onChange={(e) => set({ shipping: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-extra">Other charges</label>
                    <input id="nqd-m-extra" className="nqd-ctl num" inputMode="decimal" value={doc.extra} onChange={(e) => set({ extra: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                </div>
                <div className="nqd-f">
                    <label htmlFor="nqd-m-settled">Amount settled</label>
                    <input id="nqd-m-settled" className="nqd-ctl num" inputMode="decimal" value={doc.settled} onChange={(e) => set({ settled: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
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
    useEffect(() => { if (open) setQ(''); }, [open]);
    if (!open) return null;
    const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="nqd-palette" role="dialog" aria-modal="true" aria-label="Commands">
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
    return (
        <aside
            className="nqd-sheet" data-side="left" data-open={open ? 'true' : 'false'}
            style={{ width: width ? `${width}px` : undefined }}
            role="dialog" aria-modal="true" aria-label="Navigation" aria-hidden={!open}
        >
            <header className="nqd-sh">
                <span style={{ fontFamily: 'var(--vq-font-display)', fontWeight: 700, fontSize: 16 }}>VenQore</span>
                <span style={{ flex: 1 }} />
                <button type="button" className="nqd-iconbtn" aria-label="Close" onClick={onClose}>✕</button>
            </header>
            <div className="nqd-sb">
                {items.map((n) => (
                    <button key={n.id} type="button" className="nqd-navitem" aria-current={n.id === current ? 'true' : undefined}>
                        <span aria-hidden style={{ width: 20, textAlign: 'center' }}>{n.glyph}</span>
                        {n.label}
                    </button>
                ))}
            </div>
        </aside>
    );
}

export { n0, n2, r2 };
