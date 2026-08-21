/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the settings drawer                                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Rank 3's budget on the working surface is ZERO. A control used once per setup,
 * shift or month, docked permanently, is thirty days of noise for one day of
 * use. So everything of that kind is here, and here only.
 *
 * The drawer has two halves and they are different in kind:
 *
 *   ARRANGE   geometry. Auto, the profile, the seven starting points, and then
 *             every knob behind them. Nothing here can produce an illegal
 *             layout — the numbers are wishes and the measured floors are the
 *             law, so the worst a bad setting can do is get overruled, visibly,
 *             in the read-out at the bottom.
 *
 *   OPERATE   the register's behaviour. Tax, returns, rounding, hardware,
 *             permissions. These change what the register DOES, not what it
 *             looks like.
 *
 * AUTO is the answer to "there should be an option to do this automatically":
 * you say what kind of business this is, once, and Auto picks the arrangement
 * for whatever screen the register is standing on — and re-picks it when that
 * screen changes. Touch any geometry knob and it drops to Manual, with one tap
 * back to Auto.
 */

import React from 'react';
import { presets } from '@/LayoutLaw/engine';
import { PROFILES, RETURN_POLICIES, screenBand } from './settings';
import { TAX_RATES, WAREHOUSES, BANKS } from './mock';
import { Seg, Sheet, Slider, Switch } from '@/LayoutLaw/ui';

const PCT = (v) => `${Math.round(v * 100)}%`;

const BAND_LABEL = {
    phone: 'a phone',
    tablet: 'a tablet',
    short: 'a wide, short screen',
    desk: 'a desktop',
};

export default function SettingsDrawer({
    open, onClose, prefs, T, vp,
    setComp, setPreset, setProfile, setAuto, setOps, setPerm, setRail,
    rankMode, setRankMode, tab, setTab, onReset,
}) {
    const c = prefs.comp;
    const band = screenBand(vp.w, vp.h);

    /* Every geometry change drops Auto — silently is wrong, so the banner at the
       top changes to say so and offers one tap back. */
    const geo = (fn) => (...args) => { setAuto(false); fn(...args); };

    const setCat = geo((patch) => setComp({ ...c, catalog: { ...c.catalog, ...patch } }));
    const setSplit = geo((patch) => setComp({ ...c, split: { ...c.split, ...patch } }));
    const setTender = geo((v) => setComp({ ...c, tender: v }));
    const setFloor = geo((v) => setComp({ ...c, floor: v }));
    const pickPreset = geo((id) => setPreset(id));

    const catTxt = !T.catalog ? 'off'
        : T.catalog.mode === 'overlay' ? `button — ${T.catalog.reason}`
            : (T.catalog.mode === 'top' || T.catalog.mode === 'bottom')
                ? `${T.catalog.mode} · ${T.catalog.rows} row${T.catalog.rows > 1 ? 's' : ''} × ${T.catalog.tiles} tiles`
                : `${T.catalog.mode} · ${Math.round(T.catalog.px)}px · ${T.catalog.fit}`;
    const tenderTxt = T.tender.mode
        + (T.tender.px ? ` · ${Math.round(T.tender.px)}px · ${T.tender.fit}`
            : T.tender.reason ? ` — ${T.tender.reason}` : '');

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Register settings"
            size="wide"
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
                            label={prefs.auto ? 'Auto — arranged for this screen' : 'Manual — you are arranging this yourself'}
                            note={prefs.auto
                                ? `This is ${BAND_LABEL[band]}, so Auto is running the ${T.regime === 'phone' ? 'one-column' : T.regime} arrangement. Change the window and it re-picks.`
                                : 'Auto stopped when you moved a knob. Turn it back on and this screen goes back to the arrangement your profile asks for.'}
                            value={prefs.auto}
                            onChange={setAuto}
                        />
                        {prefs.auto ? (
                            <div className="nqp-ctl">
                                <div className="lbl"><span>What kind of counter is this?</span></div>
                                <div className="nqp-presets">
                                    {PROFILES.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className="nqp-preset"
                                            aria-pressed={prefs.profile === p.id}
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
                                    aria-pressed={prefs.preset === p.id}
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
                            value={c.catalog.mode}
                            options={['off', 'left', 'right', 'top', 'bottom', 'overlay']}
                            labels={['Off', 'Left', 'Right', 'Top', 'Bottom', 'Button']}
                            onPick={(v) => setCat({ mode: v, size: (v === 'top' || v === 'bottom') && c.catalog.size > 0.55 ? 0.4 : c.catalog.size })}
                            note="Off = scanner only. Left/right = a column. Top/bottom = a tile strip. Button = one tap, full screen."
                        />
                        {(c.catalog.mode === 'left' || c.catalog.mode === 'right') ? (
                            <Slider
                                label="Catalogue width" value={c.catalog.size} lo={0.12} hi={0.55} step={0.01}
                                fmt={PCT} onSet={(v) => setCat({ size: v })}
                                note="Of the content width. Clamped to the catalogue's measured floor — below it, it becomes a button rather than an unreadable column."
                            />
                        ) : null}
                        {(c.catalog.mode === 'top' || c.catalog.mode === 'bottom') ? (
                            <>
                                <Slider
                                    label="Catalogue height" value={c.catalog.size} lo={0} hi={0.55} step={0.05}
                                    fmt={(v) => (v ? PCT(v) : 'by rows')} onSet={(v) => setCat({ size: v })}
                                    note="A band is always a whole number of tile rows. A 40% share that only buys one row gives the rest back to the cart."
                                />
                                {!c.catalog.size ? (
                                    <Seg label="Strip rows" value={c.catalog.rows} options={[1, 2, 3]} onPick={(v) => setCat({ rows: v })} />
                                ) : null}
                            </>
                        ) : null}
                        {c.catalog.mode !== 'off' ? (
                            <Slider
                                label="Tiles per row" value={c.catalog.tiles || 0} lo={0} hi={8} step={1}
                                fmt={(v) => (v ? String(v) : 'auto')} onSet={(v) => setCat({ tiles: v || null })}
                                note="The category's real density control — Toast ships rows × columns per device, default 8 × 5."
                            />
                        ) : null}
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Cart and payment</h3>
                        <Slider
                            label="Cart share" value={c.split.cart} lo={0.3} hi={1} step={0.01}
                            fmt={PCT} onSet={(v) => setSplit({ cart: v })}
                            note="Clamped so the cart never drops below its own floor. The cart is never the thing that gives way."
                        />
                        <Seg
                            label="Payment panel" value={c.tender}
                            options={['column', 'bar', 'sheet']} labels={['Column', 'Bar', 'Button']}
                            onPick={setTender}
                            note="Column = always visible. Bar = a docked total and Pay. Button = full screen on demand — same controls every time."
                        />
                        {c.tender === 'column' ? (
                            <Slider
                                label="Payment share" value={c.split.tender} lo={0} hi={0.45} step={0.01}
                                fmt={PCT} onSet={(v) => setSplit({ tender: v })}
                                note="0 turns the payment panel into a sheet behind Take payment."
                            />
                        ) : null}
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Floor plan</h3>
                        <Seg
                            label="Tables" value={c.floor}
                            options={['off', 'left', 'overlay']} labels={['Off', 'Column', 'Step']}
                            onPick={setFloor}
                            note="Table service only. A column on a very wide screen, a step on anything narrower — the floor is not a fourth column competing for width."
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>This screen</h3>
                        <Switch
                            label="Icon rail" note="The nav rail beside the register. The hamburger stays at every width either way, so nothing becomes unreachable."
                            value={prefs.rail} onChange={setRail}
                        />
                        <Slider
                            label="Interface scale" value={prefs.ops.uiScale} lo={0.85} hi={1.35} step={0.05}
                            fmt={(v) => `${Math.round(v * 100)}%`} onSet={(v) => setOps({ uiScale: v })}
                        />
                        <Switch
                            label="Large text mode" note="Bigger type and bigger figures, for a counter that is read at arm's length."
                            value={prefs.ops.senior} onChange={(v) => setOps({ senior: v })}
                        />
                        <Switch
                            label="Show control ranks" note="Outlines every control by rank: teal = act, blue = adjust, grey = configure. Rank 1 is capped at seven on the surface; rank 3 at zero."
                            value={rankMode} onChange={setRankMode}
                        />
                    </div>

                    {/* ── THE READ-OUT ───────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>What the law did with that</h3>
                        <div className="nqp-readout">
                            <b>{vp.w}×{vp.h}</b> · content <b>{Math.round(T.avail)}×{T.H}px</b>
                            {' '}· usable after the dock <b>{T.usableH}px</b> → <b>{T.regime}</b>
                            <br />
                            catalogue <b>{catTxt}</b>
                            <br />
                            cart <b>{Math.round(T.cart.px)}px · {T.cart.fit}</b> ({T.cartLines} lines)
                            <br />
                            payment <b>{tenderTxt}</b>
                            <br />
                            dock: <b>{T.dock.map((d) => d.label).join(' · ') || 'nothing — everything is resident'}</b>
                            {T.dockH ? ` (${T.dockH}px, a real row)` : ''}
                            <br />
                            reachable: {Object.entries(T.reachable).map(([k, v]) => `${v ? '✓' : '✕'} ${k}`).join('   ')}
                        </div>
                        {T.notes.map((note) => (<div className="nqp-note" key={note}>{note}</div>))}
                        {T.cramped ? (
                            <div className="nqp-note">
                                the cart is down to {T.cartLines} visible lines here — it still scrolls, but
                                giving the catalogue or the payment panel less would buy it back
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="nqp-set">
                    {/* ── OPERATE ────────────────────────────────────────────── */}
                    <div className="nqp-setgroup">
                        <h3>Tax</h3>
                        <Seg
                            label="Default rate" value={prefs.ops.defaultTax}
                            options={TAX_RATES.map((t) => t.id)} labels={TAX_RATES.map((t) => t.label)}
                            onPick={(v) => setOps({ defaultTax: v })}
                        />
                        <Seg
                            label="Prices are" value={prefs.ops.taxMode}
                            options={['exclusive', 'inclusive']} labels={['Tax on top', 'Tax included']}
                            onPick={(v) => setOps({ taxMode: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Returns</h3>
                        <Seg
                            label="Policy" value={prefs.ops.returnPolicy}
                            options={RETURN_POLICIES.map((p) => p.id)}
                            labels={RETURN_POLICIES.map((p) => p.label)}
                            onPick={(v) => setOps({ returnPolicy: v })}
                            note={RETURN_POLICIES.find((p) => p.id === prefs.ops.returnPolicy)?.note}
                        />
                        <Slider
                            label="Return window" value={prefs.ops.returnWindowDays} lo={0} hi={90} step={1}
                            fmt={(v) => (v ? `${v} days` : 'no limit')} onSet={(v) => setOps({ returnWindowDays: v })}
                            note="The policy above and this window are both read at the return. In the shipped register they were parsed and then thrown away."
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Money</h3>
                        <Switch label="Round off the total" note="To the nearest rupee. The rounding is shown as its own line in the breakdown, never hidden inside the total." value={prefs.ops.roundOff} onChange={(v) => setOps({ roundOff: v })} />
                        <Switch label="Auto-fill exact cash" note="Pre-fills the tendered amount with the total, so an exact-money sale is one tap." value={prefs.ops.autoFillCash} onChange={(v) => setOps({ autoFillCash: v })} />
                        <Switch label="Show margin" note="A rank-2 peek on the selected line. Cost travels with the line, so this is a real number." value={prefs.ops.showMargin} onChange={(v) => setOps({ showMargin: v })} />
                        <div className="nqp-ctl">
                            <div className="lbl"><span>Discount presets</span><b>{prefs.ops.discountPresets.join(' · ')}%</b></div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {[2, 3, 5, 7.5, 10, 12, 15, 20, 25, 30].map((v) => {
                                    const on = prefs.ops.discountPresets.includes(v);
                                    return (
                                        <button
                                            key={v}
                                            type="button"
                                            className="nqp-catchip"
                                            aria-pressed={on}
                                            onClick={() => setOps({
                                                discountPresets: on
                                                    ? prefs.ops.discountPresets.filter((x) => x !== v)
                                                    : [...prefs.ops.discountPresets, v].sort((a, b) => a - b),
                                            })}
                                        >
                                            {v}%
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="note">These are the presets on the document-discount field. Long-press one there to edit it in place.</div>
                        </div>
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Stock</h3>
                        <Switch label="Allow overselling" note="Sell below zero stock. Off means the sale stops at the line that would go negative." value={prefs.ops.allowOversell} onChange={(v) => setOps({ allowOversell: v })} />
                        <Switch label="Confirm reserved-stock backorders" note="The sale genuinely pauses until you answer. The shipped check tested a promise for truthiness and so never blocked anything." value={prefs.ops.confirmBackorder} onChange={(v) => setOps({ confirmBackorder: v })} />
                        <Seg
                            label="Default location" value={prefs.ops.warehouse}
                            options={WAREHOUSES.map((w) => w.id)} labels={WAREHOUSES.map((w) => w.name)}
                            onPick={(v) => setOps({ warehouse: v })}
                            note="Warehouses were passed to the shipped screen and had no control anywhere — a multi-branch store could not choose."
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>Hardware</h3>
                        <Switch label="Auto-print on complete" value={prefs.ops.autoPrint} onChange={(v) => setOps({ autoPrint: v })} />
                        <Switch label="Open the cash drawer on a cash sale" note="There is also a Drawer button on the working surface. The shipped build had the driver and the setting, and no button anywhere." value={prefs.ops.openDrawerOnCash} onChange={(v) => setOps({ openDrawerOnCash: v })} />
                        <Seg
                            label="Deposit non-cash to" value={prefs.ops.bank}
                            options={BANKS.map((b) => b.id)} labels={BANKS.map((b) => b.name.split(' — ')[0])}
                            onPick={(v) => setOps({ bank: v })}
                        />
                    </div>

                    <div className="nqp-setgroup">
                        <h3>This cashier may</h3>
                        <div className="note" style={{ marginTop: -4 }}>
                            Simulated here so the controls can be seen doing what the permission says.
                            In the real register these come from the role, and both of the two below were
                            defined in <code>config/permissions.php</code> and checked nowhere.
                        </div>
                        <Switch label="Void a line" value={prefs.perms['pos.void_item']} onChange={(v) => setPerm('pos.void_item', v)} />
                        <Switch label="Run a return" value={prefs.perms['pos.refund']} onChange={(v) => setPerm('pos.refund', v)} />
                        <Switch label="Override a price" value={prefs.perms['pos.price_override']} onChange={(v) => setPerm('pos.price_override', v)} />
                        <Switch label="Give a discount" value={prefs.perms['pos.discount']} onChange={(v) => setPerm('pos.discount', v)} />
                        <Switch label="Open the drawer by hand" value={prefs.perms['pos.open_drawer']} onChange={(v) => setPerm('pos.open_drawer', v)} />
                    </div>
                </div>
            )}
        </Sheet>
    );
}
