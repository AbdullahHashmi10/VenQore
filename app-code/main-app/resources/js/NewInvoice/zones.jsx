/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — the three zones, the dock and the splitter                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Every one of these is declared at MODULE scope on purpose. A component
 * declared inside a render gets a new identity on each keystroke, React
 * unmounts and remounts it, and whatever field you were typing into loses the
 * caret mid-number. That is not a style preference; it is the difference
 * between an editable line table and one you cannot type in.
 *
 * None of them asks how wide the screen is. `composeDocument()` answered that
 * once, and each zone renders inside the width it was handed.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Money } from '@/LayoutLaw/ui';
import { DOC_COLW, formatToFit } from '@/LayoutLaw/engine';
import { CAP_FIELDS, HEADER_FIELDS, capKeysFor, headerKeysFor, label, has, off, secondaryActions } from './fields';
import {
    ACCOUNTS, CURRENCIES, DOC_STATUS, EXPENSE_CATEGORIES, FREQUENCIES, GOODS_STATUS,
    LOCATIONS, METHODS, PROJECTS, TAX_RATES, TERMS,
} from './mock';

export const n2 = (v) => (Number.isFinite(v) ? v : 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n0 = (v) => Math.round(Number.isFinite(v) ? v : 0).toLocaleString('en-US');
export const r2 = (v) => Math.round(v * 100) / 100;

/* Grid widths mirror the engine's DOC_COLW, which is what the density veto is
   measured against. `item` is the only flexible one. */
const COLW = {
    idx: `${DOC_COLW.idx + 6}px`,
    item: 'minmax(140px,1fr)',
    qty: `${DOC_COLW.qty}px`,
    free: `${DOC_COLW.free}px`,
    uom: `${DOC_COLW.uom}px`,
    rate: `${DOC_COLW.rate}px`,
    disc: `${DOC_COLW.disc}px`,
    tax: `${DOC_COLW.tax}px`,
    total: `${DOC_COLW.total}px`,
    del: `${DOC_COLW.del + 4}px`,
};
const COLLBL = {
    idx: '#', item: 'Item', qty: 'Qty', free: 'Free', uom: 'Unit',
    rate: 'Rate', disc: 'Disc', tax: 'Tax %', total: 'Amount', del: '',
};
const NUMC = ['idx', 'qty', 'free', 'rate', 'disc', 'tax', 'total'];

/* ══════════════════════════════════════════════════════════════════════════
   FIELDS
   ══════════════════════════════════════════════════════════════════════════ */

const SELECT_OPTIONS = {
    terms: () => TERMS.map((t) => [t.id, t.label]),
    method: () => METHODS.map((m) => [m, m]),
    account: () => ACCOUNTS.map((a) => [a.id, a.name]),
    location: () => LOCATIONS.map((l) => [l.id, l.name]),
    locationTo: () => LOCATIONS.map((l) => [l.id, l.name]),
    project: () => PROJECTS.map((p) => [p.id, p.name]),
    currency: () => CURRENCIES.map((c) => [c.code, `${c.code} — ${c.name}`]),
    goodsStatus: () => GOODS_STATUS.map((g) => [g, g]),
    status: () => DOC_STATUS.map((s) => [s, s]),
    category: () => EXPENSE_CATEGORIES.map((c) => [c, c]),
    frequency: () => FREQUENCIES.map((f) => [f, f]),
    activePaused: () => [['active', 'Active'], ['paused', 'Paused']],
};

export function Field({
    id, label: lbl, kind, required, value, hint, error, options, onChange, onOpen, rank = 2,
}) {
    const common = {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-label': lbl,
    };
    let control;
    if (kind === 'party' || kind === 'doc') {
        control = (
            <button
                type="button" className="nqd-ctl" data-party={value ? 'true' : undefined}
                data-rank={rank} onClick={onOpen} {...common}
            >
                {value ? <span className="nqd-avatar">{String(value)[0]}</span> : null}
                <span className={value ? undefined : 'ph'}>{value || `Choose a ${lbl.toLowerCase()}`}</span>
                <span className="chev" aria-hidden>⌄</span>
            </button>
        );
    } else if (kind === 'select') {
        // A required select with nothing chosen must LOOK unchosen. Showing the
        // first option while the field is flagged red is a form telling the user
        // two different things about the same field.
        const unchosen = required && (value === undefined || value === null || value === '');
        control = (
            <select className="nqd-ctl" data-rank={rank} value={unchosen ? '' : (value ?? '')} onChange={(e) => onChange(e.target.value)} {...common}>
                {unchosen ? <option value="">Choose one…</option> : null}
                {(options || []).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
        );
    } else if (kind === 'toggle') {
        control = (
            <button type="button" className="nqd-ctl" data-rank={rank} onClick={() => onChange(!value)} {...common}>
                <span>{value ? 'Yes' : 'No'}</span>
                <span className="chev" aria-hidden>⇄</span>
            </button>
        );
    } else if (kind === 'file') {
        control = (
            <button type="button" className="nqd-ctl" data-rank={rank} onClick={onOpen} {...common}>
                <span className={value ? undefined : 'ph'}>{value || 'Attach a file'}</span>
                <span className="chev" aria-hidden>▤</span>
            </button>
        );
    } else if (kind === 'textarea') {
        control = <textarea data-rank={rank} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...common} />;
    } else {
        control = (
            <input
                className={`nqd-ctl${kind === 'num' ? ' num' : ''}`}
                data-rank={rank}
                inputMode={kind === 'num' ? 'decimal' : undefined}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                {...common}
            />
        );
    }
    return (
        <div className="nqd-f">
            <label htmlFor={id}>{lbl}{required ? <span className="nqd-req" aria-hidden>*</span> : null}</label>
            {control}
            {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAILS
   ══════════════════════════════════════════════════════════════════════════ */

export function DetailsZone({ D, type, doc, set, errors, onOpenParty, onOpenSource, total, onToggle }) {
    if (D.details.mode === 'collapsed') {
        // One line — party, number, date, terms and the running total. It is
        // worth five to ten more visible item rows on a laptop, and the
        // read-out prints the number so the trade is not a matter of opinion.
        const f = formatToFit(total, Math.max(90, D.avail * 0.28), 15, 'PKR');
        return (
            <button
                type="button" className="nqd-strip" data-rank="2" onClick={onToggle}
                title="Open the customer and details block"
            >
                <span className="chev" aria-hidden>▸</span>
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="who">{off(type, 'party') ? type.name : (doc.party?.name || `No ${label(type, 'party', 'party').toLowerCase()} yet`)}</span>
                    <span className="meta">{doc.docno} · {doc.date}{doc.terms ? ` · ${(TERMS.find((t) => t.id === doc.terms) || {}).label}` : ''}</span>
                </span>
                <span className="amt num" title={f.exact}>{f.text}</span>
            </button>
        );
    }

    const keys = headerKeysFor(type, D.headerFields);
    const capKeys = capKeysFor(type);
    const cols = D.details.twoCol ? (D.avail > 1100 ? 4 : 2) : 1;

    const VAL = {
        party: doc.party?.name,
        docno: doc.docno,
        partyref: doc.partyref,
        date: doc.date,
        due: doc.due,
        terms: doc.terms,
        method: doc.method,
        account: doc.account,
        location: doc.location,
        project: doc.project,
        currency: doc.currency,
        fx: doc.fx,
    };

    return (
        <section className="nqd-zone" data-rank="2">
            <header className="nqd-zh">
                <span>Details</span>
                <button type="button" className="nqd-togg" onClick={onToggle} title="Collapse to one line and give the height to the items">
                    Collapse ▴
                </button>
            </header>
            <div className="nqd-hdr" style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>
                {keys.map((k) => {
                    const def = HEADER_FIELDS[k](type);
                    return (
                        <Field
                            key={k}
                            id={`nqd-h-${k}`}
                            label={def.label}
                            kind={def.kind}
                            required={def.required}
                            hint={def.hint}
                            error={errors[k]}
                            value={VAL[k]}
                            options={SELECT_OPTIONS[k] ? SELECT_OPTIONS[k]() : undefined}
                            onOpen={k === 'party' ? onOpenParty : undefined}
                            onChange={(v) => set({ [k]: v })}
                            rank={k === 'party' ? 1 : 2}
                        />
                    );
                })}

                {/* Capability fields. A width may veto a DENSITY; it may never
                    veto a capability, so these render at every size. */}
                {capKeys.map((k) => {
                    const def = CAP_FIELDS[k];
                    const stateKey = {
                        valid_until: 'validUntil',
                        expected_date: 'expectedDate',
                        next_run: 'nextRun',
                        active_paused: 'activePaused',
                        goods_status: 'goodsStatus',
                        doc_status: 'status',
                        source_doc: 'sourceDoc',
                        tax_inclusive_flag: 'taxInclusive',
                        tax_amount: 'taxAmount',
                        business_pct: 'businessPct',
                        location_pair: 'locationTo',
                        refund_account: 'refundAccount',
                        landed_costs: 'landedCosts',
                    }[k] || k;
                    const optKey = { location_pair: 'locationTo', doc_status: 'status', goods_status: 'goodsStatus', active_paused: 'activePaused', refund_account: 'account' }[k] || k;
                    return (
                        <Field
                            key={k}
                            id={`nqd-c-${k}`}
                            label={k === 'location_pair' ? `To location (from ${(LOCATIONS.find((l) => l.id === doc.location) || {}).name || '—'})` : def.label}
                            kind={def.kind}
                            required={def.required}
                            hint={def.hint}
                            error={errors[stateKey]}
                            value={doc[stateKey]}
                            options={SELECT_OPTIONS[optKey] ? SELECT_OPTIONS[optKey]() : undefined}
                            onOpen={k === 'source_doc' ? onOpenSource : undefined}
                            onChange={(v) => set({ [stateKey]: v })}
                        />
                    );
                })}

                {/* FIX · Notes is in six payloads and in WorkspaceContext's default
                    document, and NONE of the eight clone screens renders a
                    textarea for it. Resident on every type, from here on. */}
                <div className="nqd-f" style={{ gridColumn: cols > 1 ? `span ${Math.min(2, cols)}` : 'auto' }}>
                    <label htmlFor="nqd-h-notes">Notes</label>
                    <textarea
                        id="nqd-h-notes" data-rank="2" value={doc.notes}
                        placeholder="Anything that should appear on the document…"
                        onChange={(e) => set({ notes: e.target.value })}
                    />
                    <span className="hint">resident on every type — it was in six payloads with no input anywhere</span>
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   LINES
   ══════════════════════════════════════════════════════════════════════════ */

function EditableCell({ value, numeric, suffix, disabled, onCommit, ariaLabel }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (editing && ref.current) ref.current.select(); }, [editing]);

    if (editing) {
        return (
            <input
                ref={ref}
                className="nqd-cellinput"
                inputMode={numeric ? 'decimal' : undefined}
                value={draft}
                aria-label={ariaLabel}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { setEditing(false); onCommit(draft); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); setEditing(false); onCommit(draft); }
                    if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
                }}
            />
        );
    }
    return (
        <button
            type="button"
            className={`nqd-cell${numeric ? ' n' : ''}`}
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={() => { setDraft(String(value)); setEditing(true); }}
        >
            {numeric ? n2(Number(value)) : value}{suffix || ''}
        </button>
    );
}

export function LinesZone({
    D, type, doc, columns, perms, computed, selected, onSelect,
    onPatchLine, onRemoveLine, onAddLine, onOpenPicker, openCard, setOpenCard,
}) {
    const rateLabel = label(type, 'rate', 'Rate');
    const canPrice = perms['documents.price_override'];
    const canDisc = perms['documents.discount'];
    const canDel = perms['documents.delete_line'];

    const head = (
        <header className="nqd-zh">
            <span>Items</span>
            <span style={{ flex: 1 }} />
            <span className="mono">{doc.lines.length} lines · {D.lines.fit}</span>
        </header>
    );

    const addRow = (
        <button type="button" className="nqd-addline" data-rank="1" onClick={onAddLine}>
            <span aria-hidden>+</span>
            <span>Add a line</span>
            <span className="nqd-kbd" style={{ marginLeft: 'auto' }}>Alt+Q</span>
        </button>
    );

    if (!doc.lines.length) {
        return (
            <section className="nqd-zone" data-rank="1">
                {head}
                <div className="nqd-empty">Nothing on this document yet. Add a line, or scan.</div>
                {addRow}
            </section>
        );
    }

    /* ── cards ──────────────────────────────────────────────────────────── */
    if (D.lines.fit === 'cards') {
        return (
            <section className="nqd-zone" data-rank="1">
                {head}
                {doc.lines.map((l, i) => (
                    <React.Fragment key={l.u}>
                        <button
                            type="button"
                            className="nqd-card"
                            data-open={openCard === l.u ? 'true' : undefined}
                            onClick={() => setOpenCard(openCard === l.u ? null : l.u)}
                        >
                            <span className="top">
                                <span className="nm">{l.name}</span>
                                <Money value={computed.lineNet(l)} font={14} avail={110} />
                            </span>
                            <span className="grid">
                                <span className="nqd-mini"><span className="k">Qty</span><span className="v">{l.qty}</span></span>
                                {columns.includes('rate') ? <span className="nqd-mini"><span className="k">{rateLabel}</span><span className="v">{n2(l.rate)}</span></span> : null}
                                {columns.includes('disc') ? <span className="nqd-mini"><span className="k">Disc</span><span className="v">{l.disc}%</span></span> : null}
                                {columns.includes('uom') ? <span className="nqd-mini"><span className="k">Unit</span><span className="v">{l.uom}</span></span> : null}
                            </span>
                        </button>
                        {openCard === l.u ? (
                            /* Tap-to-adjust: a line is a summary until you touch
                               it, then it opens its own controls IN PLACE. No
                               modal, no separate edit screen. */
                            <div className="nqd-adjust">
                                <div className="nqd-adjf">
                                    <span className="k">Quantity</span>
                                    <div className="nqd-step">
                                        <button type="button" aria-label="One fewer" onClick={(e) => { e.stopPropagation(); onPatchLine(l.u, { qty: Math.max(0, l.qty - 1) }); }}>−</button>
                                        <span className="n">{l.qty}</span>
                                        <button type="button" aria-label="One more" onClick={(e) => { e.stopPropagation(); onPatchLine(l.u, { qty: l.qty + 1 }); }}>+</button>
                                    </div>
                                </div>
                                {columns.includes('rate') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">{rateLabel}</span>
                                        <input className="num" inputMode="decimal" disabled={!canPrice} value={l.rate} aria-label={rateLabel} onChange={(e) => onPatchLine(l.u, { rate: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                                    </div>
                                ) : null}
                                {columns.includes('disc') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Discount %</span>
                                        <input className="num" inputMode="decimal" disabled={!canDisc} value={l.disc} aria-label="Discount percent" onChange={(e) => onPatchLine(l.u, { disc: Math.min(100, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })} />
                                    </div>
                                ) : null}
                                {columns.includes('uom') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Unit</span>
                                        <select value={l.uom} aria-label="Unit" onChange={(e) => onPatchLine(l.u, { uom: e.target.value })}>
                                            {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                ) : null}
                                {columns.includes('tax') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Tax %</span>
                                        <input className="num" inputMode="decimal" value={l.tax} aria-label="Tax percent" onChange={(e) => onPatchLine(l.u, { tax: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                                    </div>
                                ) : null}
                                {columns.includes('free') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Free</span>
                                        <input className="num" inputMode="decimal" value={l.free} aria-label="Free quantity" onChange={(e) => onPatchLine(l.u, { free: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
                                    </div>
                                ) : null}
                                <div className="nqd-adjf">
                                    <span className="k">&nbsp;</span>
                                    <button type="button" className="nqd-rm" disabled={!canDel} onClick={(e) => { e.stopPropagation(); onRemoveLine(l); }}>Remove line</button>
                                </div>
                            </div>
                        ) : null}
                    </React.Fragment>
                ))}
                {addRow}
            </section>
        );
    }

    /* ── table ──────────────────────────────────────────────────────────── */
    return (
        <section className="nqd-zone" data-rank="1">
            {head}
            <div className="nqd-tblwrap">
                <table className="nqd-tbl">
                    <colgroup>{columns.map((c) => <col key={c} style={{ width: COLW[c] }} />)}</colgroup>
                    <thead>
                        <tr>{columns.map((c) => (
                            <th key={c} className={NUMC.includes(c) ? 'n' : undefined} scope="col">
                                {c === 'rate' ? rateLabel : COLLBL[c]}
                            </th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {doc.lines.map((l, i) => (
                            <tr key={l.u} data-sel={selected === l.u ? 'true' : undefined} onFocus={() => onSelect(l.u)}>
                                {columns.map((c) => {
                                    if (c === 'idx') return <td key={c} className="n"><span className="nqd-cell n">{i + 1}</span></td>;
                                    if (c === 'item') {
                                        return (
                                            <td key={c}>
                                                <button type="button" className="nqd-cell name" title={`${l.name} · ${l.sku}`} onClick={() => onOpenPicker(l.u)}>
                                                    {l.name}
                                                </button>
                                            </td>
                                        );
                                    }
                                    if (c === 'total') {
                                        return (
                                            <td key={c} className="n">
                                                <span className="nqd-cell n"><Money value={computed.lineNet(l)} font={13} avail={DOC_COLW.total - 20} /></span>
                                            </td>
                                        );
                                    }
                                    if (c === 'del') {
                                        return (
                                            <td key={c} className="n">
                                                <button type="button" className="nqd-cell n" disabled={!canDel} aria-label={`Remove ${l.name}`} style={{ color: 'var(--vq-text-3)' }} onClick={() => onRemoveLine(l)}>✕</button>
                                            </td>
                                        );
                                    }
                                    if (c === 'uom') {
                                        return (
                                            <td key={c}>
                                                <select className="nqd-cell" aria-label={`Unit for ${l.name}`} value={l.uom} onChange={(e) => onPatchLine(l.u, { uom: e.target.value })}>
                                                    {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </td>
                                        );
                                    }
                                    const map = {
                                        qty: { v: l.qty, dis: false, suf: '' },
                                        free: { v: l.free, dis: false, suf: '' },
                                        rate: { v: l.rate, dis: !canPrice, suf: '' },
                                        disc: { v: l.disc, dis: !canDisc, suf: '%' },
                                        tax: { v: l.tax, dis: false, suf: '%' },
                                    }[c];
                                    return (
                                        <td key={c} className="n">
                                            <EditableCell
                                                value={map.v}
                                                numeric
                                                suffix={map.suf}
                                                disabled={map.dis}
                                                ariaLabel={`${COLLBL[c]} for ${l.name}`}
                                                onCommit={(raw) => {
                                                    let v = Number(String(raw).replace(/[^\d.]/g, '')) || 0;
                                                    if (c === 'disc') v = Math.min(100, Math.max(0, v));
                                                    if (c === 'qty') v = Math.max(0, v);
                                                    onPatchLine(l.u, { [c]: v });
                                                }}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {addRow}
        </section>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUMMARY
   ══════════════════════════════════════════════════════════════════════════ */

export function SummaryZone({ D, type, doc, computed, width, onBreakdown, onPrimary, onAction, saving }) {
    const wpx = D.summary.mode === 'right' ? D.summary.px : width;
    const taxRate = TAX_RATES.find((t) => t.id === doc.taxRate) || TAX_RATES[1];

    /* A density decides WHICH summary rows exist, and Standard has no line for
       delivery or other charges. A total that silently includes a number no row
       on screen accounts for is exactly the defect this page exists to answer —
       so when the density does not itemise charges, the subtotal carries them
       and says so. The rows then sum to the total at every density. */
    const itemised = D.summaryRows.includes('shipping') || D.summaryRows.includes('extra');
    const charges = itemised ? 0 : computed.charges;

    const ROWS = {
        subtotal: () => [charges ? 'Subtotal incl. charges' : 'Subtotal', computed.gross + charges],
        item_disc: () => ['Item discounts', -computed.lineDisc],
        doc_disc: () => ['Document discount', -computed.docDisc],
        tax: () => [`Tax ${taxRate.rate}%${doc.taxInclusive ? ' (included)' : ''}`, computed.tax],
        tax_breakdown: () => [`Tax · ${taxRate.breakdown || `${taxRate.rate}%`}`, computed.tax],
        shipping: () => ['Delivery', doc.shipping],
        extra: () => ['Other charges', doc.extra],
        roundoff: () => ['Round off', computed.round],
        total: () => [label(type, 'total', 'Total'), computed.total, 'tot'],
        settled: () => [label(type, 'settled', 'Amount settled'), doc.settled],
        balance: () => ['Balance', r2(computed.total - doc.settled), 'bal'],
    };

    const secondary = secondaryActions(type);
    const primaryLabel = label(type, 'save', 'Save');
    const bw = (s) => Math.round(s.length * 7.6) + 34;
    let room = wpx - 28 - Math.max(120, bw(primaryLabel)) - 8 - 44;
    const shown = [];
    for (const s of secondary) {
        if (room - bw(s) - 8 < 0) break;
        room -= bw(s) + 8;
        shown.push(s);
    }

    return (
        <section className="nqd-zone" data-rank="1">
            <header className="nqd-zh">
                <span>Summary</span>
                {D.summary.pin === 'sticky' ? (
                    <span className="mono" style={{ marginLeft: 'auto' }} title="The whole column fits on this screen, so it holds still while the items scroll.">
                        pinned
                    </span>
                ) : null}
            </header>

            {/* EXACTLY one row per key in the density's summary list — never an
                extra. The law measures this column's height from that list, so
                an extra row painted here is a column the law thinks fits and
                does not. */}
            {D.summaryRows.map((k) => {
                const [lbl, val, kind] = (ROWS[k] || (() => [k, 0]))();
                const tot = kind === 'tot';
                return (
                    <div className="nqd-sumrow" data-kind={kind} key={k}>
                        <span className="k">{lbl}</span>
                        {tot ? (
                            <button type="button" data-rank="2" title="Tap for the breakdown (Ctrl+F)" onClick={onBreakdown} style={{ minWidth: 0 }}>
                                <Money value={val} font={22} avail={Math.max(80, wpx - 150)} ccy="PKR" className="v" />
                            </button>
                        ) : (
                            <Money value={val} font={13} avail={Math.max(80, wpx - 150)} className="v" />
                        )}
                    </div>
                );
            })}

            <div className="nqd-actions">
                <button type="button" className="nqd-btn" data-pri="true" data-rank="1" disabled={saving} onClick={onPrimary}>
                    {primaryLabel}
                </button>
                {shown.map((s) => (
                    <button key={s} type="button" className="nqd-btn" data-rank="2" onClick={() => onAction(s)}>{s}</button>
                ))}
                <button
                    type="button" className="nqd-btn" data-rank="2" aria-label="More actions"
                    title={shown.length < secondary.length
                        ? `${secondary.slice(shown.length).join(' · ')} — and everything else this type can do`
                        : 'Everything else this type can do'}
                    onClick={() => onAction('__more__')}
                >
                    ⋯
                </button>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE DOCK — a reserved row, never a float
   ══════════════════════════════════════════════════════════════════════════ */

export function DockBar({ D, type, doc, computed, on, onBreakdown, onPrimary, saving }) {
    const primaryLabel = label(type, 'save', 'Save');
    const btnW = Math.round(primaryLabel.length * 7.6) + 34;
    const showBd = D.avail > 560;
    const numW = Math.max(86, D.avail - 28 - 12 - btnW - (showBd ? 12 + 116 : 0));
    // The ladder is given 12% of headroom. The engine's advance widths are Space
    // Grotesk's; if the webfont has not arrived the fallback is wider, and a
    // total that ellipsises is never acceptable — better one rung leaner for a
    // moment than "PKR 193,746…" on a document someone is about to post.
    const f = formatToFit(computed.total, numW * 0.88, 20, 'PKR');
    const balance = r2(computed.total - doc.settled);

    return (
        <div className="nqd-dock" data-on={on ? 'true' : 'false'} data-rank="1">
            <div>
                <div className="k">{label(type, 'total', 'Total')}</div>
                <div className="v" title={f.exact}>{f.text}</div>
                {doc.settled ? (
                    <div className="bal">Balance {formatToFit(balance, (numW - 52) * 0.88, 11, '').text}</div>
                ) : null}
            </div>
            {showBd ? <button type="button" className="nqd-btn" data-ghost="true" data-rank="2" onClick={onBreakdown}>Breakdown</button> : null}
            <button type="button" className="nqd-btn" data-rank="1" disabled={saving} onClick={onPrimary}>{primaryLabel}</button>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE SPLITTER
   ══════════════════════════════════════════════════════════════════════════ */

export function VSplit({ value, inner, onChange, onReset, disabled }) {
    const ref = useRef(null);
    const nudge = (d) => onChange(Math.max(0.12, Math.min(0.55, value + d)));
    const down = (e) => {
        if (disabled) return;
        e.preventDefault();
        const node = ref.current;
        node.setPointerCapture(e.pointerId);
        node.dataset.drag = 'true';
        const x0 = e.clientX;
        const f0 = value;
        const move = (ev) => {
            // Dragging LEFT makes the summary wider, because the summary is on
            // the right of the divider. The sign here is the whole reason to
            // write it out rather than trust the reflex.
            onChange(Math.max(0.12, Math.min(0.55, f0 - (ev.clientX - x0) / inner)));
        };
        const up = () => {
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerup', up);
            node.removeEventListener('pointercancel', up);
            delete node.dataset.drag;
        };
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerup', up);
        node.addEventListener('pointercancel', up);
    };
    return (
        <div
            ref={ref}
            className="nqd-vsplit"
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize the summary"
            aria-valuenow={Math.round(value * 100)}
            aria-valuemin={12}
            aria-valuemax={55}
            title="Drag to resize · arrow keys work too · double-click restores the preset"
            onPointerDown={down}
            onDoubleClick={onReset}
            onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(0.02); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(-0.02); }
                else if (e.key === 'Home') { e.preventDefault(); onChange(0.55); }
                else if (e.key === 'End') { e.preventDefault(); onChange(0.12); }
            }}
        />
    );
}
