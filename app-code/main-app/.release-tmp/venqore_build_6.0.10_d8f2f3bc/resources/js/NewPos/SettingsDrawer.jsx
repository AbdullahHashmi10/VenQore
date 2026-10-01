/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — Settings Drawer (Clean, Streamlined & Decluttered)              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Clean operational drawer focused on essential daily controls. Layout starting
 * points and composition sliders have been moved into a dedicated visual customizer
 * ("Want to change your look? Click here").
 */

import React from 'react';
import { DEFAULTS, DEFAULT_OPS, DEFAULT_PERMS, RETURN_POLICIES } from './settings';
import { presetComposition } from '@/LayoutLaw/engine';
import { Seg, Sheet, Switch } from '@/LayoutLaw/ui';

export default function SettingsDrawer({
    open,
    onClose,
    prefs = DEFAULTS,
    setPrefs,
    width,
    warehouses = [],
    banks = [],
    taxRates = [],
    onOpenLayoutPicker,
    onOpenSetupWizard,
}) {
    const setOps = (opsPatch) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, ...opsPatch } }));
    const setPerm = (key, val) => setPrefs?.((p) => ({ ...p, perms: { ...p.perms, [key]: val } }));
    const setRail = (rail) => setPrefs?.((p) => ({ ...p, rail }));
    const setRankMode = (rankMode) => setPrefs?.((p) => ({ ...p, ops: { ...p.ops, rankMode } }));

    const onReset = () => setPrefs?.({
        ...DEFAULTS,
        comp: presetComposition('column'),
        ops: { ...DEFAULT_OPS },
        perms: { ...DEFAULT_PERMS },
    });

    const effectiveWarehouses = warehouses.length ? warehouses : [{ id: 1, name: 'Main store' }];
    const effectiveBanks = banks.length ? banks : [{ id: 1, name: 'Main bank' }];
    const effectiveTaxRates = taxRates.length ? taxRates : [
        { id: 0, label: 'No tax (0%)', rate: 0 },
        { id: 1, label: 'GST (18%)', rate: 18 },
        { id: 2, label: 'GST (5%)', rate: 5 },
    ];

    const currentPreset = prefs?.preset || 'column';
    const currentProfile = prefs?.profile || 'retail';

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Register Settings"
            size="wide"
            style={{ width: width ? `${width}px` : undefined }}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" onClick={onReset}>
                        Reset to Defaults
                    </button>
                    <button type="button" className="nqp-cta" onClick={onClose}>
                        Done
                    </button>
                </div>
            )}
        >
            <div className="nqp-clean-settings-wrap">
                {/* ── 1. LOOK & LAYOUT ACTION BANNER ──────────────────────── */}
                <div className="nqp-look-card">
                    <div className="look-card-top">
                        <div className="look-card-info">
                            <span className="look-eyebrow">POS LOOK & LAYOUT</span>
                            <h3 className="look-title">
                                {currentPreset.toUpperCase()} Layout · {prefs?.auto ? 'Auto Mode' : 'Manual'}
                            </h3>
                            <p className="look-desc">
                                Profile: <b>{currentProfile}</b> · Rail: <b>{prefs?.rail ? 'Visible' : 'Hidden'}</b> · Senior Mode: <b>{prefs?.ops?.senior ? 'On' : 'Off'}</b>
                            </p>
                        </div>
                    </div>

                    <div className="look-card-actions">
                        <button
                            type="button"
                            className="nqp-look-btn primary"
                            onClick={() => {
                                onClose?.();
                                onOpenLayoutPicker?.();
                            }}
                        >
                            🎨 Want to change your look? Click here
                        </button>
                        <button
                            type="button"
                            className="nqp-look-btn secondary"
                            onClick={() => {
                                onClose?.();
                                onOpenSetupWizard?.();
                            }}
                        >
                            ✨ Run Setup Wizard
                        </button>
                    </div>
                </div>

                {/* ── 2. DISPLAY & INTERFACE ──────────────────────────────── */}
                <div className="nqp-setgroup">
                    <h3>Display & Interface</h3>
                    <Switch
                        label="Large text mode (Senior mode)"
                        note="Enlarges typography and figures for faster counter reading."
                        value={Boolean(prefs?.ops?.senior)}
                        onChange={(v) => setOps({ senior: v })}
                    />
                    <Switch
                        label="Navigation rail"
                        note="Show the icon navigation sidebar beside the register."
                        value={Boolean(prefs?.rail)}
                        onChange={setRail}
                    />
                    <Seg
                        label="Interface scale"
                        value={prefs?.ops?.uiScale || 1}
                        options={[0.9, 1, 1.15, 1.25]}
                        labels={['Compact 90%', 'Normal 100%', 'Large 115%', 'Extra 125%']}
                        onPick={(v) => setOps({ uiScale: v })}
                    />
                    <Switch
                        label="Show control ranks"
                        note="Outlines controls by operational rank: teal = act, blue = adjust, grey = configure."
                        value={Boolean(prefs?.ops?.rankMode)}
                        onChange={setRankMode}
                    />
                </div>

                {/* ── 3. CHECKOUT & HARDWARE ──────────────────────────────── */}
                <div className="nqp-setgroup">
                    <h3>Checkout & Hardware</h3>
                    <Switch
                        label="Auto-print receipt on complete"
                        note="Automatically prints thermal receipt when sale is finalized."
                        value={Boolean(prefs?.ops?.autoPrint)}
                        onChange={(v) => setOps({ autoPrint: v })}
                    />
                    <Switch
                        label="Open cash drawer on cash sale"
                        note="Sends electronic kick pulse to cash drawer on cash tender."
                        value={Boolean(prefs?.ops?.openDrawerOnCash)}
                        onChange={(v) => setOps({ openDrawerOnCash: v })}
                    />
                    <Switch
                        label="Auto-fill exact cash"
                        note="Pre-fills tendered amount with invoice total for faster cashout."
                        value={Boolean(prefs?.ops?.autoFillCash)}
                        onChange={(v) => setOps({ autoFillCash: v })}
                    />
                    <Switch
                        label="Round off invoice total"
                        note="Rounds invoice total to the nearest whole rupee."
                        value={Boolean(prefs?.ops?.roundOff)}
                        onChange={(v) => setOps({ roundOff: v })}
                    />
                </div>

                {/* ── 4. SALES & RETURNS ─────────────────────────────────── */}
                <div className="nqp-setgroup">
                    <h3>Sales & Return Policy</h3>
                    <Seg
                        label="Return mode policy"
                        value={prefs?.ops?.returnPolicy || 'reference'}
                        options={RETURN_POLICIES.map((p) => p.id)}
                        labels={RETURN_POLICIES.map((p) => p.label)}
                        onPick={(v) => setOps({ returnPolicy: v })}
                        note={RETURN_POLICIES.find((p) => p.id === prefs?.ops?.returnPolicy)?.note}
                    />
                    <Seg
                        label="Return window"
                        value={prefs?.ops?.returnWindowDays || 14}
                        options={[7, 14, 30, 0]}
                        labels={['7 days', '14 days', '30 days', 'No limit']}
                        onPick={(v) => setOps({ returnWindowDays: v })}
                    />
                    <Switch
                        label="Show profit margin"
                        note="Displays profit margin percentage on selected item line."
                        value={Boolean(prefs?.ops?.showMargin)}
                        onChange={(v) => setOps({ showMargin: v })}
                    />
                    <Switch
                        label="Allow overselling (Negative stock)"
                        note="Permits completing a sale even when product inventory is 0 or less."
                        value={Boolean(prefs?.ops?.allowOversell)}
                        onChange={(v) => setOps({ allowOversell: v })}
                    />
                </div>

                {/* ── 5. LOCATIONS & ACCOUNTS ─────────────────────────────── */}
                <div className="nqp-setgroup">
                    <h3>Locations & Accounts</h3>
                    <Seg
                        label="Default store location / warehouse"
                        value={prefs?.ops?.warehouse || effectiveWarehouses[0]?.id || 1}
                        options={effectiveWarehouses.map((w) => w.id)}
                        labels={effectiveWarehouses.map((w) => w.name)}
                        onPick={(v) => setOps({ warehouse: v })}
                    />
                    <Seg
                        label="Deposit non-cash payments to"
                        value={prefs?.ops?.bank || effectiveBanks[0]?.id || 1}
                        options={effectiveBanks.map((b) => b.id)}
                        labels={effectiveBanks.map((b) => (b.name || '').split(' — ')[0])}
                        onPick={(v) => setOps({ bank: v })}
                    />
                    <Seg
                        label="Default tax rate"
                        value={prefs?.ops?.defaultTax || 0}
                        options={effectiveTaxRates.map((t) => t.id)}
                        labels={effectiveTaxRates.map((t) => t.label)}
                        onPick={(v) => setOps({ defaultTax: v })}
                    />
                    <Seg
                        label="Prices are displayed"
                        value={prefs?.ops?.taxMode || 'exclusive'}
                        options={['exclusive', 'inclusive']}
                        labels={['Tax on top (Exclusive)', 'Tax included (Inclusive)']}
                        onPick={(v) => setOps({ taxMode: v })}
                    />
                </div>

                {/* ── 6. CASHIER PERMISSIONS ──────────────────────────────── */}
                <div className="nqp-setgroup">
                    <h3>Cashier Permissions</h3>
                    <Switch
                        label="Void a line item"
                        value={Boolean(prefs?.perms?.['pos.void_item'])}
                        onChange={(v) => setPerm('pos.void_item', v)}
                    />
                    <Switch
                        label="Run a return / refund"
                        value={Boolean(prefs?.perms?.['pos.refund'])}
                        onChange={(v) => setPerm('pos.refund', v)}
                    />
                    <Switch
                        label="Override unit price"
                        value={Boolean(prefs?.perms?.['pos.price_override'])}
                        onChange={(v) => setPerm('pos.price_override', v)}
                    />
                    <Switch
                        label="Apply custom discount"
                        value={Boolean(prefs?.perms?.['pos.discount'])}
                        onChange={(v) => setPerm('pos.discount', v)}
                    />
                    <Switch
                        label="Open cash drawer manually"
                        value={Boolean(prefs?.perms?.['pos.open_drawer'])}
                        onChange={(v) => setPerm('pos.open_drawer', v)}
                    />
                </div>
            </div>
        </Sheet>
    );
}
