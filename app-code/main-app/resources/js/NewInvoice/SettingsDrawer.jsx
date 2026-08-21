/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewInvoice — the settings drawer                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *   ARRANGE   geometry. Auto, the profile, the six starting points, and the five
 *             knobs behind them. Nothing here can produce an illegal layout: the
 *             numbers are wishes, the measured floors are the law, and the worst
 *             a bad setting does is get overruled — visibly, in the read-out.
 *
 *   OPERATE   what the editor DOES. Tax, terms, rounding, defaults, permissions.
 *
 * DENSITY IS THE ONE THING THE WIDTH MAY VETO. It may never veto a capability:
 * a field this type collects is collected at every size, and the density only
 * decides how many of them are on the surface at once. When the veto fires the
 * segmented control says so rather than silently snapping back.
 */

import React from 'react';
import { Sheet, Slider, Switch } from '@/LayoutLaw/ui';
import { docPresets, docDensities, docTableWidth } from '@/LayoutLaw/engine';
import { PROFILES, screenBand } from './settings';
import { columnsFor } from './fields';
import { ACCOUNTS, LOCATIONS, TAX_RATES, TERMS } from './mock';

const PCT = (v) => `${Math.round(v * 100)}%`;

const BAND_LABEL = {
    phone: 'a phone',
    tablet: 'a tablet',
    short: 'a wide, short screen',
    desk: 'a desktop',
};

function Seg({ label, value, options, onPick, note, disabledFor, hintFor }) {
    return (
        <div className="nqd-ctlbox">
            {label ? <div className="lbl"><span>{label}</span></div> : null}
            <div className="nqd-seg" role="group" aria-label={label}>
                {options.map(([v, t]) => (
                    <button
                        key={v}
                        type="button"
                        aria-pressed={v === value}
                        disabled={disabledFor ? disabledFor(v) : false}
                        title={hintFor ? hintFor(v) : undefined}
                        onClick={() => onPick(v)}
                    >
                        {t}
                    </button>
                ))}
            </div>
            {note ? <div className="note">{note}</div> : null}
        </div>
    );
}

export default function SettingsDrawer({
    open, onClose, prefs, D, vp, type,
    setComp, setPreset, setProfile, setAuto, setOps, setPerm, setRail, setType,
    rankMode, setRankMode, tab, setTab, onReset,
}) {
    const c = prefs.comp;
    const band = screenBand(vp.w, vp.h);
    const geo = (fn) => (...args) => { setAuto(false); fn(...args); };
    const set = geo((patch) => setComp({ ...c, ...patch }));
    const pickPreset = geo((id) => setPreset(id));

    const densities = docDensities();
    const order = densities.map((d) => d.id);
    // The type of the document IN FRONT OF YOU, handed in by the page. Reading
    // `prefs.type` here described whatever type a NEW tab would open as, which
    // is not necessarily this one.
    const wanted = type;
    // A composition read back from localStorage can name a density this build of
    // the law no longer has. Fall back rather than throw: the settings drawer is
    // the one screen that has to survive a bad preference, because it is where
    // the bad preference gets fixed.
    const current = densities.find((d) => d.id === c.density) || densities[0];
    const shownCols = columnsFor(wanted, D.columns);
    const dropped = D.columns.filter((k) => !shownCols.includes(k));

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Editor settings"
            size="wide"
            ns="nqd"
            labelExtra={(
                <span className="nqd-seg" style={{ marginLeft: 12 }}>
                    <button type="button" aria-pressed={tab === 'arrange'} onClick={() => setTab('arrange')}>Arrange</button>
                    <button type="button" aria-pressed={tab === 'operate'} onClick={() => setTab('operate')}>Operate</button>
                </span>
            )}
            footer={(
                <div className="nqd-actions">
                    <button type="button" className="nqd-btn" onClick={onReset}>Reset to defaults</button>
                    <button type="button" className="nqd-btn" data-pri="true" onClick={onClose}>Done</button>
                </div>
            )}
        >
            {tab === 'arrange' ? (
                <div className="nqd-set">
                    <div className="nqd-auto">
                        <Switch
                            ns="nqd"
                            label={prefs.auto ? 'Auto — arranged for this screen' : 'Manual — you are arranging this yourself'}
                            note={prefs.auto
                                ? `This is ${BAND_LABEL[band]}, so Auto is running the ${prefs.preset} arrangement. Change the window, or the document type, and it re-picks.`
                                : 'Auto stopped when you moved a knob. Turn it back on and this screen goes back to what your profile asks for.'}
                            value={prefs.auto}
                            onChange={setAuto}
                        />
                        {prefs.auto ? (
                            <div className="nqd-ctlbox">
                                <div className="lbl"><span>How do you work?</span></div>
                                <div className="nqd-presets">
                                    {PROFILES.map((p) => (
                                        <button key={p.id} type="button" className="nqd-preset" aria-pressed={prefs.profile === p.id} onClick={() => setProfile(p.id)}>
                                            <b>{p.name}</b>
                                            <span>{p.note}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="note">
                                    Auto decides geometry only. The DENSITY still comes from the document —
                                    a purchase bill asks for Pro and an expense for Simple — because a
                                    screen size should not decide what a document is.
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="nqd-setgroup">
                        <h3>Document type</h3>
                        <button type="button" className="nqd-preset" onClick={() => setType('__open__')}>
                            <b>{type.name}</b>
                            <span>{type.prefix} · {type.side} side · wants {type.density}. One editor, thirteen configurations — tap to switch.</span>
                        </button>
                    </div>

                    <div className="nqd-setgroup">
                        <h3>Start from</h3>
                        <div className="nqd-presets">
                            {docPresets().map((p) => (
                                <button key={p.id} type="button" className="nqd-preset" aria-pressed={prefs.preset === p.id} title={p.for} onClick={() => pickPreset(p.id)}>
                                    <b>{p.name}</b>
                                    <span>{p.for}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="nqd-setgroup">
                        <h3>Arrangement</h3>
                        <Seg
                            label="Customer &amp; details"
                            value={c.details}
                            options={[['open', 'Open'], ['collapsed', 'Collapsed']]}
                            onPick={(v) => set({ details: v })}
                            note={D.details.mode === 'collapsed' && c.details === 'open'
                                ? 'This screen is too short to hold the block open, so the law is holding it collapsed. Tapping the strip opens it as a sheet — every field is in it.'
                                : `Collapsed is one line — party, number, date, running total. Here it is worth ${Math.max(0, Math.round((D.details.mode === 'open' ? D.details.h - 60 : 0) / 49))} more item rows.`}
                        />
                        <Seg
                            label="Summary"
                            value={c.summary}
                            options={[['auto', 'Auto'], ['right', 'Right'], ['below', 'Below'], ['off', 'Off']]}
                            onPick={(v) => set({ summary: v })}
                            note="Auto keeps the column while it costs the line table nothing, and drops it below when it would."
                        />
                        <Seg
                            label="While you scroll"
                            value={c.pin}
                            options={[['auto', 'Auto'], ['sticky', 'Hold it'], ['dock', 'Dock'], ['none', 'Let it scroll']]}
                            onPick={(v) => set({ pin: v })}
                            note={D.summary.canStick
                                ? `The column is ${D.summary.h}px and this screen has room, so it can be held in place.`
                                : `The column is ${D.summary.h}px and only ${Math.round(D.usable - (D.summary.mode === 'right' ? D.details.h : 0))}px are on screen — a sticky panel taller than its viewport still scrolls, it just scrolls late. So it docks.`}
                        />
                        <Slider
                            ns="nqd"
                            label="Summary width"
                            value={c.split}
                            lo={0.12}
                            hi={0.55}
                            step={0.01}
                            fmt={PCT}
                            disabled={D.summary.mode !== 'right'}
                            onSet={(v) => set({ split: v })}
                            note={D.summary.mode === 'right'
                                ? 'Clamped by the measured floors of both the summary and the line table.'
                                : 'Only applies while the summary is a right-hand column.'}
                        />
                        <Seg
                            label="Density"
                            value={c.density}
                            options={densities.map((d) => [d.id, d.name])}
                            onPick={(v) => set({ density: v })}
                            hintFor={(v) => {
                                const d = densities.find((x) => x.id === v);
                                if (!d) return '';
                                return `${d.line_cols.length} line columns · ${d.header.length} header fields · ${d.summary.length} summary rows · needs ${docTableWidth(d.line_cols)}px`;
                            }}
                            /* `.find()` on a saved density id: a preference read
                               back from a previous version of the law returns
                               undefined here, and reading `.line_cols` off it
                               threw inside the SETTINGS drawer — the one place
                               someone goes to fix a bad preference. */
                            note={D.capped
                                ? `You asked for ${D.wantedDensity}; this width supports ${D.density}. The width can veto a density — it can never veto a capability.`
                                : `${wanted.name} wants ${wanted.density}. A ${current.line_cols.length}-column table needs ${docTableWidth(current.line_cols)}px and the lines have ${Math.round(D.lines.px)}px.`}
                        />
                    </div>

                    <div className="nqd-setgroup">
                        <h3>This screen</h3>
                        <Switch ns="nqd" label="Icon rail" note="The hamburger stays at every width either way." value={prefs.rail} onChange={setRail} />
                        <Slider ns="nqd" label="Interface scale" value={prefs.ops.uiScale} lo={0.85} hi={1.35} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onSet={(v) => setOps({ uiScale: v })} />
                        <Switch ns="nqd" label="Large text mode" value={prefs.ops.senior} onChange={(v) => setOps({ senior: v })} />
                        <Switch ns="nqd" label="Show control ranks" note="Teal = act, blue = adjust, grey = configure." value={rankMode} onChange={setRankMode} />
                    </div>

                    <div className="nqd-setgroup">
                        <h3>What the law did with that</h3>
                        <div className="nqd-readout">
                            <b>{type.name}</b> at <b>{vp.w}×{vp.h}</b> · nav <b>{D.nav}</b>
                            {D.navHeld ? ' (held)' : ''} · content <b>{Math.round(D.avail)}px</b>
                            {' '}· usable height <b>{Math.round(D.usable)}px</b>
                            <br />
                            details <b>{D.details.mode}{D.details.mode === 'open' ? ` · ${D.details.twoCol ? '2 columns' : '1 column'}` : ''}</b>
                            <br />
                            items <b>{D.lines.fit}</b> @ <b>{Math.round(D.lines.px)}px</b> · <b>{D.lines.rowsVisible} lines</b> visible without scrolling
                            <br />
                            summary <b>{D.summary.mode}{D.summary.mode === 'right' ? ` ${Math.round(D.summary.px)}px · ${D.summary.fit}` : ''}</b>
                            {' '}· while you scroll <b>{D.summary.pin}</b> (the column is {D.summary.h}px and {D.summary.canStick ? 'fits' : 'does not fit'})
                            {D.dock.length ? <> · dock <b>{D.dockH}px</b> reserved</> : null}
                            <br />
                            density <b>{D.density}</b>{D.capped ? ` (you asked for ${D.wantedDensity})` : ''}
                            <br />
                            {/* The EFFECTIVE columns, not the density's wish list.
                                Printing the law's list here claimed a Tax %
                                column on a quotation, which switches per-line
                                tax off — a read-out that describes a different
                                screen from the one behind it is worse than no
                                read-out. */}
                            columns <b>{shownCols.join(' · ')}</b>
                            {dropped.length ? <> · <span title={`${type.name} switches these off. A width may veto a density; a TYPE vetoes a capability.`}>dropped by this type: <b>{dropped.join(' · ')}</b></span></> : null}
                        </div>
                        {D.demoted ? <div className="nqd-note"><b>Why it looks like this here:</b> {D.demoted}.</div> : null}
                        {D.navHeld ? (
                            <div className="nqd-note">
                                the nav is <b>holding the rail</b>: expanding it would cost this composition a
                                line column, and buying a bigger screen should never make the invoice worse
                            </div>
                        ) : null}
                    </div>

                    <div className="nqd-setgroup">
                        <h3>{type.name} — capabilities</h3>
                        <div>
                            {type.on.map((k) => <span className="nqd-cap" key={k}>{k}</span>)}
                            {type.off.map((k) => <span className="nqd-cap" data-off="true" key={k}>{k}</span>)}
                        </div>
                        <div className="note">
                            Switched on, and the ones explicitly switched off. A capability is on or off,
                            never half — free quantity reached the database from 2 of 7 sell-side types and
                            inflated the on-screen subtotal on the other five.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="nqd-set">
                    <div className="nqd-setgroup">
                        <h3>Tax</h3>
                        <Seg
                            label="Default rate"
                            value={prefs.ops.defaultTax}
                            options={TAX_RATES.map((t) => [t.id, t.label])}
                            onPick={(v) => setOps({ defaultTax: Number(v) })}
                            note="Only the sales invoice read settings.tax_rates. Every other screen made the user type a raw percentage."
                        />
                        <Switch ns="nqd" label="Prices include tax by default" value={prefs.ops.taxInclusive} onChange={(v) => setOps({ taxInclusive: v })} />
                    </div>

                    <div className="nqd-setgroup">
                        <h3>Money</h3>
                        <Switch ns="nqd" label="Round off the total" note="A document property, applied once — not something only two of thirteen types do." value={prefs.ops.roundOff} onChange={(v) => setOps({ roundOff: v })} />
                        <Switch ns="nqd" label="Show margin" note="In the Items header and the breakdown, on the sell side, for roles that may see a cost price. Free quantity counts as cost." value={prefs.ops.showMargin} onChange={(v) => setOps({ showMargin: v })} />
                        <Switch ns="nqd" label="Confirm a zero-cost line" note="A purchase line with no cost is almost always a mistake." value={prefs.ops.confirmZeroCost} onChange={(v) => setOps({ confirmZeroCost: v })} />
                    </div>

                    <div className="nqd-setgroup">
                        <h3>Defaults for a new document</h3>
                        <Seg label="Payment terms" value={prefs.ops.defaultTerms} options={TERMS.map((t) => [t.id, t.label])} onPick={(v) => setOps({ defaultTerms: v })} note="Terms writes the due date — one control, not two. The date stays editable." />
                        <Seg label="Location" value={prefs.ops.defaultLocation} options={LOCATIONS.map((l) => [l.id, l.name])} onPick={(v) => setOps({ defaultLocation: Number(v) })} />
                        <Seg label="Money account" value={prefs.ops.defaultAccount} options={ACCOUNTS.map((a) => [a.id, a.name.split(' · ')[0]])} onPick={(v) => setOps({ defaultAccount: Number(v) })} />
                        <Switch ns="nqd" label="Number documents automatically" value={prefs.ops.autoNumber} onChange={(v) => setOps({ autoNumber: v })} />
                        <Switch ns="nqd" label="Require a location" note="Purchase order requires warehouse_id server-side and rendered no input; it silently fell back to warehouses[0]." value={prefs.ops.requireLocation} onChange={(v) => setOps({ requireLocation: v })} />
                        <Switch ns="nqd" label="Print on save" value={prefs.ops.printOnSave} onChange={(v) => setOps({ printOnSave: v })} />
                    </div>

                    <div className="nqd-setgroup">
                        <h3>This user may</h3>
                        <div className="note" style={{ marginTop: -4 }}>
                            Simulated here so the controls can be seen doing what the permission says.
                        </div>
                        <Switch ns="nqd" label="Post a document" value={prefs.perms['documents.post']} onChange={(v) => setPerm('documents.post', v)} />
                        <Switch ns="nqd" label="Override a price" value={prefs.perms['documents.price_override']} onChange={(v) => setPerm('documents.price_override', v)} />
                        <Switch ns="nqd" label="Give a discount" value={prefs.perms['documents.discount']} onChange={(v) => setPerm('documents.discount', v)} />
                        <Switch ns="nqd" label="Delete a line" value={prefs.perms['documents.delete_line']} onChange={(v) => setPerm('documents.delete_line', v)} />
                    </div>
                </div>
            )}
        </Sheet>
    );
}
