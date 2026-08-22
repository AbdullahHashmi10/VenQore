/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the settings drawer (Safe & Live Connected)                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { composeTerminal, presetComposition, presets } from '@/LayoutLaw/engine';
import { DEFAULTS, DEFAULT_OPS, DEFAULT_PERMS, PROFILES, RETURN_POLICIES, screenBand } from './settings';
import { Seg, Sheet, Slider, Switch } from '@/LayoutLaw/ui';

const PCT = (v) => `${Math.round(v * 100)}%`;

const BAND_LABEL = {
    phone: 'a phone',
    tablet: 'a tablet',
    short: 'a wide, short screen',
    desk: 'a desktop',
};

export default function SettingsDrawer({
    open,
    onClose,
    prefs = DEFAULTS,
    setPrefs,
    T,
    vp,
    width,
    warehouses = [],
    banks = [],
    taxRates = [],
}) {
    const [tab, setTab] = useState('arrange');
    const effectiveVp = vp || { w: typeof window !== 'undefined' ? window.innerWidth : 1200, h: typeof window !== 'undefined' ? window.innerHeight : 800 };
    const band = screenBand(effectiveVp.w, effectiveVp.h);

    const c = prefs?.comp || presetComposition('column');
    const effectiveT = T || composeTerminal(c, effectiveVp.w, effectiveVp.h, {
        scale: prefs?.ops?.uiScale || 1,
        senior: prefs?.ops?.senior || false,
    });

    const setComp = (comp) => setPrefs?.((p) => ({ ...p, comp }));
    const setPreset = (preset) => setPrefs?.((p) => ({ ...p, preset, comp: presetComposition(preset) }));
    const setProfile = (profile) => setPrefs?.((p) => ({ ...p, profile }));
    const setAuto = (auto) => setPrefs?.((p) => ({ ...p, auto }));
    const setOps = (opsPatch) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, ...opsPatch } }));
    const setPerm = (key, val) => setPrefs?.((p) => ({ ...p, perms: { ...p.perms, [key]: val } }));
    const setRail = (rail) => setPrefs?.((p) => ({ ...p, rail }));
    const setRankMode = (rankMode) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, rankMode } }));
    const onReset = () => setPrefs?.({ ...DEFAULTS, comp: presetComposition('column'), ops: { ...DEFAULT_OPS }, perms: { ...DEFAULT_PERMS } });

    const geo = (fn) => (...args) => { setAuto(false); fn(...args); };

    const setCat = geo((patch) => setComp({ ...c, catalog: { ...(c.catalog || {}), ...patch } }));
    const setSplit = geo((patch) => setComp({ ...c, split: { ...(c.split || {}), ...patch } }));
    const setTender = geo((v) => setComp({ ...c, tender: v }));
    const setFloor = geo((v) => setComp({ ...c, floor: v }));
    const pickPreset = geo((id) => setPreset(id));

    const catTxt = !effectiveT?.catalog ? 'off'
        : effectiveT.catalog.mode === 'overlay' ? `button — ${effectiveT.catalog.reason || ''}`
            : (effectiveT.catalog.mode === 'top' || effectiveT.catalog.mode === 'bottom')
                ? `${effectiveT.catalog.mode} · ${effectiveT.catalog.rows || 1} row${(effectiveT.catalog.rows || 1) > 1 ? 's' : ''} × ${effectiveT.catalog.tiles || 4} tiles`
                : `${effectiveT.catalog.mode} · ${Math.round(effectiveT.catalog.px || 0)}px · ${effectiveT.catalog.fit || ''}`;

    const tenderTxt = (effectiveT?.tender?.mode || 'dock')
        + (effectiveT?.tender?.px ? ` · ${Math.round(effectiveT.tender.px)}px · ${effectiveT.tender.fit || ''}`
            : effectiveT?.tender?.reason ? ` — ${effectiveT.tender.reason}` : '');

    const effectiveWarehouses = warehouses.length ? warehouses : [{ id: 1, name: 'Main store' }];
    const effectiveBanks = banks.length ? banks : [{ id: 1, name: 'Main bank' }];
    const effectiveTaxRates = taxRates.length ? taxRates : [
        { id: 0, label: 'No tax (0%)', rate: 0 },
        { id: 1, label: 'GST (18%)', rate: 18 },
        { id: 2, label: 'GST (5%)', rate: 5 },
    ];

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Register settings"
            size="wide"
            style={{ width: width ? `${width}px` : undefined }}
            labelExtra={(
                <span className="nqp-seg" style={{ marginLeft: 12 }}>
                    <button type="button" aria-pressed={tab === 'arrange'} onClick={() => setTab('arrange')}>Arrange</button>
                    <button type="button" aria-pressed={tab === 'operate'} onClick={() => setTab('operate')}>Operate</button>
                </span>
            )}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={onReset}>Reset to defaults</button>
                    <button type="button" className="nqp-cta" onClick={onClose}>Done</button>
                </div>
            )}
        >
            {tab === 'arrange' ? (
                <div className="nqp-set">
                    {/* ── AUTO ───────────────────────────────────────────────── */}
                    <div className="nqp-auto">
                        <Switch
                            label={prefs?.auto ? 'Auto — arranged for this screen' : 'Manual — you are arranging this yourself'}
                            note={prefs?.auto
                                ? `This is ${BAND_LABEL[band]}, so Auto is running the ${effectiveT?.regime === 'phone' ? 'one-column' : (effectiveT?.regime || 'columns')} arrangement. Change the window and it re-picks.`
                                : 'Auto stopped when you moved a knob. Turn it back on and this screen goes back to the arrangement your profile asks for.'}
                            value={Boolean(prefs?.auto)}
                            onChange={setAuto}
                        />
                        {prefs?.auto ? (
                            <div className="nqp-ctl">
                                <div className="lbl"><span>What kind of counter is this?</span></div>
                                <div className="nqp-presets">
                                    {PROFILES.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className="nqp-preset"
                                            aria-pressed={prefs?.profile === p.id}
                                            onClick={() => setProfile(p.id)}
                                        >
                                            <b>{p.name}</b>
                                            <span>{p.note}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="note">
                                    Auto never guesses your business — it asks once, here, and then only
                                    decides geometry. Everything below still applies; it is just chosen
                                    for you.
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* ── STARTING POINTS ────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>Start from</h3>
                        <div className="nqp-presets">
                            {presets().map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    className="nqp-preset"
                                    aria-pressed={prefs?.preset === p.id}
                                    title={`${p.for}\n\n${p.why}`}
                                    onClick={() => pickPreset(p.id)}
                                >
                                    <b>{p.name}</b>
                                    <span>{p.tagline}</span>
                                </button>
                            ))}
                        </div>
                        <div className="note">
                            Starting points, not cages. Change anything and you are still inside the law.
                        </div>
                    </div>

                    {/* ── THE COMPOSER ───────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>Catalogue</h3>
                        <Seg
                            label="Where it lives"
                            value={c?.catalog?.mode || 'off'}
                            options={['off', 'left', 'right', 'top', 'bottom', 'overlay']}
                            labels={['Off', 'Left', 'Right', 'Top', 'Bottom', 'Button']}
                            onPick={(v) => setCat({ mode: v, size: (v === 'top' || v === 'bottom') && (c?.catalog?.size || 0) > 0.55 ? 0.4 : (c?.catalog?.size || 0.2) })}
                            note="Off = scanner only. Left/right = a column. Top/bottom = a tile strip. Button = one tap, full screen."
                        />
                        {(c?.catalog?.mode === 'left' || c?.catalog?.mode === 'right') ? (
                            <Slider
                                label="Catalogue width" value={c?.catalog?.size || 0.2} lo={0.12} hi={0.55} step={0.01}
                                fmt={PCT} onSet={(v) => setCat({ size: v })}
                                note="Of the content width. Clamped to the catalogue's floor — below it, it becomes a button rather than an unreadable column."
                            />
                        ) : null}
                        {(c?.catalog?.mode === 'top' || c?.catalog?.mode === 'bottom') ? (
                            <>
                                <Slider
                                    label="Catalogue height" value={c?.catalog?.size || 0} lo={0} hi={0.55} step={0.05}
                                    fmt={(v) => (v ? PCT(v) : 'by rows')} onSet={(v) => setCat({ size: v })}
                                    note="A band is always a whole number of tile rows."
                                />
                                {!c?.catalog?.size ? (
                                    <Seg label="Strip rows" value={c?.catalog?.rows || 1} options={[1, 2, 3]} onPick={(v) => setCat({ rows: v })} />
                                ) : null}
                            </>
                        ) : null}
                        {c?.catalog?.mode !== 'off' ? (
                            <Slider
                                label="Tiles per row" value={c?.catalog?.tiles || 0} lo={0} hi={8} step={1}
                                fmt={(v) => (v ? String(v) : 'auto')} onSet={(v) => setCat({ tiles: v || null })}
                                note="The category density control."
                            />
                        ) : null}
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Cart and payment</h3>
                        <Slider
                            label="Cart share" value={c?.split?.cart || 0.6} lo={0.3} hi={1} step={0.01}
                            fmt={PCT} onSet={(v) => setSplit({ cart: v })}
                            note="Clamped so the cart never drops below its own floor."
                        />
                        <Seg
                            label="Payment panel" value={c?.tender || 'column'}
                            options={['column', 'bar', 'sheet']} labels={['Column', 'Bar', 'Button']}
                            onPick={setTender}
                            note="Column = always visible. Bar = a docked total and Pay. Button = full screen on demand."
                        />
                        {c?.tender === 'column' ? (
                            <Slider
                                label="Payment share" value={c?.split?.tender || 0.3} lo={0} hi={0.45} step={0.01}
                                fmt={PCT} onSet={(v) => setSplit({ tender: v })}
                                note="0 turns the payment panel into a sheet behind Take payment."
                            />
                        ) : null}
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Floor plan</h3>
                        <Seg
                            label="Tables" value={c?.floor || 'off'}
                            options={['off', 'left', 'overlay']} labels={['Off', 'Column', 'Step']}
                            onPick={setFloor}
                            note="Table service only."
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>This screen</h3>
                        <Switch
                            label="Icon rail" note="The nav rail beside the register."
                            value={Boolean(prefs?.rail)} onChange={setRail}
                        />
                        <Slider
                            label="Interface scale" value={prefs?.ops?.uiScale || 1} lo={0.85} hi={1.35} step={0.05}
                            fmt={(v) => `${Math.round(v * 100)}%`} onSet={(v) => setOps({ uiScale: v })}
                        />
                        <Switch
                            label="Large text mode" note="Bigger type and figures."
                            value={Boolean(prefs?.ops?.senior)} onChange={(v) => setOps({ senior: v })}
                        />
                        <Switch
                            label="Show control ranks" note="Outlines every control by rank: teal = act, blue = adjust, grey = configure."
                            value={Boolean(prefs?.ops?.rankMode)} onChange={setRankMode}
                        />
                    </div>

                    {/* ── THE READ-OUT ───────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>Layout Inspector</h3>
                        <div className="nqp-readout">
                            <b>{effectiveVp.w}×{effectiveVp.h}</b> · content <b>{Math.round(effectiveT?.avail || 0)}×{effectiveT?.H || 0}px</b>
                            <br />
                            catalogue <b>{catTxt}</b>
                            <br />
                            cart <b>{Math.round(effectiveT?.cart?.px || 0)}px · {effectiveT?.cart?.fit || ''}</b> ({effectiveT?.cartLines || 0} lines)
                            <br />
                            payment <b>{tenderTxt}</b>
                            <br />
                            dock: <b>{(effectiveT?.dock || []).map((d) => d.label).join(' · ') || 'all controls resident'}</b>
                        </div>
                        {(effectiveT?.notes || []).map((note) => (<div className="nqp-note" key={note}>{note}</div>))}
                    </div>
                </div>
            ) : (
                <div className="nqp-set">
                    {/* ── OPERATE ────────────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>Tax</h3>
                        <Seg
                            label="Default rate" value={prefs?.ops?.defaultTax || 0}
                            options={effectiveTaxRates.map((t) => t.id)} labels={effectiveTaxRates.map((t) => t.label)}
                            onPick={(v) => setOps({ defaultTax: v })}
                        />
                        <Seg
                            label="Prices are" value={prefs?.ops?.taxMode || 'exclusive'}
                            options={['exclusive', 'inclusive']} labels={['Tax on top', 'Tax included']}
                            onPick={(v) => setOps({ taxMode: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Returns</h3>
                        <Seg
                            label="Policy" value={prefs?.ops?.returnPolicy || 'reference'}
                            options={RETURN_POLICIES.map((p) => p.id)}
                            labels={RETURN_POLICIES.map((p) => p.label)}
                            onPick={(v) => setOps({ returnPolicy: v })}
                            note={RETURN_POLICIES.find((p) => p.id === prefs?.ops?.returnPolicy)?.note}
                        />
                        <Slider
                            label="Return window" value={prefs?.ops?.returnWindowDays || 14} lo={0} hi={90} step={1}
                            fmt={(v) => (v ? `${v} days` : 'no limit')} onSet={(v) => setOps({ returnWindowDays: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Money</h3>
                        <Switch label="Round off the total" note="Round to nearest rupee on checkout." value={Boolean(prefs?.ops?.roundOff)} onChange={(v) => setOps({ roundOff: v })} />
                        <Switch label="Auto-fill exact cash" note="Pre-fills tendered amount with total." value={Boolean(prefs?.ops?.autoFillCash)} onChange={(v) => setOps({ autoFillCash: v })} />
                        <Switch label="Show margin" note="View margin readout on selected line." value={Boolean(prefs?.ops?.showMargin)} onChange={(v) => setOps({ showMargin: v })} />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Stock</h3>
                        <Switch label="Allow overselling" note="Sell below zero stock." value={Boolean(prefs?.ops?.allowOversell)} onChange={(v) => setOps({ allowOversell: v })} />
                        <Seg
                            label="Default location" value={prefs?.ops?.warehouse || 1}
                            options={effectiveWarehouses.map((w) => w.id)} labels={effectiveWarehouses.map((w) => w.name)}
                            onPick={(v) => setOps({ warehouse: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Hardware</h3>
                        <Switch label="Auto-print on complete" value={Boolean(prefs?.ops?.autoPrint)} onChange={(v) => setOps({ autoPrint: v })} />
                        <Switch label="Open drawer on cash sale" value={Boolean(prefs?.ops?.openDrawerOnCash)} onChange={(v) => setOps({ openDrawerOnCash: v })} />
                        <Seg
                            label="Deposit non-cash to" value={prefs?.ops?.bank || 1}
                            options={effectiveBanks.map((b) => b.id)} labels={effectiveBanks.map((b) => (b.name || '').split(' — ')[0])}
                            onPick={(v) => setOps({ bank: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Cashier Permissions</h3>
                        <Switch label="Void a line" value={Boolean(prefs?.perms?.['pos.void_item'])} onChange={(v) => setPerm('pos.void_item', v)} />
                        <Switch label="Run a return" value={Boolean(prefs?.perms?.['pos.refund'])} onChange={(v) => setPerm('pos.refund', v)} />
                        <Switch label="Override a price" value={Boolean(prefs?.perms?.['pos.price_override'])} onChange={(v) => setPerm('pos.price_override', v)} />
                        <Switch label="Give a discount" value={Boolean(prefs?.perms?.['pos.discount'])} onChange={(v) => setPerm('pos.discount', v)} />
                        <Switch label="Open the drawer by hand" value={Boolean(prefs?.perms?.['pos.open_drawer'])} onChange={(v) => setPerm('pos.open_drawer', v)} />
                    </div>
                </div>
            )}
        </Sheet>
    );
}
