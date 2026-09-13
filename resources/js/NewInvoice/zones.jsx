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
    LOCATIONS, METHODS, PROJECTS, TAX_RATES, TERMS, fromISO, toISO,
} from './mock';

export const n2 = (v) => (Number.isFinite(v) ? v : 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n0 = (v) => Math.round(Number.isFinite(v) ? v : 0).toLocaleString('en-US');
export const r2 = (v) => Math.round(v * 100) / 100;

/* A number that a human is typing is a STRING until something reads it.
   Coercing on every keystroke eats the decimal point: after "1234." the handler
   stores Number("1234.") = 1234, the controlled input re-renders as "1234", and
   the two keys that follow append — so 1234.55 silently became 123,455 and
   posted. `keep` sanitises and leaves the string alone; `nz` is the only way a
   number is read back out. */
export const keep = (raw) => String(raw).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
export const nz = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const pct = (v) => Math.min(100, Math.max(0, nz(v)));

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
    // A control whose CONTENT is its value cannot be named by its caption alone
    // — the name replaces the content, so "Customer, button" was everything a
    // screen reader was ever told about a field reading "Ahsan Traders". These
    // three are buttons, so they also cannot be the target of a <label for>,
    // which is why their caption is a plain span.
    const shownValue = kind === 'toggle' ? (value ? 'Yes' : 'No') : (value || 'not set');
    const named = { ...common, 'aria-label': `${lbl}: ${shownValue}` };
    let control;
    if (kind === 'party' || kind === 'doc') {
        control = (
            <button
                type="button" className="nqd-ctl" data-party={value ? 'true' : undefined}
                data-rank={rank} onClick={onOpen} {...named}
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
        // A `<select>` always hands back a STRING, so a numeric id chosen from a
        // list stopped being a number the moment it was chosen. Two things broke
        // quietly: `doc.location === doc.locationTo` could never be true once
        // either had been touched, so a stock transfer from Main to Main passed
        // validation; and `warehouse_id` posted "2" where the server wants 2.
        // The option carries its own type — hand that back, not the DOM's copy.
        const back = (raw) => {
            const hit = (options || []).find(([v]) => String(v) === raw);
            onChange(hit ? hit[0] : raw);
        };
        control = (
            <select className="nqd-ctl" data-rank={rank} value={unchosen ? '' : (value ?? '')} onChange={(e) => back(e.target.value)} {...common}>
                {unchosen ? <option value="">Choose one…</option> : null}
                {(options || []).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
        );
    } else if (kind === 'date') {
        // A date field was a plain text box: `kind: 'date'` fell through to the
        // default branch, so eight of them accepted "next tuesday" and the terms
        // effect fed that straight to addDays. A native date control cannot
        // produce a date that is not one, and it brings the platform's picker,
        // keyboard stepping and locale with it.
        control = (
            <input
                type="date" className="nqd-ctl num" data-rank={rank}
                value={toISO(value)} onChange={(e) => onChange(fromISO(e.target.value))}
                {...common}
            />
        );
    } else if (kind === 'toggle') {
        control = (
            <button
                type="button" className="nqd-ctl" data-rank={rank} aria-pressed={!!value}
                onClick={() => onChange(!value)} {...named}
            >
                <span>{value ? 'Yes' : 'No'}</span>
                <span className="chev" aria-hidden>⇄</span>
            </button>
        );
    } else if (kind === 'file') {
        // The attachment control opened nothing. It was a button wired to an
        // `onOpen` that only the source-document field was ever given, so an
        // expense receipt — the one type whose whole point is the receipt —
        // had a control that did not respond to being pressed. A real file
        // input, hidden behind the label the way the platform intends, so the
        // picker, drag-and-drop target and keyboard behaviour are the OS's.
        control = (
            <>
                <input
                    type="file" id={id} className="nqd-file" aria-label={lbl}
                    aria-invalid={error ? 'true' : undefined}
                    onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        onChange(f ? f.name : '');
                        // Clearing the input is what lets the SAME file be
                        // chosen again after it has been removed.
                        e.target.value = '';
                    }}
                />
                <div className="nqd-ctl" data-rank={rank} data-file="true">
                    <label htmlFor={id} className="nqd-filebtn nqd-tight">{value ? 'Replace' : 'Choose a file'}</label>
                    <span className={value ? 'fname' : 'ph'}>{value || 'Nothing attached'}</span>
                    {value ? (
                        <button
                            type="button" className="nqd-tight nqd-filex" aria-label={`Remove ${value}`}
                            title="Remove" onClick={() => onChange('')}
                        >
                            ✕
                        </button>
                    ) : null}
                </div>
            </>
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
                // A numeric field keeps its STRING while it is being typed —
                // coercing on every keystroke eats the "." in "12." and makes
                // the field impossible to type a decimal into. It is sanitised
                // here and turned into a number once, by buildPayload.
                onChange={(e) => onChange(kind === 'num' ? keep(e.target.value) : e.target.value)}
                {...common}
            />
        );
    }
    return (
        <div className="nqd-f">
            {/* A file field's caption is NOT a <label for>: the visible
                "Choose a file" already is one, and two labels pointing at one
                input opens the picker twice on a single click. */}
            {/* A <label for> whose target is a <button> does nothing at all —
                clicking the caption is inert and the name comes from the
                button's own aria-label. Those kinds get a plain caption; the
                real form controls keep a real label. */}
            {['file', 'party', 'doc', 'toggle'].includes(kind)
                ? <span className="nqd-flbl">{lbl}{required ? <span className="nqd-req" aria-hidden>*</span> : null}</span>
                : <label htmlFor={id}>{lbl}{required ? <span className="nqd-req" aria-hidden>*</span> : null}</label>}
            {control}
            {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAILS
   ══════════════════════════════════════════════════════════════════════════ */

export function DetailsZone({ D, type, doc, set, errors, onOpenParty, onOpenSource, total, onToggle, forced, inSheet }) {
    if (D.details.mode === 'collapsed') {
        // One line — party, number, date, terms and the running total. It is
        // worth five to ten more visible item rows on a laptop, and the
        // read-out prints the number so the trade is not a matter of opinion.
        const f = formatToFit(total, Math.max(90, D.avail * 0.28), 15, 'PKR');
        return (
            <button
                type="button" className="nqd-strip" data-rank="2" onClick={onToggle}
                title={forced
                    ? 'This screen is too short to hold the block open, so it opens as a sheet. Every field is in it.'
                    : 'Open the customer and details block'}
                aria-label={`Customer and details: ${off(type, 'party') ? type.name : (doc.party?.name || 'no party yet')}, ${doc.docno}, ${doc.date}. Open.`}
            >
                <span className="chev" aria-hidden>{forced ? '⤢' : '▸'}</span>
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="who">{off(type, 'party') ? type.name : (doc.party?.name || `No ${label(type, 'party', 'party').toLowerCase()} yet`)}</span>
                    <span className="meta">{doc.docno} · {doc.date}{doc.terms ? ` · ${(TERMS.find((t) => t.id === doc.terms) || {}).label}` : ''}</span>
                </span>
                <span className="amt num" title={f.exact}>{f.text}</span>
            </button>
        );
    }

    const keys = headerKeysFor(type, D.headerFields);
    const capKeys = capKeysFor(type, keys);
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
        <section className="nqd-zone" data-rank="2" style={inSheet ? { border: 0, background: 'transparent' } : undefined}>
            {/* Inside the sheet the block is the whole of what is on screen,
                and the sheet already has a title and a close. A second header
                is a second title for one thing. */}
            {inSheet ? null : (
                <header className="nqd-zh">
                    <span>Details</span>
                    <button type="button" className="nqd-togg" onClick={onToggle} title="Collapse to one line and give the height to the items">
                        Collapse ▴
                    </button>
                </header>
            )}
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
                            /* Typing a due date MARKS it. The guard in the terms
                               effect was there and nothing ever set its flag, so
                               a hand-typed due date was still overwritten the
                               next time the document date changed. Picking a
                               term clears the mark — choosing Net 30 is asking
                               to be given the date it implies. */
                            onChange={(v) => set(k === 'due' ? { due: v, dueTouched: true }
                                : k === 'terms' ? { terms: v, dueTouched: false }
                                    : { [k]: v })}
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
                    const capDef = k === 'location' && has(type, 'location_pair')
                        ? { ...def, label: 'From location', required: true }
                        : def;
                    const optKey = { location_pair: 'locationTo', doc_status: 'status', goods_status: 'goodsStatus', active_paused: 'activePaused', refund_account: 'account' }[k] || k;
                    return (
                        <Field
                            key={k}
                            id={`nqd-c-${k}`}
                            label={k === 'location_pair' ? 'To location' : capDef.label}
                            kind={capDef.kind}
                            required={capDef.required}
                            hint={capDef.hint}
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
    const shown = `${numeric ? n2(nz(value)) : value}${suffix || ''}`;
    return (
        <button
            type="button"
            className={`nqd-cell${numeric ? ' n' : ''}`}
            disabled={disabled}
            /* An aria-label REPLACES the content it is on. "Qty for Panadol
               Extra 500mg" was therefore the whole of what a screen reader
               heard about this cell — the number in it never reached anybody
               using one. The name has to carry the value. */
            aria-label={`${ariaLabel}: ${shown}${disabled ? '' : '. Press to edit.'}`}
            onClick={() => { setDraft(String(value)); setEditing(true); }}
        >
            {shown}
        </button>
    );
}

export function LinesZone({
    D, type, doc, columns, perms, computed, selected, onSelect,
    onPatchLine, onRemoveLine, onAddLine, onOpenPicker, onOpenLine, openCard, setOpenCard, showMargin,
}) {
    const rateLabel = label(type, 'rate', 'Rate');
    // `rate_edit` is in goods receipt's `off` set and nothing read it, so the
    // unit cost stayed editable on a document that is not allowed to price.
    const canPrice = perms['documents.price_override'] && !off(type, 'rate_edit');
    const canDisc = perms['documents.discount'] && !off(type, 'disc');
    const canDel = perms['documents.delete_line'];

    /* "Show margin" was a switch in Settings → Operate that nothing read. It
       belongs in the ZONE HEADER, not in the summary: the summary's rows are
       what the law measures the column's height from, so a row painted there
       that the density did not ask for is a column the law thinks fits and does
       not. The header is a fixed 44px whatever is written across it.

       Sell side only — "margin" on a purchase bill is the supplier's, and it is
       hidden behind a permission, because a cost price is not everyone's to see. */
    const marginable = showMargin && type.side === 'sell' && perms['documents.price_override'] && doc.lines.length > 0;

    const head = (
        <header className="nqd-zh">
            <span>Items</span>
            {marginable ? (
                <span
                    className="nqd-margin" data-rank="2" data-tone={computed.margin < 0 ? 'bad' : undefined}
                    title={`Sold ${n2(computed.sub - computed.docDisc)} against a cost of ${n2(computed.cost)}, `
                        + 'net of both discounts and before tax. Free quantity is counted as cost.'}
                >
                    Margin {computed.marginPct}% · {n2(computed.margin)}
                </span>
            ) : null}
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
                                {columns.includes('rate') ? <span className="nqd-mini"><span className="k">{rateLabel}</span><span className="v">{n2(nz(l.rate))}</span></span> : null}
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
                                        <button type="button" aria-label="One fewer" onClick={(e) => { e.stopPropagation(); onPatchLine(l.u, { qty: Math.max(0, nz(l.qty) - 1) }); }}>−</button>
                                        <span className="n">{l.qty}</span>
                                        <button type="button" aria-label="One more" onClick={(e) => { e.stopPropagation(); onPatchLine(l.u, { qty: nz(l.qty) + 1 }); }}>+</button>
                                    </div>
                                </div>
                                {/* Gated by the TYPE, never by the density's
                                    column list. The column list is a width
                                    budget; it does not decide what a line can
                                    carry. Gating these on `columns` is how free
                                    quantity became unreachable on a sales
                                    invoice that declares it. */}
                                {has(type, 'qty_only') ? null : (
                                    <div className="nqd-adjf">
                                        <span className="k">{rateLabel}</span>
                                        <input className="num" inputMode="decimal" disabled={!canPrice} value={l.rate} aria-label={`${rateLabel} for ${l.name}`} onChange={(e) => onPatchLine(l.u, { rate: keep(e.target.value) })} />
                                    </div>
                                )}
                                {off(type, 'disc') || has(type, 'qty_only') ? null : (
                                    <div className="nqd-adjf">
                                        <span className="k">Discount %</span>
                                        <input className="num" inputMode="decimal" disabled={!canDisc} value={l.disc} aria-label={`Discount percent for ${l.name}`} onChange={(e) => onPatchLine(l.u, { disc: keep(e.target.value) })} />
                                    </div>
                                )}
                                <div className="nqd-adjf">
                                    <span className="k">Unit</span>
                                    <select value={l.uom} aria-label={`Unit for ${l.name}`} onChange={(e) => onPatchLine(l.u, { uom: e.target.value })}>
                                        {['pc', 'strip', 'pack', 'box', 'can', 'bottle', 'kg', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                {has(type, 'per_line_tax') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Tax %</span>
                                        <input className="num" inputMode="decimal" value={l.tax} aria-label={`Tax percent for ${l.name}`} onChange={(e) => onPatchLine(l.u, { tax: keep(e.target.value) })} />
                                    </div>
                                ) : null}
                                {has(type, 'free_qty') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">Free</span>
                                        <input className="num" inputMode="decimal" value={l.free} aria-label={`Free quantity for ${l.name}`} onChange={(e) => onPatchLine(l.u, { free: keep(e.target.value) })} />
                                    </div>
                                ) : null}
                                {has(type, 'batch_entry') || has(type, 'batch_pick') ? (
                                    <div className="nqd-adjf">
                                        <span className="k">{has(type, 'expiry_entry') ? 'Batch / expiry' : 'Batch'}</span>
                                        <input value={l.batch || ''} aria-label={`Batch for ${l.name}`} onChange={(e) => onPatchLine(l.u, { batch: e.target.value })} />
                                    </div>
                                ) : null}
                                <div className="nqd-adjf">
                                    <span className="k">Note</span>
                                    <input value={l.note || ''} aria-label={`Note on ${l.name}`} onChange={(e) => onPatchLine(l.u, { note: e.target.value })} />
                                </div>
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
                                                {/* Opens the LINE, not just the
                                                    picker: at Standard this is
                                                    the only way to reach free
                                                    quantity, unit, tax, batch
                                                    and the line note, and a
                                                    capability that a width can
                                                    hide is not a capability. */}
                                                <button
                                                    type="button" className="nqd-cell name" data-rank="2"
                                                    title={`${l.name} · ${l.sku} — open this line`}
                                                    aria-label={`Line ${i + 1}: ${l.name}. Open its fields.`}
                                                    onClick={() => onOpenLine(l.u)}
                                                >
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
       delivery, other charges or round-off. A total that silently includes a
       number no row on screen accounts for is exactly the defect this page
       exists to answer — so whatever the density does not itemise, the subtotal
       carries, and SAYS it carries. The rows sum to the total at every density.

       Round-off is the same defect in miniature: the total is Math.round(before)
       whenever the setting is on, so at Standard the seven rows summed to
       142,753.10 under a total that printed 142,753.00, with the missing ten
       paisa explained nowhere on the screen. */
    const carried = [];
    const charges = D.summaryRows.includes('shipping') || D.summaryRows.includes('extra')
        ? 0 : computed.charges;
    const round = D.summaryRows.includes('roundoff') ? 0 : computed.round;
    if (charges) carried.push('charges');
    if (round) carried.push('rounding');

    /* The tax row's LABEL must describe the number beside it. Building it from
       the document rate on a per-line-tax purchase bill printed 14,568.28 under
       "GST 17% + further 1%" — a rate that contributed nothing to it — and on an
       expense it printed the amount somebody typed under "Tax 18%", although
       nothing had been multiplied by 18. */
    const taxLabel = () => {
        if (has(type, 'no_lines')) return 'Tax (as entered)';
        if (computed.perLineTax) return 'Tax (per line)';
        if (computed.inclusive) return `Tax ${taxRate.rate}% (included in the prices)`;
        return `Tax ${taxRate.rate}%`;
    };
    const taxLabelLong = () => {
        if (has(type, 'no_lines') || computed.perLineTax) return taxLabel();
        return `Tax · ${taxRate.breakdown || `${taxRate.rate}%`}${computed.inclusive ? ' (included)' : ''}`;
    };

    const ROWS = {
        subtotal: () => [
            carried.length ? `Subtotal incl. ${carried.join(' & ')}` : 'Subtotal',
            r2(computed.gross + charges + round),
        ],
        item_disc: () => ['Item discounts', -computed.lineDisc],
        doc_disc: () => ['Document discount', -computed.docDisc],
        tax: () => [taxLabel(), computed.tax],
        tax_breakdown: () => [taxLabelLong(), computed.tax],
        shipping: () => ['Delivery', nz(doc.shipping)],
        extra: () => ['Other charges', nz(doc.extra)],
        roundoff: () => ['Round off', computed.round],
        total: () => [label(type, 'total', 'Total'), computed.total, 'tot'],
        settled: () => [label(type, 'settled', 'Amount settled'), nz(doc.settled)],
        balance: () => ['Balance', r2(computed.total - nz(doc.settled)), 'bal'],
    };

    /* A STOCK DOCUMENT HAS NOTHING TO TOTAL IN MONEY. Three of the thirteen
       declare `summary_money` in their `off` set and the summary showed them a
       Total, an Amount settled and a Balance anyway — and `buildPayload` drops
       `amount_settled` for the stock side, so the Balance row moved on screen
       and never travelled. What it counts instead is what a warehouse counts.

       Fewer rows than the density asked for is SAFE: the law measures this
       column's height from its own list, so a shorter column fits inside a
       height that was reserved for a taller one. More rows would not be. */
    const moneyOff = off(type, 'summary_money');
    const STOCK = [
        () => ['Lines', doc.lines.length, 'count'],
        () => ['Units', computed.units, 'count'],
        () => [has(type, 'expected_counted_difference') ? 'Counted' : 'Moving', computed.units, 'tot'],
    ];
    const keys = moneyOff ? STOCK.map((_, i) => `stock${i}`) : D.summaryRows;
    const rowAt = (k, i) => (moneyOff ? STOCK[i]() : (ROWS[k] || (() => [k, 0]))());

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
            {keys.map((k, i) => {
                const [lbl, val, kind] = rowAt(k, i);
                const tot = kind === 'tot';
                const count = kind === 'count' || (moneyOff && tot);
                const why = k === 'subtotal' && carried.length
                    ? `This density has no ${carried.join(' or ')} row, so the subtotal carries `
                        + `${[charges ? `${n2(charges)} of charges` : null, round ? `${n2(round)} of rounding` : null]
                            .filter(Boolean).join(' and ')}. The rows sum to the total.`
                    : undefined;
                return (
                    <div className="nqd-sumrow" data-kind={kind} key={k} title={why}>
                        <span className="k">{lbl}</span>
                        {count ? (
                            <span className="v num" style={tot ? { fontSize: 22 } : undefined}>{n0(val)}</span>
                        ) : tot ? (
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
    // A stock document has nothing to total in money here either.
    const moneyOff = off(type, 'summary_money');
    const f = moneyOff
        ? { text: `${n0(computed.units)} units`, exact: `${computed.units} units across ${doc.lines.length} lines` }
        : formatToFit(computed.total, numW * 0.88, 20, 'PKR');
    const balance = r2(computed.total - nz(doc.settled));

    /* `inert` backs up the CSS `visibility: hidden` on the browsers that have it:
       the faded dock is out of the tab order AND out of the accessibility tree,
       so Save is not announced from a bar nobody can see. It is set as a DOM
       PROPERTY rather than a JSX attribute because the two React majors disagree
       about how a boolean attribute is spelled in JSX — `inert=""` warns on 19,
       `inert={true}` renders `inert="true"` on 18 — and the property means the
       same thing to both. */
    const dockRef = useRef(null);
    useEffect(() => { if (dockRef.current) dockRef.current.inert = !on; }, [on]);

    return (
        <div
            ref={dockRef}
            className="nqd-dock" data-on={on ? 'true' : 'false'} data-rank="1"
            aria-hidden={on ? undefined : 'true'}
        >
            <div>
                <div className="k">{moneyOff ? 'Moving' : label(type, 'total', 'Total')}</div>
                <div className="v" title={f.exact}>{f.text}</div>
                {!moneyOff && nz(doc.settled) ? (
                    <div className="bal">Balance {formatToFit(balance, (numW - 52) * 0.88, 11, '').text}</div>
                ) : null}
            </div>
            {showBd && !moneyOff ? <button type="button" className="nqd-btn" data-ghost="true" data-rank="2" onClick={onBreakdown}>Breakdown</button> : null}
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
