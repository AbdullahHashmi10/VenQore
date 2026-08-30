import React, { useMemo, useState } from 'react';
import { X, LayoutGrid, Table2, Wallet, Type, Check, RotateCcw, ListChecks } from 'lucide-react';
import {
    LAYOUTS, CHOICES, LEVELS, PREVIEW_DEVICES,
    RAIL_PUSH_FROM, RAIL_W, composeDocument, matchLayout,
} from '@/Documents/documentLaw';
import { FIELD_LIBRARY } from '@/Documents/documentTypes';

/**
 * Document settings.
 *
 * The register's settings modal, for a document: a section rail, the options,
 * and a preview that keeps its own column.
 *
 * The preview runs `composeDocument` — the same function the real screen runs
 * — once per device width. It is not a drawing of the layout; it is the
 * layout, at 1/5 scale. Nothing here prints a measurement: if an arrangement
 * cannot be honoured on a phone, the preview simply shows what happens.
 */

const SECTIONS = [
    { id: 'layout', name: 'Layout', icon: LayoutGrid },
    { id: 'items', name: 'Items', icon: Table2 },
    { id: 'fields', name: 'Fields', icon: ListChecks },
    { id: 'charges', name: 'Charges', icon: Wallet },
    { id: 'display', name: 'Display', icon: Type },
];

function Switch({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            className="vqdoc-switch"
            onClick={() => onChange(!checked)}
        />
    );
}

function Opt({ title, hint, children, stack }) {
    return (
        <div className={`vqdoc-opt${stack ? ' stack' : ''}`}>
            <div className="t">
                <b>{title}</b>
                {hint && <span>{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function Seg({ value, options, onChange, size, fill }) {
    return (
        <div className={`vqdoc-seg${size === 'sm' ? ' sm' : ''}${fill ? ' fill' : ''}`}>
            {options.map(([v, l]) => (
                <button key={v} type="button" aria-pressed={String(value) === String(v)} onClick={() => onChange(v)}>
                    {l}
                </button>
            ))}
        </div>
    );
}

/* ── the arrangement thumbnails ─────────────────────────────────────────
   Drawn from one set of numbers rather than a nest of ternaries, so the five
   pictures share a horizon: the bar, the block, the table and the totals sit
   at the same heights in every one and only what actually differs moves. */
function LayoutArt({ art }) {
    const BAR = 13;
    const PAD = 7;
    const detailsH = art.details === 'strip' ? 9 : 25;
    const top = BAR + 6;
    const contentTop = top + detailsH + 5;
    const floor = art.dock ? 21 : PAD;
    const sumSide = art.sum === 'side';
    const sumBelow = art.sum === 'below';
    const linesBottom = sumBelow ? floor + 26 : floor;
    const linesRight = sumSide ? PAD + 26 + 4 : PAD;

    const rows = [];
    const rowTop = contentTop + 7;
    const rowGap = 8;
    const avail = 100 - rowTop - linesBottom - 4;
    for (let i = 0; i * rowGap + 4 < avail; i += 1) {
        rows.push(
            <i
                key={i}
                style={{
                    left: `${PAD + 4}%`,
                    right: `${linesRight + 4}%`,
                    top: `${rowTop + i * rowGap}%`,
                    height: '3%',
                    background: 'var(--vq-line)',
                    opacity: i === 0 ? 0 : 0.75,
                }}
            />,
        );
    }

    return (
        <div className="art">
            <i className="bar" style={{ height: `${BAR}%` }} />
            <i
                className="det"
                style={{ left: `${PAD}%`, right: `${PAD}%`, top: `${top}%`, height: `${detailsH}%` }}
            />
            <i
                className="lines"
                style={{ left: `${PAD}%`, right: `${linesRight}%`, top: `${contentTop}%`, bottom: `${linesBottom}%` }}
            />
            <i
                style={{
                    left: `${PAD}%`, right: `${linesRight}%`, top: `${contentTop}%`, height: '6%',
                    background: 'var(--vq-surface-2)', borderBottom: '1px solid var(--vq-line)', borderRadius: '2px 2px 0 0',
                }}
            />
            {rows}
            {sumSide && (
                <i
                    className="sum"
                    style={{ right: `${PAD}%`, width: '26%', top: `${contentTop}%`, bottom: `${floor}%` }}
                />
            )}
            {sumBelow && (
                <i
                    className="sum"
                    style={{ left: `${PAD}%`, right: `${PAD}%`, bottom: `${floor}%`, height: '26%' }}
                />
            )}
            {art.dock && <i className="dock" />}
        </div>
    );
}

/* ── the preview ──────────────────────────────────────────────────────────
   Drawn at 1/N scale from the real decision, with the real furniture: a bar,
   fields, a header row and item rows, the totals block, the dock. */
function Preview({ device, comp, showRail }) {
    const MARGIN = 20;
    const railW = showRail && device.w >= RAIL_PUSH_FROM ? RAIL_W : 0;
    const inner = device.w - railW - MARGIN * 2;
    const law = composeDocument(inner, comp);

    const scale = 296 / device.w;
    const px = (n) => Math.round(n * scale * 100) / 100;
    const W = Math.round(device.w * scale);
    const H = Math.round(device.h * scale);

    const barH = px(64);
    const dockShown = comp.pin === 'docked' || law.summary === 'hidden';
    const dockH = dockShown ? px(68 + 20) : 0;
    const detH = comp.details === 'open' ? px(law.cards ? 250 : 176) : px(62);
    const top = barH + px(MARGIN) + detH + px(16);
    const bodyH = Math.max(px(80), H - top - dockH - px(MARGIN));
    const linesH = law.summary === 'below' ? bodyH * 0.6 : bodyH;
    const sumW = law.summary === 'side' ? px(inner * (law.split / 100)) : 0;
    const linesW = law.summary === 'side' ? px(inner) - sumW - px(16) : px(inner);

    const line = (w, o = 1, h = px(6)) => ({
        position: 'absolute', height: h, width: w, borderRadius: 2,
        background: 'var(--vq-line-strong)', opacity: o,
    });

    const rowH = px(52);
    const headH = px(38);
    const rows = Math.max(0, Math.floor((linesH - headH - px(50)) / rowH));

    const cols = law.cards ? 0 : LEVELS[law.level].cols.filter(c => c !== 'del' && c !== 'idx' && c !== 'item').length;

    const sumRows = LEVELS[law.level].summary.filter(r => !['total', 'settled', 'balance'].includes(r)).length;

    return (
        <div className="vqdoc-device" style={{ width: W + 16 }}>
            <div className="screen" style={{ width: W, height: H }}>
                {railW > 0 && <i style={{ left: 0, top: 0, bottom: 0, width: px(railW), background: 'var(--vq-ink-950)', borderRadius: 0 }} />}

                {/* the bar */}
                <i style={{ left: px(railW), right: 0, top: 0, height: barH, background: 'var(--vq-surface)', borderBottom: '1px solid var(--vq-line)', borderRadius: 0 }} />
                <i style={{ ...line(px(90), .8), left: px(railW + MARGIN), top: barH / 2 - px(3) }} />
                <i style={{ ...line(px(52), .35), right: px(MARGIN + 60), top: barH / 2 - px(3) }} />
                <i style={{ ...line(px(44), .35), right: px(MARGIN), top: barH / 2 - px(3) }} />

                {/* customer & details */}
                <i style={{
                    left: px(railW + MARGIN), width: px(inner), top: barH + px(MARGIN), height: detH,
                    background: 'var(--vq-surface)', border: '1px solid var(--vq-line)', borderRadius: 4,
                }} />
                {comp.details === 'open' ? (
                    <>
                        {[0, 1, 2, 3].map(i => {
                            const colW = px(inner) / (law.cards ? 1 : 4);
                            const x = px(railW + MARGIN) + px(10) + (law.cards ? 0 : i * colW);
                            const y = barH + px(MARGIN) + px(46) + (law.cards ? i * px(46) : 0);
                            if (law.cards && i > 2) return null;
                            return (
                                <React.Fragment key={i}>
                                    <i style={{ ...line(colW * 0.35, .35, px(4)), left: x, top: y }} />
                                    <i style={{
                                        left: x, top: y + px(10), width: colW - px(16), height: px(24),
                                        borderRadius: 3, background: i === 0 ? 'var(--vq-accent-quiet)' : 'var(--vq-sunken)',
                                        border: i === 0 ? '1px solid var(--vq-accent-quiet-line)' : '1px solid var(--vq-line)',
                                    }} />
                                </React.Fragment>
                            );
                        })}
                        <i style={{ ...line(px(120), .3, px(4)), left: px(railW + MARGIN + 10), top: barH + px(MARGIN) + px(16) }} />
                    </>
                ) : (
                    <>
                        <i style={{ ...line(px(110), .7), left: px(railW + MARGIN + 12), top: barH + px(MARGIN) + detH / 2 - px(3) }} />
                        <i style={{ ...line(px(64), .9, px(8)), right: px(MARGIN + 10), top: barH + px(MARGIN) + detH / 2 - px(4), background: 'var(--vq-accent)' }} />
                    </>
                )}

                {/* the items */}
                <i style={{
                    left: px(railW + MARGIN), width: linesW, top, height: linesH,
                    background: 'var(--vq-surface)', border: '1px solid var(--vq-line)', borderRadius: 4,
                }} />
                <i style={{ left: px(railW + MARGIN) + 1, width: linesW - 2, top: top + 1, height: headH, background: 'var(--vq-surface-2)', borderRadius: '3px 3px 0 0' }} />
                <i style={{ ...line(px(52), .5, px(4)), left: px(railW + MARGIN + 14), top: top + headH / 2 - px(2) }} />

                {Array.from({ length: rows }).map((_, r) => {
                    const y = top + headH + r * rowH + rowH / 2 - px(8);
                    const x0 = px(railW + MARGIN + 14);
                    const usable = linesW - px(28);
                    if (law.cards) {
                        return (
                            <React.Fragment key={r}>
                                <i style={{ ...line(usable * 0.5, .8, px(7)), left: x0, top: y }} />
                                <i style={{ ...line(usable * 0.22, .9, px(7)), right: px(MARGIN + 14), top: y, background: 'var(--vq-accent)' }} />
                                <i style={{ ...line(usable * 0.34, .3, px(5)), left: x0, top: y + px(13) }} />
                            </React.Fragment>
                        );
                    }
                    const nameW = usable * (cols >= 6 ? 0.3 : cols >= 4 ? 0.4 : 0.5);
                    const cellW = (usable - nameW - px(8)) / (cols + 1);
                    return (
                        <React.Fragment key={r}>
                            <i style={{
                                left: x0, top: y, width: nameW, height: px(16),
                                borderRadius: 3, background: 'var(--vq-sunken)',
                            }} />
                            {Array.from({ length: cols + 1 }).map((__, c) => (
                                <i
                                    key={c}
                                    style={{
                                        left: x0 + nameW + px(8) + c * cellW, top: y,
                                        width: Math.max(px(10), cellW - px(5)), height: px(16), borderRadius: 3,
                                        background: c === cols ? 'var(--vq-accent-quiet)' : 'var(--vq-sunken)',
                                    }}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
                <i style={{ ...line(px(70), .6, px(6)), left: px(railW + MARGIN) + linesW / 2 - px(35), top: top + linesH - px(26), background: 'var(--vq-accent)' }} />

                {/* the totals */}
                {law.summary === 'side' && (
                    <>
                        <i style={{
                            left: px(railW + MARGIN) + linesW + px(16), width: sumW, top,
                            height: Math.min(linesH, px(60) + sumRows * px(40) + px(150)),
                            background: 'var(--vq-surface)', border: '1px solid var(--vq-line)', borderRadius: 4,
                        }} />
                        {Array.from({ length: sumRows }).map((_, i) => (
                            <React.Fragment key={i}>
                                <i style={{ ...line(sumW * 0.4, .3, px(5)), left: px(railW + MARGIN) + linesW + px(28), top: top + px(56) + i * px(40) }} />
                                <i style={{ ...line(sumW * 0.24, .55, px(5)), right: px(MARGIN + 12), top: top + px(56) + i * px(40) }} />
                            </React.Fragment>
                        ))}
                        <i style={{
                            left: px(railW + MARGIN) + linesW + px(28), right: px(MARGIN + 12),
                            top: top + px(56) + sumRows * px(40) + px(8), height: px(58),
                            background: 'var(--vq-accent-quiet)', border: '1px solid var(--vq-accent-quiet-line)', borderRadius: 4,
                        }} />
                        <i style={{
                            left: px(railW + MARGIN) + linesW + px(28), right: px(MARGIN + 12),
                            top: top + px(56) + sumRows * px(40) + px(78), height: px(46),
                            background: 'var(--vq-accent)', borderRadius: 4,
                        }} />
                    </>
                )}

                {law.summary === 'below' && (
                    <>
                        <i style={{
                            left: px(railW + MARGIN), width: px(inner), top: top + linesH + px(16),
                            height: bodyH - linesH - px(16),
                            background: 'var(--vq-surface)', border: '1px solid var(--vq-line)', borderRadius: 4,
                        }} />
                        <i style={{
                            right: px(MARGIN + 12), top: top + linesH + px(34), width: px(inner) * 0.34, height: px(52),
                            background: 'var(--vq-accent-quiet)', border: '1px solid var(--vq-accent-quiet-line)', borderRadius: 4,
                        }} />
                        <i style={{ left: px(railW + MARGIN + 12), top: top + linesH + px(38), width: px(inner) * 0.3, height: px(44), background: 'var(--vq-accent)', borderRadius: 4 }} />
                    </>
                )}

                {/* the dock */}
                {dockShown && (
                    <>
                        <i style={{
                            right: px(MARGIN), bottom: px(MARGIN),
                            width: Math.min(px(360), px(inner)), height: px(68),
                            background: 'var(--vq-ink-950)', borderRadius: 5,
                        }} />
                        <i style={{ ...line(px(84), 1, px(9)), right: px(MARGIN + 150), bottom: px(MARGIN + 30), background: 'var(--vq-teal-300)' }} />
                        <i style={{ right: px(MARGIN + 12), bottom: px(MARGIN + 12), width: px(120), height: px(44), background: 'var(--vq-accent)', borderRadius: 4 }} />
                    </>
                )}
            </div>
        </div>
    );
}

export default function DocumentSettings({
    /* Which document this belongs to. Without it the Fields section listed
       the sales invoice's fields on every screen, so a stock audit would have
       offered a switch for "Payment terms". */
    doc,
    onClose,
    comp, setComp, applyLayout,
    showRail, setShowRail,
    textSize, setTextSize,
    showQuickEntry, setShowQuickEntry,
    showStock, setShowStock,
    showMargin, setShowMargin,
    canSeeMargin,
    applyDefaults, setApplyDefaults,
    fields, setField,
    showDeliveryCharges, setShowDeliveryCharges,
    showExtraField, setShowExtraField,
    enableMultipleExtras, setEnableMultipleExtras,
    defaultDelivery, setDefaultDelivery,
    defaultExtraLabel, setDefaultExtraLabel,
    defaultExtraValue, setDefaultExtraValue,
    currency, onReset,
}) {
    /* Not every document has every one of these. A switch whose setter was not
       passed used to throw the moment it was clicked, so an absent one is a
       no-op and the section that owns it is simply not offered. */
    /* A switch whose setter was never passed used to throw the moment it was
       clicked. It is inert now — but inert is still a lie to the operator, so
       in development it says so out loud rather than being discovered on the
       thirteenth screen. */
    const noop = (name) => () => {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[DocumentSettings] "${name}" is on screen but the page passed no setter for it, so it does nothing.`);
        }
    };
    setShowRail = setShowRail || noop('setShowRail');
    setShowQuickEntry = setShowQuickEntry || noop('setShowQuickEntry');
    setShowDeliveryCharges = setShowDeliveryCharges || noop('setShowDeliveryCharges');
    setShowExtraField = setShowExtraField || noop('setShowExtraField');
    setEnableMultipleExtras = setEnableMultipleExtras || noop('setEnableMultipleExtras');
    setDefaultDelivery = setDefaultDelivery || noop('setDefaultDelivery');
    setDefaultExtraLabel = setDefaultExtraLabel || noop('setDefaultExtraLabel');
    setDefaultExtraValue = setDefaultExtraValue || noop('setDefaultExtraValue');
    setApplyDefaults = setApplyDefaults || noop('setApplyDefaults');
    setShowMargin = setShowMargin || noop('setShowMargin');
    setShowStock = setShowStock || noop('setShowStock');
    onReset = onReset || noop('onReset');
    const [section, setSection] = useState('layout');
    /* Only the fields this document actually carries, in the document's own
       order, described once in FIELD_LIBRARY. */
    /* Charges belong to documents that HAVE charges; a stock audit offering a
       delivery-charge switch is a switch for a row that cannot exist. */
    const sections = useMemo(
        () => SECTIONS.filter((x) => {
            if (x.id === 'charges') return doc ? doc.money?.charges !== false : true;
            if (x.id === 'fields') return !doc || (doc.fields || []).length > 0;
            return true;
        }),
        [doc],
    );

    const fieldRows = useMemo(
        () => (doc?.fields || [])
            .filter((k) => FIELD_LIBRARY[k])
            .map((k) => [k, FIELD_LIBRARY[k].label, FIELD_LIBRARY[k].hint]),
        [doc],
    );
    const [deviceId, setDeviceId] = useState('laptop');
    const device = PREVIEW_DEVICES.find(d => d.id === deviceId) || PREVIEW_DEVICES[2];
    const chosen = useMemo(() => matchLayout(comp), [comp]);

    return (
        <div className="vqdoc vqdoc-scrim" style={{ height: 'auto', display: 'flex' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="vqdoc-modal wide" role="dialog" aria-modal="true" aria-label="Document settings" style={{ height: 'min(880px, 92vh)' }}>
                <header>
                    <span className="ico"><LayoutGrid size={18} /></span>
                    <span className="t">
                        <h3>Screen settings</h3>
                        <p>{chosen ? LAYOUTS.find(l => l.id === chosen).name : 'Custom'} · saved on this device</p>
                    </span>
                    <button type="button" className="vqdoc-icon quiet" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </header>

                <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                    <nav style={{
                        flex: '0 0 auto', width: 168, borderRight: '1px solid var(--vq-line)',
                        background: 'var(--vq-surface)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                        {sections.map(({ id, name, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                className="vqdoc-btn quiet"
                                aria-pressed={section === id}
                                style={{
                                    justifyContent: 'flex-start',
                                    background: section === id ? 'var(--vq-accent-quiet)' : 'transparent',
                                    color: section === id ? 'var(--vq-accent-text)' : 'var(--vq-text-2)',
                                    fontWeight: section === id ? 'var(--vq-fw-bold)' : 'var(--vq-fw-semi)',
                                }}
                                onClick={() => setSection(id)}
                            >
                                <Icon size={16} /> {name}
                            </button>
                        ))}
                    </nav>

                    <div style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>

                        {section === 'layout' && (
                            <>
                                <div className="vqdoc-group">
                                    <h4>Arrangement</h4>
                                    <p>Pick where the customer block, the items and the totals sit. You can fine-tune any of it below.</p>
                                    <div className="vqdoc-layouts">
                                        {LAYOUTS.map(l => (
                                            <button
                                                key={l.id}
                                                type="button"
                                                className="vqdoc-layout"
                                                aria-pressed={chosen === l.id}
                                                onClick={() => applyLayout(l.id)}
                                            >
                                                <LayoutArt art={l.art} />
                                                <span className="nm">{l.name}{chosen === l.id && <Check size={13} />}</span>
                                                <span className="ds">{l.blurb}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="vqdoc-group">
                                    <h4>Fine tuning</h4>
                                    <Opt title="Customer &amp; details" hint="Folded away leaves one line — name, number, date and running total — and gives the height to the items.">
                                        <Seg value={comp.details} options={CHOICES.details} onChange={(v) => setComp({ details: v })} />
                                    </Opt>
                                    <Opt stack title="Totals" hint="Automatic keeps them beside the items while there is room, and moves them underneath when there is not.">
                                        <Seg fill value={comp.summary} options={CHOICES.summary} onChange={(v) => setComp({ summary: v })} />
                                    </Opt>
                                    <Opt stack title="While you scroll" hint="Automatic keeps the totals in view when they fit, and follows you down in the bar when they do not.">
                                        <Seg fill value={comp.pin} options={CHOICES.pin} onChange={(v) => setComp({ pin: v })} />
                                    </Opt>
                                    <Opt title="Navigation rail" hint="An invoice is a document you write, not a place you navigate from. Alt+L brings it back.">
                                        <Switch checked={showRail} onChange={setShowRail} label="Navigation rail" />
                                    </Opt>
                                </div>
                            </>
                        )}

                        {section === 'items' && (
                            <>
                                <div className="vqdoc-group">
                                    <h4>Detail on each row</h4>
                                    <p>How much of each line you want to see while you type. Nothing is ever lost — anything a simpler row leaves out is still on the document and one click away.</p>
                                    {['simple', 'standard', 'detailed'].map(id => {
                                        const L = LEVELS[id];
                                        const on = comp.level === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                className="vqdoc-opt"
                                                aria-pressed={on}
                                                style={{
                                                    textAlign: 'left', cursor: 'pointer', width: '100%',
                                                    borderColor: on ? 'var(--vq-accent)' : undefined,
                                                    background: on ? 'var(--vq-accent-quiet)' : undefined,
                                                    boxShadow: on ? '0 0 0 1px var(--vq-accent)' : undefined,
                                                }}
                                                onClick={() => setComp({ level: id })}
                                            >
                                                <span className="t">
                                                    <b>{L.name}{on && <Check size={13} style={{ marginLeft: 6, verticalAlign: '-2px' }} />}</b>
                                                    <span>{L.blurb} {L.who}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="vqdoc-group">
                                    <h4>On the table</h4>
                                    <Opt title="Quick add row" hint="A single row at the top for adding item after item without leaving the keyboard. Alt+Q.">
                                        <Switch checked={showQuickEntry} onChange={setShowQuickEntry} label="Quick add row" />
                                    </Opt>
                                    <Opt title="Stock in hand" hint="Shows what is available under the quantity as you type it.">
                                        <Switch checked={showStock} onChange={setShowStock} label="Stock in hand" />
                                    </Opt>
                                </div>

                                {canSeeMargin && (
                                    <div className="vqdoc-group">
                                        <h4>Margin</h4>
                                        <p>What the sale is making. Only people with permission to see cost prices ever see any of this.</p>
                                        <Opt
                                            title="Margin button"
                                            hint="Puts the hold-to-see button in the bar. The figures appear only while it is held, and the per-item breakdown opens if you drag it downwards — never left sitting on the screen."
                                        >
                                            <Switch checked={showMargin} onChange={setShowMargin} label="Margin button" />
                                        </Opt>
                                    </div>
                                )}
                            </>
                        )}


                        {section === 'fields' && (
                            <>
                                <div className="vqdoc-group">
                                    <h4>What an invoice carries</h4>
                                    <p>Turn off what your shop never uses and it stops taking room on every sale — on the screen and on the printed invoice. A cash counter rarely needs terms or a due date; a wholesaler needs both.</p>
                                    {fieldRows.map(([key, title, hint]) => (
                                        <Opt key={key} title={title} hint={hint}>
                                            <Switch
                                                checked={fields[key] !== false}
                                                onChange={(v) => setField(key, v)}
                                                label={title}
                                            />
                                        </Opt>
                                    ))}
                                </div>

                                <div className="vqdoc-group">
                                    <h4>Always there</h4>
                                    <p>The customer, the items and the money are the invoice. They have no switch, because a sale without them is not a sale.</p>
                                </div>
                            </>
                        )}

                        {section === 'charges' && (
                            <>
                                <div className="vqdoc-group">
                                    <h4>Charges on the total</h4>
                                    <Opt title="Delivery" hint="A delivery line in the totals.">
                                        <Switch checked={showDeliveryCharges} onChange={setShowDeliveryCharges} label="Delivery" />
                                    </Opt>
                                    <Opt title="Extra charge" hint="One named charge — packing, service, anything. The name is editable on the invoice.">
                                        <Switch checked={showExtraField} onChange={setShowExtraField} label="Extra charge" />
                                    </Opt>
                                    <Opt title="Several extra charges" hint="Up to ten named charges instead of one.">
                                        <Switch checked={enableMultipleExtras} onChange={setEnableMultipleExtras} label="Several extra charges" />
                                    </Opt>
                                </div>

                                <div className="vqdoc-group">
                                    <h4>Standing charges</h4>
                                    <Opt
                                        title="Put these on every new invoice"
                                        hint="A delivery fee or a service charge you always add, filled in the moment a sale starts. It never touches an invoice you have already begun pricing."
                                    >
                                        <Switch checked={applyDefaults} onChange={setApplyDefaults} label="Put these on every new invoice" />
                                    </Opt>
                                    <p style={{ marginTop: 'var(--d-s2)' }}>
                                        {applyDefaults
                                            ? 'Every new sale starts with the amounts below.'
                                            : 'Saved, but only used when you switch this on.'}
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                                            <span className="vqdoc-lbl">Delivery ({currency})</span>
                                            <input type="number" className="vqdoc-in n" value={defaultDelivery} onChange={(e) => setDefaultDelivery(parseFloat(e.target.value) || 0)} />
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                                            <span className="vqdoc-lbl">Charge name</span>
                                            <input type="text" className="vqdoc-in" value={defaultExtraLabel} placeholder="Service" onChange={(e) => setDefaultExtraLabel(e.target.value)} />
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                                            <span className="vqdoc-lbl">Amount ({currency})</span>
                                            <input type="number" className="vqdoc-in n" value={defaultExtraValue} onChange={(e) => setDefaultExtraValue(parseFloat(e.target.value) || 0)} />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {section === 'display' && (
                            <>
                                <div className="vqdoc-group">
                                    <h4>Text size</h4>
                                    <p>Everything on the screen grows together — the type, the buttons and the rows — and the layout re-composes around the larger controls instead of clipping them.</p>
                                    <Seg
                                        value={String(textSize)}
                                        fill
                                        options={[['1', 'Normal'], ['2', 'Large'], ['3', 'Larger'], ['4', 'Senior'], ['5', 'Maximum']]}
                                        onChange={(v) => setTextSize(Number(v))}
                                    />
                                </div>

                                <div className="vqdoc-group">
                                    <h4>Shortcuts</h4>
                                    <div className="vqdoc-opt" style={{ display: 'block' }}>
                                        {[
                                            ['Alt + L', 'Show or hide the navigation rail'],
                                            ['Alt + D', 'Fold the customer block away'],
                                            ['Alt + Q', 'Jump to the quick add row'],
                                            ['Esc', 'Close whatever is on top'],
                                        ].map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0', fontSize: 'var(--d-t-2xs)' }}>
                                                <span style={{
                                                    fontFamily: 'var(--vq-font-numeric)', fontWeight: 700, fontSize: 'var(--d-t-micro)',
                                                    border: '1px solid var(--vq-line)', borderRadius: 6, padding: '3px 7px',
                                                    background: 'var(--vq-sunken)', whiteSpace: 'nowrap',
                                                }}>{k}</span>
                                                <span style={{ color: 'var(--vq-text-2)' }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="vqdoc-group">
                                    <h4>Start over</h4>
                                    <p>Puts the layout, the text size and the rail back the way they came. Your store settings, products and sales are not touched.</p>
                                    <button type="button" className="vqdoc-btn danger" style={{ alignSelf: 'flex-start' }} onClick={onReset}>
                                        <RotateCcw size={15} /> Reset this screen
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <aside style={{
                        flex: '0 0 auto', width: 348, borderLeft: '1px solid var(--vq-line)',
                        background: 'var(--vq-surface)', padding: 20, minHeight: 0, overflowY: 'auto',
                        display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
                    }}>
                        <Seg
                            value={deviceId}
                            options={PREVIEW_DEVICES.map(d => [d.id, d.name])}
                            onChange={setDeviceId}
                            size="sm"
                        />
                        <Preview device={device} comp={comp} showRail={showRail} />
                        <p style={{
                            margin: 0, fontSize: 'var(--d-t-2xs)', color: 'var(--vq-text-3)',
                            textAlign: 'center', lineHeight: 1.6, maxWidth: 280,
                        }}>
                            A live preview of this screen at {device.name.toLowerCase()} size.
                        </p>
                    </aside>
                </div>

                <footer>
                    <span style={{ fontSize: 'var(--d-t-2xs)', color: 'var(--vq-text-3)', marginRight: 'auto' }}>
                        Changes save as you make them.
                    </span>
                    <button type="button" className="vqdoc-btn pri" onClick={onClose}>Done</button>
                </footer>
            </div>
        </div>
    );
}
