/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  RegisterSettingsDrawer — the register's ONE settings surface             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS REPLACES
 * ------------------
 * The register used to carry three settings entry points in its top bar and a
 * fourth behind a first-run modal:
 *
 *   1. "Customize POS Layout & Look"  -> LayoutPickerModal   (presets only)
 *   2. "Quick settings"               -> a 5-row dropdown    (a subset)
 *   3. "Register settings"            -> a 720px modal       (a different subset)
 *   4. Setup wizard                   -> a fifth copy of 1
 *
 * Three of those wrote the same five values through three different code paths,
 * none of them exposed the composition knobs the Layout Law actually defines,
 * and the operator had to learn which of the three buttons held the switch they
 * wanted. There is now exactly one.
 *
 * WHY FULL SCREEN, WITH A PREVIEW
 * -------------------------------
 * Every control on the Layout tab changes the shape of the register, and a
 * change you cannot see while you make it is a change you have to make twice.
 * A panel beside the register would only ever show you THIS screen; the
 * preview shows the phone, the tablet and the counter terminal too -- which is
 * what matters, because the law demotes panes differently on each and that is
 * exactly the behaviour people are surprised by at the till. So the composer
 * takes the screen and carries the picture with it.
 *
 * The preview is not a drawing. It calls `composeTerminal`, the same function
 * the real register calls, so it cannot show a layout the law would not
 * produce -- including the demotions.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * -----------------------------
 * Percentage sliders. The reference composer shipped "catalog width 20%",
 * "cart share 50%", "tender share 30%" as three range inputs, and a range
 * input is the wrong instrument for this: it asks the operator to think in
 * numbers about a thing they are looking at. The proportions are edited by
 * dragging the column edge in the register itself — pointer, or keyboard on a
 * focused divider — and this tab only says so and offers the reset.
 *
 * THE MODEL
 * ---------
 * Two kinds of setting, and they are not the same kind of thing:
 *
 *   comp   THE COMPOSITION. Geometry. Every value is a WISH — composeTerminal()
 *          clamps it against the measured floors, so nothing set here can
 *          produce an illegal layout. The Layout tab edits this.
 *   ops    THE OPERATIONAL SETTINGS. Rank 3 in the capability inventory: once
 *          per setup, shift or month. Their budget on the working surface is
 *          zero. Every other tab edits these.
 *
 * All of it is presentational — this file owns no state that outlives it. The
 * register hands down current values and setters, so there is one source of
 * truth and no second copy to drift.
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
    X, LayoutGrid, Monitor, Receipt, Printer, Keyboard, RotateCcw,
    Check, Info, MoveHorizontal, Minus, Plus, Pause, History, Unlock,
    Wifi, WifiOff, AlertTriangle, MousePointerClick, Maximize2, Undo2,
    Utensils,
} from 'lucide-react';
import RegisterPreview, { PREVIEW_DEVICES } from './RegisterPreview';

/* ══════════════════════════════════════════════════════════════════════════
   THE KEYMAP — one map for the whole product.
   Kept here rather than in the page because this is now the only place it is
   rendered, and a map that lives beside its own renderer cannot fall out of
   step with it.
   ══════════════════════════════════════════════════════════════════════════ */
export const POS_KEYMAP = [
    ['F1', 'Focus scan / search'],
    ['F2', 'Quantity on the active line'],
    ['F3', 'Discount on the active line'],
    ['F4', 'Remove the active line'],
    ['F5', 'Rate on the active line'],
    ['F7', 'Document tax'],
    ['F8', 'Additional charges'],
    ['F9', 'Document discount'],
    ['F11', 'Customer / party'],
    ['F12', 'Sale remarks'],
    ['Ctrl + S', 'Hold the sale'],
    ['Ctrl + T', 'New sale tab'],
    ['Ctrl + W', 'Close this tab'],
    ['Ctrl + D', 'Open cash drawer'],
    ['Ctrl + F', 'Bill breakdown'],
    ['Ctrl + 1…9', 'Select line n'],
    ['Alt + L', 'Register settings'],
    ['Alt + Z', 'Fullscreen'],
    ['Esc', 'Close the top layer'],
    ['?', 'Show this map'],
];

/* ══════════════════════════════════════════════════════════════════════════
   COUNTER BUTTONS
   Which rank-2 controls appear on the register's own top bar.

   The old page hard-coded this and got it wrong in both directions: the cash
   drawer had no button anywhere despite AMDStation.openDrawer() and the
   thermal_open_drawer setting both existing, parked sales and recent invoices
   were three clicks deep inside a settings modal, and two localStorage keys
   -- `pos_show_top_till` and `pos_show_top_hardware` -- were read on mount and
   then used by nothing at all, which is somebody having meant to make this a
   choice and never finishing the wiring.

   Defaults are deliberately sparse. The law budgets the working surface at
   seven rank-1 controls, and every button switched on here spends from what is
   left of the operator's attention.
   ══════════════════════════════════════════════════════════════════════════ */
export const SURFACE_BUTTONS = [
    { id: 'drawer', label: 'Open cash drawer', icon: Unlock, dflt: true,
      hint: 'Pulses the drawer without a sale. Ctrl + D does the same thing.' },
    { id: 'parked', label: 'Parked sales', icon: Pause, dflt: true,
      hint: 'Held sales, ready to recall. Carries a count when any are waiting.' },
    { id: 'recent', label: 'Recent invoices', icon: History, dflt: false,
      hint: 'The last sales from this till, with reprint.' },
    { id: 'returns', label: 'Return mode', icon: Undo2, dflt: false,
      hint: 'Switches the register to refunds. Leave it off on a till that never takes them.' },
    { id: 'online', label: 'Online status light', icon: Wifi, dflt: true,
      hint: 'A bare dot: green when sales post immediately, red when they are queuing on this device. Deliberately not in a box \u2014 a status light inside a bordered pill reads as a button.' },
    { id: 'printer', label: 'Printer status', icon: Printer, dflt: true,
      hint: 'Reports what is actually attached: ready with a count, amber when the station is running but no printer answered, grey when there is no station at all. Tap it to open Hardware.' },
    { id: 'keys', label: 'Keyboard shortcuts', icon: Keyboard, dflt: false,
      hint: 'Opens the key map. \u201c?\u201d opens it whether or not the button is here.' },
    { id: 'fullscreen', label: 'Fullscreen', icon: Maximize2, dflt: false,
      hint: 'Hides the browser chrome. Alt + Z does the same thing.' },
];

export const DEFAULT_SURFACE = SURFACE_BUTTONS.reduce(
    (a, b) => { a[b.id] = b.dflt; return a; }, {},
);

/* ══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   Built once here rather than repeated inline, because the old settings modal
   hand-wrote the same toggle markup eleven times and three of them had drifted
   to different sizes.
   ══════════════════════════════════════════════════════════════════════════ */

/** Section heading. v6 eyebrow: 11px, 700, .12em, muted. */
function Eyebrow({ children, className = '' }) {
    return (
        <h4 className={`text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted ${className}`}>
            {children}
        </h4>
    );
}

/** A labelled block. `title` is the control's name; `hint` is one line of why. */
function Field({ title, hint, badge, children, stacked = false }) {
    return (
        <div className="rounded-xl border border-line/80 bg-surface shadow-xs p-3.5">
            <div className={stacked ? 'space-y-2.5' : 'flex items-start justify-between gap-3'}>
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-ink leading-tight">{title}</span>
                        {badge}
                    </div>
                    {hint && (
                        <p className="text-2xs text-ink-muted leading-relaxed max-w-[46ch]">{hint}</p>
                    )}
                </div>
                {!stacked && <div className="shrink-0">{children}</div>}
            </div>
            {stacked && children}
        </div>
    );
}

/** Switch. One size, 44x24, everywhere. */
function Toggle({ checked, onChange, label, tone = 'brand', disabled = false }) {
    const on = tone === 'danger' ? 'bg-danger-600' : tone === 'success' ? 'bg-emerald-600' : 'bg-brand-600';
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        disabled:opacity-40 disabled:cursor-not-allowed ${checked ? on : 'bg-line-strong'}`}
        >
            <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                            transition-[left,right] duration-fast ${checked ? 'right-0.5' : 'left-0.5'}`}
            />
        </button>
    );
}

/**
 * Segmented control. Wraps rather than scrolls, because a horizontally
 * scrolled segment hides options the operator does not know exist — which is
 * how "catalog on the right" stayed undiscovered in the old picker.
 */
function Segmented({ value, options, onChange, label, disabled = false }) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={`flex flex-wrap gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70
                        ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
            {options.map(opt => {
                const active = value === opt.value;
                return (
                    <button
                        key={String(opt.value)}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={opt.hint || opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 min-w-[68px] h-9 px-2.5 rounded-lg text-2xs font-bold
                                    transition-all cursor-pointer whitespace-nowrap
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                    ${active
                                        ? 'bg-surface text-brand-700 dark:text-brand-300 shadow-xs border border-brand-500/30'
                                        : 'text-ink-muted hover:text-ink hover:bg-surface/70 border border-transparent'}`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Stepper. The replacement for a range input wherever a number really is the
 * control: it is exact, it is keyboard-native, and it never lands on 37%
 * because a finger slipped.
 */
function Stepper({ value, min, max, step = 1, onChange, format, label, disabled = false }) {
    const clamp = v => Math.max(min, Math.min(max, v));
    const btn = 'w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer '
              + 'text-ink-secondary hover:bg-interactive-hover hover:text-ink '
              + 'disabled:opacity-30 disabled:cursor-not-allowed '
              + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';
    return (
        <div
            className={`flex items-center gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
            role="group"
            aria-label={label}
        >
            <button type="button" className={btn} onClick={() => onChange(clamp(value - step))}
                    disabled={value <= min} aria-label={`Decrease ${label}`}>
                <Minus size={15} strokeWidth={2.5} />
            </button>
            <span className="vq-num min-w-[64px] text-center text-xs font-bold text-ink tabular-nums select-none">
                {format ? format(value) : value}
            </span>
            <button type="button" className={btn} onClick={() => onChange(clamp(value + step))}
                    disabled={value >= max} aria-label={`Increase ${label}`}>
                <Plus size={15} strokeWidth={2.5} />
            </button>
        </div>
    );
}

/** A quiet explanatory strip. Never a colour that competes with a warning. */
function Note({ tone = 'info', icon: Icon = Info, children }) {
    const tones = {
        info: 'bg-sunken/60 border-line/70 text-ink-secondary',
        warn: 'bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300',
    };
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
            <Icon size={14} className="shrink-0 mt-[1px] opacity-80" />
            <p className="text-2xs leading-relaxed min-w-0">{children}</p>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE DRAWER
   ══════════════════════════════════════════════════════════════════════════ */

const TABS = [
    { id: 'layout',   label: 'Layout',   icon: LayoutGrid,        blurb: 'Where every pane goes' },
    { id: 'counter',  label: 'Counter',  icon: MousePointerClick, blurb: 'Buttons on the register' },
    { id: 'display',  label: 'Display',  icon: Monitor,           blurb: 'Type size and scale' },
    { id: 'selling',  label: 'Selling',  icon: Receipt,           blurb: 'Fields, totals, returns' },
    { id: 'service',  label: 'Service',  icon: Utensils,          blurb: 'Counter or table service' },
    { id: 'hardware', label: 'Hardware', icon: Printer,           blurb: 'Printer, drawer, sync' },
    { id: 'keys',     label: 'Keys',     icon: Keyboard,          blurb: 'The keyboard map' },
];

export default function RegisterSettings({
    open,
    onClose,
    initialTab = 'layout',

    /* geometry */
    presets = [],
    presetId,
    composition,
    layout,
    onApplyPreset,
    onUpdateComposition,
    onResetWidths,

    /* store-wide */
    serviceMode = 'counter', setServiceMode,
    serviceCharge = 0, setServiceCharge,
    onOpenFloorPlan,

    /* which terminal this register currently IS. The composer describes the
       screen in front of the operator, so a counter till is never offered the
       restaurant's controls and a restaurant is never offered Hold. */
    terminal = 'counter',

    /* which rank-2 buttons sit on the register's own bar */
    surface = DEFAULT_SURFACE,
    setSurface,

    /* display */
    seniorMode, setSeniorMode,
    showRail, setShowRail,
    uiScale, setUiScale,

    /* selling */
    enableTax, setEnableTax,
    enableFulfilment, setEnableFulfilment,
    enableFreeQty, setEnableFreeQty,
    roundOff, setRoundOff,
    autoFillCash, setAutoFillCash,
    returnMode, setReturnMode,
    returnPolicyLabel,
    discountPresets = [], setDiscountPresets,

    /* hardware */
    printOnComplete, setPrintOnComplete,
    openDrawerOnCash, setOpenDrawerOnCash,
    isStationConnected, isOnline,
    pendingCount = 0,
    onOpenCashDrawer,
    onOpenParked, parkedCount = 0,
    onOpenRecent,
    onOpenSyncHub,

    /* meta */
    onRunSetupWizard,
    onResetAll,
}) {
    const [tab, setTab] = useState(initialTab);
    const [deviceId, setDeviceId] = useState('desktop');
    const panelRef = useRef(null);
    const titleId = useId();

    /* The caller may open the drawer AT a tab — the '?' key opens it on Keys,
       and the dock's "why is this a button?" affordance opens it on Layout. */
    useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

    /* Esc closes the top layer. Scoped to the drawer and registered only while
       it is open, so it can never swallow the register's own Esc. */
    useEffect(() => {
        if (!open) return undefined;
        const onKey = e => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open, onClose]);

    /* Move focus into the panel on open so the keyboard follows the eye, and
       so Tab does not walk the register behind it first. */
    useEffect(() => {
        if (open && panelRef.current) {
            const t = setTimeout(() => panelRef.current?.focus?.(), 40);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [open]);

    const comp = composition || { catalog: {}, split: {}, tender: 'column', floor: 'off' };
    const catMode = comp.catalog?.mode ?? 'left';
    const catIsStrip = catMode === 'top' || catMode === 'bottom';
    const catIsColumn = catMode === 'left' || catMode === 'right';
    const catResident = catIsStrip || catIsColumn;
    const device = PREVIEW_DEVICES.find(d => d.id === deviceId) || PREVIEW_DEVICES[3];

    /* What the ENGINE decided, as opposed to what was asked for. A composer
       that only echoes the wish back is lying whenever a floor overrides it —
       and "I set the catalog to a column and nothing happened" was the single
       most reported confusion on the old picker. */
    const resolved = useMemo(() => {
        if (!layout) return null;
        const rows = [];
        const cat = layout.catalog;
        rows.push(['Catalog', !cat ? 'Off'
            : cat.mode === 'overlay' ? 'Full-screen button'
            : cat.mode === 'left' ? `Column, left · ${Math.round(cat.px || 0)}px`
            : cat.mode === 'right' ? `Column, right · ${Math.round(cat.px || 0)}px`
            : `Strip · ${cat.rows} row${cat.rows === 1 ? '' : 's'}`]);
        rows.push(['Cart', `${Math.round(layout.cart?.px || 0)}px · ${layout.cartLines || 0} lines visible`]);
        rows.push(['Tender', layout.tender?.mode === 'column' ? `Column · ${Math.round(layout.tender.px || 0)}px`
            : layout.tender?.mode === 'bar' ? 'Docked bar' : 'Full-screen sheet']);
        if (layout.floor) rows.push(['Floor plan', layout.floor.mode === 'left' ? `Column · ${Math.round(layout.floor.px || 0)}px` : 'Step']);
        rows.push(['Screen', `${Math.round(layout.avail || 0)}px usable · ${layout.regime}`]);
        return rows;
    }, [layout]);

    const notes = layout?.notes || [];

    const setCat = patch => onUpdateComposition?.(prev => ({ ...prev, catalog: { ...prev.catalog, ...patch } }));
    const setBtn = (id, v) => setSurface?.({ ...surface, [id]: v });

    /* ── SHELL ────────────────────────────────────────────────────────────
       Full screen, over a scrim, with three regions: the tab rail, the
       controls, and the preview. The preview keeps its own column rather than
       sitting above the controls, so it stays in view WHILE a control is
       changed -- which is the only thing that makes it worth the width. Below
       lg the three stack and the rail becomes a scrolling strip.
       ────────────────────────────────────────────────────────────────────── */
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-modal bg-ink/60 backdrop-blur-sm p-0 sm:p-4 md:p-6
                       flex items-stretch sm:items-center justify-center vq-anim-fade"
            /* mousedown, not click: a drag that STARTS inside the panel and ends
               on the scrim (letting go of a discount chip near the edge) must not
               be read as a click outside and close everything. */
            onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-app w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-[1240px]
                           sm:rounded-2xl border-0 sm:border border-line shadow-2xl
                           flex flex-col overflow-hidden outline-none"
            >
                {/* ── HEADER ── */}
                <header className="shrink-0 h-[60px] px-4 sm:px-5 border-b border-line bg-surface
                                   flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 id={titleId} className="vq-clip text-base font-bold text-ink leading-tight">
                            Register settings
                        </h2>
                        <p className="vq-clip text-2xs font-semibold text-ink-muted">
                            Saved on this device · {TABS.find(t => t.id === tab)?.blurb}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl border border-line bg-surface text-ink-muted
                                   hover:bg-interactive-hover hover:text-ink flex items-center justify-center
                                   transition-colors shrink-0 cursor-pointer
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        aria-label="Close settings"
                    >
                        <X size={18} />
                    </button>
                </header>

                {/* ── BODY: rail · controls · preview ── */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

                    <nav
                        role="tablist"
                        aria-label="Settings sections"
                        className="shrink-0 lg:w-[188px] border-b lg:border-b-0 lg:border-r border-line
                                   bg-surface flex lg:flex-col gap-1 p-2
                                   overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto scrollbar-none"
                    >
                        {TABS.map(t => {
                            const active = tab === t.id;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    role="tab"
                                    type="button"
                                    aria-selected={active}
                                    onClick={() => setTab(t.id)}
                                    className={`shrink-0 lg:w-full h-10 px-3 rounded-xl flex items-center gap-2
                                                text-2xs font-bold transition-colors cursor-pointer whitespace-nowrap
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                ${active
                                                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-500/30'
                                                    : 'text-ink-muted hover:text-ink hover:bg-interactive-hover border border-transparent'}`}
                                >
                                    <Icon size={15} className="shrink-0" />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* overscroll-contain stops a flick at the end of this list
                        from scrolling the register underneath it. */}
                    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">

                    {/* ═══════════ LAYOUT ═══════════ */}
                    {tab === 'layout' && (
                        <>
                            <section className="space-y-2.5">
                                <Eyebrow>Start from</Eyebrow>
                                <p className="text-2xs text-ink-muted leading-relaxed">
                                    Six starting points, not six fixed layouts. Pick the closest one,
                                    then change anything below — you are still inside the law.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.filter(p => (p.terminal || 'counter') === terminal).map(p => {
                                        const active = presetId === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => onApplyPreset?.(p.id)}
                                                className={`text-left p-3 rounded-xl border transition-all cursor-pointer
                                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                            ${active
                                                                ? 'border-brand-500/50 bg-brand-50/70 dark:bg-brand-950/30 shadow-xs'
                                                                : 'border-line/80 bg-surface hover:border-line-strong hover:shadow-xs'}`}
                                                aria-pressed={active}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-ink">{p.name}</span>
                                                    {active && <Check size={13} className="text-brand-600 dark:text-brand-400 shrink-0" />}
                                                </span>
                                                <span className="mt-1 block text-3xs text-ink-muted leading-snug line-clamp-2">
                                                    {p.tagline || p.for}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="space-y-2.5">
                                <Eyebrow>Panes</Eyebrow>

                                <Field
                                    title="Catalog"
                                    hint="Off is scanner-only. Left or right is a column. Top or bottom is a tile strip. Button is one full-screen tap."
                                    stacked
                                >
                                    <Segmented
                                        label="Catalog placement"
                                        value={catMode}
                                        onChange={v => setCat({ mode: v })}
                                        options={[
                                            { value: 'off',     label: 'Off' },
                                            { value: 'left',    label: 'Left' },
                                            { value: 'right',   label: 'Right' },
                                            { value: 'top',     label: 'Top' },
                                            { value: 'bottom',  label: 'Bottom' },
                                            { value: 'overlay', label: 'Button' },
                                        ]}
                                    />
                                </Field>

                                {catIsStrip && (
                                    <Field
                                        title="Strip rows"
                                        hint="Rows the height cannot pay for are given back to the cart rather than held as empty band."
                                    >
                                        <Stepper
                                            label="Strip rows"
                                            value={comp.catalog?.rows ?? 1}
                                            min={1} max={3}
                                            onChange={v => setCat({ rows: v })}
                                            format={v => `${v} row${v === 1 ? '' : 's'}`}
                                        />
                                    </Field>
                                )}

                                {catResident && (
                                    <Field
                                        title="Tiles per row"
                                        hint="The category's real density control. Auto fills the column with as many as fit."
                                    >
                                        <Stepper
                                            label="Tiles per row"
                                            value={comp.catalog?.tiles ?? 0}
                                            min={0} max={8}
                                            onChange={v => setCat({ tiles: v === 0 ? null : v })}
                                            format={v => (v === 0 ? 'Auto' : String(v))}
                                        />
                                    </Field>
                                )}

                                <Field
                                    title="Tender"
                                    hint="Column keeps the money detail always visible. Bar docks a total and a Pay button. Button opens the same panel full screen."
                                    stacked
                                >
                                    <Segmented
                                        label="Tender placement"
                                        value={comp.tender}
                                        onChange={v => onUpdateComposition?.(prev => ({
                                            ...prev,
                                            tender: v,
                                            /* A tender column with a zero share is a column that
                                               cannot be drawn. Give it back its default third the
                                               moment it is asked to be a column again. */
                                            split: { ...prev.split, tender: v === 'column' ? Math.max(0.22, prev.split?.tender || 0) : 0 },
                                        }))}
                                        options={[
                                            { value: 'column', label: 'Column' },
                                            { value: 'bar',    label: 'Bar' },
                                            { value: 'sheet',  label: 'Button' },
                                        ]}
                                    />
                                </Field>

                                <Field
                                    title="Payment sits on the"
                                    hint="Right by default. Left suits a counter whose customer display is on the left, or a left-handed cashier. Bottom turns the column into a full-width row — the better shape on a wide, short screen."
                                    stacked
                                >
                                    <Segmented
                                        label="Payment side"
                                        value={comp.tenderSide || 'right'}
                                        onChange={v => onUpdateComposition?.(prev => ({ ...prev, tenderSide: v }))}
                                        options={[
                                            { value: 'right', label: 'Right' },
                                            { value: 'left', label: 'Left' },
                                            { value: 'bottom', label: 'Bottom' },
                                        ]}
                                    />
                                </Field>

                                <Field
                                    title="Scan bar and Add item"
                                    hint="Auto puts them wherever the catalog is not. Pin them to the order list to keep a catalog column beside a scan bar, or into the catalog for a browse-led counter."
                                    stacked
                                >
                                    <Segmented
                                        label="Scan bar placement"
                                        value={comp.scanBar || 'auto'}
                                        onChange={v => onUpdateComposition?.(prev => ({ ...prev, scanBar: v }))}
                                        options={[
                                            { value: 'auto', label: 'Auto' },
                                            { value: 'order', label: 'On the order' },
                                            { value: 'catalog', label: 'In the catalog' },
                                        ]}
                                    />
                                </Field>

                                <Field
                                    title="Current order column"
                                    hint="A catalog-led counter with a few SKUs can drop the standing order list: every tile carries its in-cart count and the payment panel carries the totals. It stays put when there is nowhere else for the sale to show."
                                >
                                    <Toggle
                                        checked={comp.showOrder !== false}
                                        onChange={v => onUpdateComposition?.(prev => ({ ...prev, showOrder: v }))}
                                        label="Current order column"
                                    />
                                </Field>

                                {/* CARDS OR ROWS. The engine picks a shape from the fit it
                                    can afford, which is right for a shop that has not
                                    thought about it and wrong for one that has: a grocer
                                    reading 40-character names wants rows at every width,
                                    a cafe pointing at pictures wants cards even in a
                                    narrow column. Auto keeps the derivation. */}
                                <Field
                                    title="Catalog items"
                                    hint="Auto lets the width decide. Cards show the picture, price and stock. Rows fit about twice as many and give the name its full length. Pills fit the most by far — name and price only — which is the right shape for a menu you point at rather than search."
                                    stacked
                                >
                                    <Segmented
                                        label="Catalog item shape"
                                        value={comp.catalogShape || 'auto'}
                                        onChange={v => onUpdateComposition?.(prev => ({ ...prev, catalogShape: v }))}
                                        options={[
                                            { value: 'auto',  label: 'Auto' },
                                            { value: 'cards', label: 'Cards' },
                                            { value: 'rows',  label: 'Rows' },
                                            { value: 'pills', label: 'Pills' },
                                        ]}
                                    />
                                </Field>
                            </section>

                            {/* ── COLUMN WIDTHS ──
                                No sliders. The proportions are edited on the thing
                                itself; this block only teaches the gesture and offers
                                the way back. */}
                            <section className="space-y-2.5">
                                <Eyebrow>Column widths</Eyebrow>
                                <div className="rounded-xl border border-brand-500/25 bg-brand-50/50 dark:bg-brand-950/20 p-3.5 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <MoveHorizontal size={15} className="shrink-0 mt-0.5 text-brand-600 dark:text-brand-400" />
                                        <div className="min-w-0 space-y-1.5">
                                            <p className="text-xs font-bold text-ink leading-snug">
                                                Drag the divider between two columns.
                                            </p>
                                            <p className="text-2xs text-ink-secondary leading-relaxed">
                                                Grab the handle on a column edge and pull. Or focus it with{' '}
                                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold">Tab</kbd>{' '}
                                                and use{' '}
                                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold">←</kbd>{' '}
                                                <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold">→</kbd>{' '}
                                                — hold Shift for larger steps. Double-click a handle to
                                                reset that one column.
                                            </p>
                                            <p className="text-2xs text-ink-muted leading-relaxed">
                                                A divider stops where the pane beside it would stop fitting.
                                                It never travels somewhere illegal and never snaps back.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onResetWidths}
                                        className="w-full h-9 rounded-lg border border-line bg-surface text-ink
                                                   hover:bg-interactive-hover text-2xs font-bold
                                                   flex items-center justify-center gap-2 transition-colors cursor-pointer
                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                    >
                                        <RotateCcw size={13} /> Reset every width to this preset
                                    </button>
                                </div>
                            </section>

                        </>
                    )}

                    {/* ═══════════ COUNTER ═══════════ */}
                    {tab === 'counter' && (
                        <section className="space-y-2.5">
                            <Eyebrow>Buttons on the register</Eyebrow>
                            <p className="text-2xs text-ink-muted leading-relaxed max-w-[60ch]">
                                What appears in the register&rsquo;s top bar. Everything switched off here is
                                still reachable &mdash; from this panel, or from its keyboard shortcut. The bar
                                has a budget, and a button nobody presses spends it.
                            </p>
                            {SURFACE_BUTTONS.map(b => {
                                const Icon = b.icon;
                                const on = !!surface[b.id];
                                return (
                                    <div
                                        key={b.id}
                                        className="rounded-xl border border-line/80 bg-surface shadow-xs p-3.5
                                                   flex items-start justify-between gap-3"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border
                                                              ${on
                                                                ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-300/60'
                                                                : 'bg-sunken/70 text-ink-faint border-line/70'}`}>
                                                <Icon size={16} />
                                            </span>
                                            <div className="min-w-0 space-y-1">
                                                <span className="block text-sm font-bold text-ink leading-tight">{b.label}</span>
                                                <p className="text-2xs text-ink-muted leading-relaxed max-w-[48ch]">{b.hint}</p>
                                            </div>
                                        </div>
                                        <Toggle checked={on} onChange={v => setBtn(b.id, v)} label={b.label} />
                                    </div>
                                );
                            })}
                            <Note>
                                Queued offline sales are the one exception: that button appears on its own
                                the moment there is something to sync and hides again when there is not.
                                A count of zero is not worth a permanent control.
                            </Note>
                        </section>
                    )}

                    {/* ═══════════ DISPLAY ═══════════ */}
                    {tab === 'display' && (
                        <section className="space-y-2.5">
                            <Eyebrow>Display</Eyebrow>

                            <Field
                                title="Large text mode"
                                hint="Raises every type ramp and touch target. Panes that can no longer stay legible at the larger size become buttons rather than being crushed."
                            >
                                <Toggle checked={seniorMode} onChange={setSeniorMode} label="Large text mode" />
                            </Field>

                            <Field
                                title="Navigation rail"
                                hint="Off by default. A register is the one screen where the 72px is worth more than the navigation — Leave the register is always in the top left either way."
                            >
                                <Toggle checked={showRail} onChange={setShowRail} label="Navigation rail" />
                            </Field>

                            {typeof uiScale === 'number' && (
                                <Field
                                    title="Interface scale"
                                    hint="Scales the whole register. Distinct from large text: this moves everything, including the spacing between things."
                                >
                                    <Stepper
                                        label="Interface scale"
                                        value={Math.round(uiScale * 100)}
                                        min={90} max={130} step={5}
                                        onChange={v => setUiScale?.(v / 100)}
                                        format={v => `${v}%`}
                                    />
                                </Field>
                            )}

                            {/* "Show margin" used to sit here. It is an invoice-editor
                                concern, not a register one: margin is a costing decision
                                made while pricing a document, not something a cashier
                                toggles mid-queue -- and on a customer-facing till it
                                prints your cost price on a screen the customer can read.
                                Removed from the POS entirely. */}

                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={onRunSetupWizard}
                                    className="w-full h-10 rounded-xl border border-line bg-surface text-ink
                                               hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                >
                                    Run the setup guide again
                                </button>
                            </div>
                        </section>
                    )}

                    {/* ═══════════ SELLING ═══════════ */}
                    {tab === 'selling' && (
                        <>
                            <section className="space-y-2.5">
                                <Eyebrow>Fields on the sale</Eyebrow>

                                <Field
                                    title="Tax"
                                    hint="Turns on rates, the inclusive / exclusive switch and the tax line in the breakdown."
                                >
                                    <Toggle checked={enableTax} onChange={setEnableTax} label="Tax" />
                                </Field>

                                <Field
                                    title="Fulfilment"
                                    hint="Adds the local-stock / dropship choice to the sale."
                                >
                                    <Toggle checked={enableFulfilment} onChange={setEnableFulfilment} label="Fulfilment" />
                                </Field>

                                <Field
                                    title="Free / bonus quantity"
                                    hint="Adds a free-quantity control to the line that needs it, not a column to every line."
                                >
                                    <Toggle checked={enableFreeQty} onChange={setEnableFreeQty} label="Free or bonus quantity" />
                                </Field>
                            </section>

                            <section className="space-y-2.5">
                                <Eyebrow>Totals</Eyebrow>

                                <Field
                                    title="Round off totals"
                                    hint="Rounds the payable to the nearest whole unit and shows the adjustment in the breakdown."
                                >
                                    <Toggle checked={roundOff} onChange={setRoundOff} label="Round off totals" />
                                </Field>

                                <Field
                                    title="Auto-fill exact cash"
                                    hint="Pre-fills the tendered amount with the exact total, so a card or exact-cash sale is one tap."
                                >
                                    <Toggle checked={autoFillCash} onChange={setAutoFillCash} label="Auto-fill exact cash" />
                                </Field>

                                <Field
                                    title="Discount presets"
                                    hint="The quick percentages offered on the discount field. Tap one to remove it."
                                    stacked
                                >
                                    <div className="flex flex-wrap gap-1.5">
                                        {discountPresets.map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setDiscountPresets?.(discountPresets.filter(x => x !== p))}
                                                className="h-8 px-3 rounded-lg border border-line bg-sunken/60 text-2xs font-bold
                                                           text-ink hover:border-danger-400 hover:text-danger-600 transition-colors
                                                           cursor-pointer flex items-center gap-1.5
                                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                                title={`Remove ${p}%`}
                                            >
                                                <span className="vq-num">{p}%</span>
                                                <X size={11} className="opacity-50" />
                                            </button>
                                        ))}
                                        {[5, 10, 15, 20, 25, 50].filter(v => !discountPresets.includes(v)).map(v => (
                                            <button
                                                key={`add-${v}`}
                                                type="button"
                                                onClick={() => setDiscountPresets?.([...discountPresets, v].sort((a, b) => a - b))}
                                                className="h-8 px-3 rounded-lg border border-dashed border-line-strong text-2xs font-bold
                                                           text-ink-muted hover:text-brand-600 hover:border-brand-400 transition-colors
                                                           cursor-pointer flex items-center gap-1
                                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                                title={`Add ${v}%`}
                                            >
                                                <Plus size={11} /> <span className="vq-num">{v}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </section>

                            <section className="space-y-2.5">
                                <Eyebrow>Returns</Eyebrow>
                                <Field
                                    title="Return mode"
                                    hint="Switches this register to processing returns and refunds. The next completed document is a credit, not a sale."
                                    badge={
                                        <span className="text-3xs font-bold px-2 py-0.5 rounded-md bg-sunken text-ink-secondary uppercase tracking-wide">
                                            {returnPolicyLabel}
                                        </span>
                                    }
                                >
                                    <Toggle checked={returnMode} onChange={setReturnMode} label="Return mode" tone="danger" />
                                </Field>
                                <Note>
                                    The policy itself is a store setting, not a register one — change it
                                    in Settings → Point of sale so every till agrees.
                                </Note>
                            </section>
                        </>
                    )}

                    {/* ═══════════ HARDWARE ═══════════ */}
                    {tab === 'service' && (
                        <section className="space-y-2.5">
                            <Eyebrow>How this business serves</Eyebrow>
                            <p className="text-2xs text-ink-muted leading-relaxed max-w-[60ch]">
                                This is the one switch that changes what the register IS, rather than how it
                                looks. A counter till sells to whoever is standing there. A table service
                                register makes the TABLE the unit of work &mdash; the floor becomes the pane
                                the shift starts from, an order belongs to a table rather than to a queue,
                                and Hold disappears, because a table already is a held sale.
                            </p>

                            <Field title="Service style" hint="Both keeps the counter register and adds the floor beside it, for a cafe that does takeaway and tables." stacked>
                                <Segmented
                                    label="Service style"
                                    value={serviceMode}
                                    onChange={setServiceMode}
                                    options={[
                                        { value: 'counter', label: 'Counter' },
                                        { value: 'tables',  label: 'Table service' },
                                        { value: 'both',    label: 'Both' },
                                    ]}
                                />
                            </Field>

                            {serviceMode !== 'counter' && (
                                <Field
                                    title="Service charge"
                                    hint="Added to every table bill as a percentage of the food after discounts. It is the house's income and it is posted as such — a tip is not, and is typed per bill instead."
                                >
                                    <Stepper
                                        label="Service charge percent"
                                        value={Number(serviceCharge) || 0}
                                        min={0}
                                        max={25}
                                        onChange={setServiceCharge}
                                        format={v => (v ? `${v}%` : 'Off')}
                                    />
                                </Field>
                            )}

                            {serviceMode !== 'counter' && (
                                <Field
                                    title="Your floor"
                                    hint="Areas and tables. Nothing appears on the floor screen until it exists here — this is the only place tables come from."
                                >
                                    <button
                                        type="button"
                                        onClick={onOpenFloorPlan}
                                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-line
                                                   bg-surface text-ink text-sm font-bold shadow-xs
                                                   hover:border-brand-300 hover:text-brand-700 transition-colors cursor-pointer"
                                    >
                                        <LayoutGrid size={15} />
                                        Set up the floor plan
                                    </button>
                                </Field>
                            )}

                            {serviceMode !== 'counter' && terminal === 'counter' && (
                                <p className="text-2xs text-ink-muted leading-relaxed max-w-[60ch] pt-1">
                                    You are on the counter register. The floor is at
                                    <b className="text-ink"> Tables</b> in the sidebar.
                                </p>
                            )}
                        </section>
                    )}

                    {tab === 'hardware' && (
                        <>
                            <section className="space-y-2.5">
                                <Eyebrow>Status</Eyebrow>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl border border-line/80 bg-surface p-3 shadow-xs">
                                        <div className="flex items-center gap-2">
                                            {isOnline
                                                ? <Wifi size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                : <WifiOff size={14} className="text-danger-600 shrink-0" />}
                                            <span className="text-2xs font-bold text-ink">
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-3xs text-ink-muted leading-snug">
                                            {isOnline ? 'Sales post immediately.' : 'Sales are queued on this device.'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-line/80 bg-surface p-3 shadow-xs">
                                        <div className="flex items-center gap-2">
                                            <Printer size={14} className={isStationConnected ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-ink-faint shrink-0'} />
                                            <span className="text-2xs font-bold text-ink">
                                                {isStationConnected ? 'Station ready' : 'No station'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-3xs text-ink-muted leading-snug">
                                            {isStationConnected ? 'Printer and drawer reachable.' : 'Receipts print through the browser.'}
                                        </p>
                                    </div>
                                </div>
                                {pendingCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={onOpenSyncHub}
                                        className="w-full rounded-xl border border-amber-300 dark:border-amber-900/60
                                                   bg-amber-50 dark:bg-amber-950/25 px-3.5 py-2.5 text-left
                                                   hover:border-amber-400 transition-colors cursor-pointer
                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                    >
                                        <span className="text-2xs font-bold text-amber-800 dark:text-amber-300">
                                            <span className="vq-num">{pendingCount}</span> sale{pendingCount === 1 ? '' : 's'} waiting to sync
                                        </span>
                                        <span className="block text-3xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                                            Open the sync hub to retry, recall or discard them.
                                        </span>
                                    </button>
                                )}
                            </section>

                            <section className="space-y-2.5">
                                <Eyebrow>Printing &amp; drawer</Eyebrow>
                                <Field
                                    title="Auto-print receipt"
                                    hint="Prints the customer receipt the moment a sale completes, without a second confirmation."
                                >
                                    <Toggle checked={printOnComplete} onChange={setPrintOnComplete} label="Auto-print receipt" tone="success" />
                                </Field>
                                <Field
                                    title="Open drawer on a cash sale"
                                    hint="Pulses the cash drawer automatically when the tender is cash."
                                >
                                    <Toggle checked={openDrawerOnCash} onChange={setOpenDrawerOnCash} label="Open drawer on a cash sale" tone="success" />
                                </Field>
                            </section>

                            <section className="space-y-2.5">
                                <Eyebrow>Run now</Eyebrow>
                                {[
                                    { icon: Unlock,  label: 'Open cash drawer', sub: 'Sends one pulse \u00b7 Ctrl + D', on: onOpenCashDrawer },
                                    { icon: Pause,   label: 'Parked sales',     sub: `${parkedCount} on hold`, on: onOpenParked },
                                    { icon: History, label: 'Recent invoices',  sub: 'View and reprint', on: onOpenRecent },
                                ].map(a => {
                                    const Icon = a.icon;
                                    return (
                                        <button
                                            key={a.label}
                                            type="button"
                                            onClick={a.on}
                                            className="w-full rounded-xl border border-line/80 bg-surface p-3
                                                       hover:border-line-strong hover:shadow-xs transition-all cursor-pointer
                                                       flex items-center gap-3 text-left
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                        >
                                            <span className="w-9 h-9 rounded-lg bg-sunken/70 border border-line/70 text-ink-secondary
                                                             flex items-center justify-center shrink-0">
                                                <Icon size={15} />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block vq-clip text-xs font-bold text-ink">{a.label}</span>
                                                <span className="block vq-clip text-3xs text-ink-muted">{a.sub}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </section>
                        </>
                    )}

                    {/* ═══════════ KEYS ═══════════ */}
                    {tab === 'keys' && (
                        <section className="space-y-2.5">
                            <Eyebrow>Keyboard</Eyebrow>
                            <Note>
                                The map is scoped to the working surface and suspends itself while
                                you are typing in a field or a sheet, so an F-key never fires from
                                inside an input.
                            </Note>
                            <div className="rounded-xl border border-line/80 bg-surface divide-y divide-line/60 overflow-hidden">
                                {POS_KEYMAP.map(([k, desc]) => (
                                    <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2">
                                        <kbd className="px-2 py-1 rounded-md bg-sunken border border-line text-3xs
                                                        font-mono font-bold text-brand-700 dark:text-brand-300 shrink-0">
                                            {k}
                                        </kbd>
                                        <span className="vq-clip text-2xs font-semibold text-ink-secondary text-right min-w-0">
                                            {desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    </div>

                    {/* ── THE PREVIEW ──
                        Driven by composeTerminal, not by a switch over preset
                        names, so it cannot draw a layout the law would refuse --
                        and it shows the DEMOTIONS, which is the whole reason the
                        old hand-drawn preview was worse than useless: it drew a
                        catalog column on a screen that could never carry one. */}
                    <aside className="shrink-0 lg:w-[356px] border-t lg:border-t-0 lg:border-l border-line
                                      bg-surface overflow-y-auto overscroll-contain p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <Eyebrow>Preview</Eyebrow>
                            <span className="vq-num text-3xs font-bold text-ink-muted">
                                {device.vw}&times;{device.vh}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70">
                            {PREVIEW_DEVICES.map(d => (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setDeviceId(d.id)}
                                    aria-pressed={deviceId === d.id}
                                    className={`flex-1 min-w-[64px] h-8 rounded-lg text-3xs font-bold transition-all
                                                cursor-pointer whitespace-nowrap
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                ${deviceId === d.id
                                                    ? 'bg-surface text-brand-700 dark:text-brand-300 shadow-xs border border-brand-500/30'
                                                    : 'text-ink-muted hover:text-ink border border-transparent'}`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        <RegisterPreview
                            comp={comp}
                            device={device}
                            senior={seniorMode}
                            scale={uiScale}
                            rail={showRail}
                        />

                        {/* A legend, so the blocks are readable without guessing. */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {[['Catalog', 'bg-sky-300 dark:bg-sky-700'],
                              ['Cart', 'bg-emerald-300 dark:bg-emerald-700'],
                              ['Payment', 'bg-amber-300 dark:bg-amber-700'],
                              ...(terminal === 'table' ? [['Floor', 'bg-brand-300 dark:bg-brand-700']] : [])].map(([l, c]) => (
                                <span key={l} className="flex items-center gap-1.5 text-3xs font-bold text-ink-muted">
                                    <span className={`w-2.5 h-2.5 rounded-sm ${c}`} /> {l}
                                </span>
                            ))}
                        </div>

                        {/* The wish is in the controls; this is the result on the
                            screen the register is actually standing on. */}
                        {resolved && (
                            <>
                                <Eyebrow className="pt-1">On this screen, right now</Eyebrow>
                                <div className="rounded-xl border border-line/80 bg-sunken/40 divide-y divide-line/60 overflow-hidden">
                                    {resolved.map(([k, v]) => (
                                        <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-2">
                                            <span className="text-3xs font-bold text-ink-muted shrink-0">{k}</span>
                                            <span className="vq-num vq-clip text-3xs font-bold text-ink text-right">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {notes.map((n, i) => (
                            <Note key={i} tone="warn" icon={AlertTriangle}>{n}</Note>
                        ))}
                    </aside>
                </div>

                {/* ── FOOTER ── */}
                <footer className="shrink-0 border-t border-line bg-surface px-4 sm:px-5 py-3
                                   flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onResetAll}
                        className="h-10 px-3.5 rounded-xl border border-line bg-surface text-ink-muted
                                   hover:text-danger-600 hover:border-danger-300 text-2xs font-bold
                                   transition-colors cursor-pointer shrink-0
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                        Reset all
                    </button>
                    {/* Said out loud, because a Done button next to live controls
                        implies the changes are waiting on it. They are not. */}
                    <span className="hidden sm:block flex-1 text-3xs text-ink-muted">
                        Every change here applies immediately. Nothing waits for Done.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto sm:ml-0 h-10 px-8 rounded-xl bg-brand-600 hover:bg-brand-700 text-white
                                   text-xs font-bold transition-colors cursor-pointer shrink-0
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
}
