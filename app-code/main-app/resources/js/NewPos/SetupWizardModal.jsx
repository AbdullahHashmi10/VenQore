/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  SetupWizardModal — the first thing a new register asks                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Shown once, on a register that has never been configured. Everything it sets
 * is also in the settings drawer, and it says so — a wizard whose choices
 * cannot be revisited is a trap, and one that pretends its choices are
 * permanent makes people agonise over them.
 *
 * WHY SERVICE STYLE IS NOW THE FIRST QUESTION
 * -------------------------------------------
 * It used to not be asked at all. `service_mode` lived only in the settings
 * drawer, which meant a restaurant installed the product, got a counter till,
 * and had no reason to believe the thing had a floor plan in it. The feature
 * was complete and undiscoverable, which is the same as missing.
 *
 * It goes first because it is the only answer that changes the SHAPE of every
 * question after it — a counter till is never asked about takeaway lanes or
 * how many tables are in the room, and a dine-in room should not have to work
 * out which of five counter layouts it wants before it can say "we have
 * twelve tables".
 *
 * WHY THE STEPS ARE A LIST AND NOT A NUMBER
 * -----------------------------------------
 * The previous version hard-coded "Step 1 of 2" and a two-segment progress
 * bar. The path through this now depends on the first answer and on whether
 * the person at the till is allowed to change store-wide settings, so the step
 * list is computed and everything that displays progress reads from it. A
 * cashier without `admin.settings_manage` sees two steps and is never shown a
 * floor builder that would 403 on submit.
 *
 * WHAT IS LOCAL AND WHAT IS STORE-WIDE
 * ------------------------------------
 * Layout and the four preferences are THIS device's (localStorage, via
 * `onApply`). Service style, lanes and the floor are the BUSINESS's — rows in
 * `settings` and `positions`, shared by every till in the building. They go to
 * the server, they can fail, and the wizard reports it rather than closing
 * over a silent 403.
 */

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
    Store, Zap, Coffee, Type, UtensilsCrossed, ChefHat,
    Check, ArrowRight, ArrowLeft, X, Monitor, LayoutGrid,
    ShoppingBag, Bike, Loader2, AlertTriangle,
} from 'lucide-react';
import { BUSINESS_SUGGESTIONS, DEFAULT_OPS, DEFAULTS } from './settings';
import { presetComposition } from '@/LayoutLaw/engine';
import LayoutPreviewShell from './LayoutPreviewShell';
import { QuickFloorSetup, applyQuickFloor, DEFAULT_FLOOR } from '@/Pos/Table/QuickFloorSetup';

/* Icons, by counter type. Mapped here rather than stored on the suggestion,
   because an icon is a rendering decision and settings.js is a data file. */
const ICONS = {
    retail: Store,
    scan: Zap,
    visual: Coffee,
    simple: Type,
    table: UtensilsCrossed,
};

/* The three service styles. `tables` is the server's spelling — the endpoint
   validates in:counter,tables,both — and getting it wrong here is a 422 that
   looks like the switch did nothing. */
const SERVICE_OPTIONS = [
    {
        id: 'counter',
        icon: Monitor,
        title: 'Counter service',
        desc: 'One queue, one till. The customer orders and pays in the same moment, and nothing is held open.',
        fits: 'Retail, pharmacy, grocery, takeaway counters',
    },
    {
        id: 'tables',
        icon: UtensilsCrossed,
        title: 'Table service',
        desc: 'The table is the unit of work, not the sale. Orders stay open, get added to, move, split, and settle at the end.',
        fits: 'Dine-in restaurants, salons, clinics, workshops',
    },
    {
        id: 'both',
        icon: LayoutGrid,
        title: 'Both',
        desc: 'A floor for the people sitting down and a counter for everyone else, on the same register.',
        fits: 'Cafés, casual dining, anywhere with a pickup counter',
    },
];

/* What this kind of business almost certainly wants, from what they told the
   builder they are. A suggestion and never a decision: it is the card that
   gets the badge, not the card that gets chosen for them. */
function recommendFor(store) {
    const raw = `${store?.business_type || ''} ${store?.industry || ''} ${store?.name || ''}`.toLowerCase();

    if (/restaurant|dine.?in|dhaba|eatery|diner|steakhouse|buffet|salon|barber|spa|clinic/.test(raw)) {
        return { service: 'tables', takeaway: true, delivery: false, counter: 'table' };
    }
    if (/cafe|café|coffee|tea.?shop|chai|bistro|lounge/.test(raw)) {
        return { service: 'both', takeaway: true, delivery: false, counter: 'visual' };
    }
    if (/fast.?food|burger|pizza|shawarma|broast|fried.?chicken|biryani|food.?truck|kiosk|juice|dessert|ice.?cream|bakery|sweets|catering/.test(raw)) {
        return { service: 'counter', takeaway: true, delivery: true, counter: 'visual' };
    }
    if (/pharmac|medical|chemist|hardware|wholesal|distribut/.test(raw)) {
        return { service: 'counter', takeaway: false, delivery: false, counter: 'scan' };
    }
    return { service: 'counter', takeaway: false, delivery: false, counter: 'retail' };
}

function Toggle({ checked, onChange, label, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        disabled:opacity-50 disabled:cursor-default
                        ${checked ? 'bg-brand-600' : 'bg-line-strong'}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                              transition-[left,right] duration-fast ${checked ? 'right-0.5' : 'left-0.5'}`} />
        </button>
    );
}

/* A big pickable card. Used by both card steps so the two cannot drift into
   being two different controls that do the same thing. */
function PickCard({ icon: Icon, title, desc, meta, selected, recommended, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer
                        flex flex-col gap-2.5 h-full
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        ${selected
                            ? 'border-brand-500/50 bg-brand-50/60 dark:bg-brand-950/30 shadow-xs'
                            : 'border-line/80 bg-surface hover:border-line-strong hover:shadow-xs'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                                  ${selected
                                    ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border-brand-300/60'
                                    : 'bg-sunken/70 text-ink-secondary border-line/70'}`}>
                    <Icon size={18} />
                </span>
                {recommended && (
                    <span className="text-3xs font-bold uppercase tracking-wide px-2 py-1 rounded-lg
                                     bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400
                                     border border-emerald-200/70 dark:border-emerald-900/60">
                        Suggested
                    </span>
                )}
            </div>
            <span className="block text-sm font-bold text-ink leading-snug">{title}</span>
            <span className="block text-2xs text-ink-muted leading-relaxed flex-1">{desc}</span>
            <span className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                <span className="text-3xs font-bold text-ink-muted uppercase tracking-wide truncate">{meta}</span>
                {selected && (
                    <span className="flex items-center gap-1 text-3xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                        <Check size={12} /> Selected
                    </span>
                )}
            </span>
        </button>
    );
}

export default function SetupWizardModal({
    open,
    onClose,
    onApply,
    currentPrefs = DEFAULTS,
    store = null,
    settings = null,
    /* Service style, lanes and the floor are store-wide and gated on
       `admin.settings_manage`. Without it those steps are not shown at all —
       offering a cashier a floor builder that 403s on submit is worse than
       not offering it. */
    canManageStore = false,
    onDone,
}) {
    const suggestion = useMemo(() => recommendFor(store), [store]);

    /* Hooks run unconditionally — the early `if (!open) return null` this file
       used to open with sat ABOVE the useState calls, which is a hooks-order
       violation React only forgives because the component happened to unmount
       rather than re-render when it closed. */
    const [service, setService] = useState(
        () => settings?.service_mode || suggestion.service,
    );
    const [preparesOrders, setPreparesOrders] = useState(() => {
        if (settings?.prepares_orders !== undefined) {
            return String(settings.prepares_orders) === '1';
        }
        return ['restaurant', 'cafe', 'bakery', 'food_counter', 'catering'].includes(store?.business_type) || suggestion.service !== 'counter';
    });
    const [selectedOptionId, setSelectedOptionId] = useState(() => {
        const match = BUSINESS_SUGGESTIONS.find(b => b.id === currentPrefs?.profile);
        return match ? match.id : suggestion.counter;
    });
    const [lanes, setLanes] = useState(() => ({
        takeaway: settings?.lane_takeaway !== undefined
            ? String(settings.lane_takeaway) === '1' : suggestion.takeaway,
        delivery: settings?.lane_delivery !== undefined
            ? String(settings.lane_delivery) === '1' : suggestion.delivery,
    }));
    const [floor, setFloor] = useState(DEFAULT_FLOOR);
    const [makeFloor, setMakeFloor] = useState(true);

    const [seniorMode, setSeniorMode] = useState(Boolean(currentPrefs?.ops?.senior));
    const [autoPrint, setAutoPrint] = useState(currentPrefs?.ops?.autoPrint ?? true);
    const [navRail, setNavRail] = useState(currentPrefs?.rail ?? false);
    const [autoFillCash, setAutoFillCash] = useState(currentPrefs?.ops?.autoFillCash ?? true);

    const [stepIdx, setStepIdx] = useState(0);
    const [saving, setSaving] = useState(false);
    const [problems, setProblems] = useState([]);

    /* THE PATH, computed from the first answer. Everything that shows progress
       reads from this, so a hard-coded "of 2" can never disagree with it. */
    const steps = useMemo(() => {
        const out = ['service', 'counter'];
        if (service !== 'counter' && canManageStore) out.push('lanes', 'floor');
        else if (service !== 'counter') out.push('lanes');
        out.push('prefs');
        return out;
    }, [service, canManageStore]);

    if (!open) return null;

    const step = steps[Math.min(stepIdx, steps.length - 1)];
    const isLast = stepIdx >= steps.length - 1;
    const tableish = service !== 'counter';

    const activeSuggestion = BUSINESS_SUGGESTIONS.find(b => b.id === selectedOptionId) || BUSINESS_SUGGESTIONS[0];
    const activePreset = activeSuggestion.preset || 'column';

    const handleSelectOption = (optId) => {
        setSelectedOptionId(optId);
        /* The "simple counter" answer is not a layout choice, it is a
           legibility one — so it brings its two settings with it rather than
           leaving the operator to find them. */
        if (optId === 'simple') { setSeniorMode(true); setAutoFillCash(true); }
    };

    /* Picking table service moves the layout with it unless the operator has
       already picked one deliberately. A floor pane needs the table preset;
       leaving it on `column` is how the previous build ended up with a table
       terminal that had nowhere to draw the floor. */
    const handleSelectService = (id) => {
        setService(id);
        if (id !== 'counter' && selectedOptionId !== 'table') setSelectedOptionId('table');
        if (id === 'counter' && selectedOptionId === 'table') setSelectedOptionId(suggestion.counter);
        if (id !== 'counter') setPreparesOrders(true);
    };

    const finish = async () => {
        setSaving(true);
        setProblems([]);
        const failed = [];
        const slug = store?.slug;
        const r = (name) => route(name, { store_slug: slug });

        /* Store-wide first. If the service style does not land there is no
           point creating tables for a floor nobody will be shown — but a
           failure here is REPORTED and the local half still applies, because a
           cashier whose layout silently reverted will simply run the wizard
           again and hit the same wall. */
        if (canManageStore && slug) {
            try {
                await axios.post(r('store.tables.service-mode'), { mode: service });
            } catch (e) {
                failed.push(e?.response?.status === 403
                    ? 'Service style needs permission to change store settings.'
                    : 'The service style could not be saved.');
            }

            try {
                await axios.post(r('store.tables.prepares-orders'), {
                    prepares_orders: preparesOrders ? '1' : '0',
                });
            } catch (_) {
                failed.push('Kitchen preparation setting could not be saved.');
            }

            if (tableish) {
                try {
                    await axios.post(r('store.tables.plan.lanes'), {
                        takeaway: Boolean(lanes.takeaway),
                        delivery: Boolean(lanes.delivery),
                    });
                } catch (_) {
                    failed.push('Takeaway and delivery lanes could not be saved.');
                }

                if (makeFloor) {
                    try {
                        await applyQuickFloor(slug, floor);
                    } catch (e) {
                        failed.push(e?.response?.data?.message || 'The tables could not be created.');
                    }
                }
            }
        }

        /* This device's half. Always applied — it cannot fail and it is what
           the operator sees the instant the wizard closes. */
        onApply?.({
            ...currentPrefs,
            wizardCompleted: true,
            auto: activeSuggestion.id !== 'table',
            profile: activeSuggestion.profile || 'retail',
            preset: activePreset,
            comp: presetComposition(activePreset),
            rail: navRail,
            ops: {
                ...(currentPrefs?.ops || DEFAULT_OPS),
                ...(activeSuggestion.ops || {}),
                senior: seniorMode,
                autoPrint,
                autoFillCash,
            },
        });

        setSaving(false);

        if (failed.length) { setProblems(failed); return; }

        onDone?.({ service, lanes, floor: makeFloor ? floor : null });
        onClose?.();
    };

    const HEADINGS = {
        service: {
            t: 'How does this place serve people?',
            s: 'This is the one answer that changes the shape of the register. Everything after it follows from here, and all of it can be changed later.',
        },
        counter: {
            t: tableish ? 'And what should the till itself look like?' : 'What kind of counter is this?',
            s: 'This picks a starting layout. Every part of it can be changed afterwards, and none of it is locked in.',
        },
        lanes: {
            t: 'Besides sitting down, how else do orders arrive?',
            s: 'Each one you turn on becomes a tab on the floor screen. A dine-in-only room never sees a Takeaway tab.',
        },
        floor: {
            t: 'How many tables are in the room?',
            s: 'Enough to take an order today. The full Floor Plan is where the room gets its real shape — zones, seat maps, table shapes — whenever you want it.',
        },
        prefs: {
            t: 'Four things worth setting now',
            s: 'A preview of the register you are about to get, and the settings most counters change first.',
        },
    };

    return (
        <div
            className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink/50 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Set up this register"
        >
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-[860px] border border-line/80
                            flex flex-col max-h-[92vh] overflow-hidden">

                {/* ── HEADER ── */}
                <header className="shrink-0 px-6 pt-5 pb-4 border-b border-line bg-surface">
                    <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                            <span className="text-3xs font-bold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                                Step {stepIdx + 1} of {steps.length}
                            </span>
                            <h2 className="mt-1 text-lg font-bold text-ink leading-tight">
                                {HEADINGS[step].t}
                            </h2>
                            <p className="mt-1 text-xs text-ink-muted leading-relaxed max-w-[62ch]">
                                {HEADINGS[step].s}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl border border-line bg-surface text-ink-muted
                                       hover:bg-interactive-hover hover:text-ink flex items-center justify-center
                                       transition-colors shrink-0 cursor-pointer
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            aria-label="Skip setup"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Progress. One segment per step in the computed path. */}
                    <div className="mt-4 flex gap-1.5" aria-hidden="true">
                        {steps.map((s, n) => (
                            <span
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-colors
                                            ${n <= stepIdx ? 'bg-brand-600' : 'bg-line'}`}
                            />
                        ))}
                    </div>
                </header>

                {/* ── BODY ── */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">

                    {step === 'service' && (
                        <>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {SERVICE_OPTIONS.map(o => (
                                    <PickCard
                                        key={o.id}
                                        icon={o.icon}
                                        title={o.title}
                                        desc={o.desc}
                                        meta={o.fits}
                                        selected={o.id === service}
                                        recommended={o.id === suggestion.service}
                                        onClick={() => handleSelectService(o.id)}
                                    />
                                ))}
                            </div>
                            {canManageStore && (
                                <div className="mt-4 p-3.5 rounded-xl border border-line bg-surface flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                                            <ChefHat size={14} className="text-amber-600 shrink-0" />
                                            <span>Kitchen preparation</span>
                                        </div>
                                        <p className="text-2xs text-ink-muted mt-0.5">
                                            This shop prepares orders before handing them over (enables kitchen order tickets and KDS queue).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={preparesOrders}
                                        onClick={() => setPreparesOrders(!preparesOrders)}
                                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                                            preparesOrders ? 'bg-amber-600' : 'bg-line'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-xs ${
                                                preparesOrders ? 'left-6' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            )}
                            {!canManageStore && service !== 'counter' && (
                                <p className="mt-4 rounded-xl border border-amber-200/70 dark:border-amber-900/60
                                              bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3
                                              text-2xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    <AlertTriangle size={13} className="inline -mt-0.5 mr-1.5" />
                                    Service style is a store-wide setting, and this account cannot change
                                    store settings. The layout below will still be set for this device — ask
                                    an owner or manager to switch the store to table service.
                                </p>
                            )}
                        </>
                    )}

                    {step === 'counter' && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {BUSINESS_SUGGESTIONS
                                /* A counter-only shop is never offered the table
                                   layout: it has no floor to draw. */
                                .filter(sug => tableish || sug.id !== 'table')
                                .map(sug => (
                                    <PickCard
                                        key={sug.id}
                                        icon={ICONS[sug.id] || Store}
                                        title={sug.title}
                                        desc={sug.desc}
                                        meta={`${sug.preset} layout`}
                                        selected={sug.id === selectedOptionId}
                                        recommended={sug.id === (tableish ? 'table' : suggestion.counter)}
                                        onClick={() => handleSelectOption(sug.id)}
                                    />
                                ))}
                        </div>
                    )}

                    {step === 'lanes' && (
                        <div className="space-y-2.5 max-w-[560px]">
                            {[
                                { key: 'dine', icon: UtensilsCrossed, title: 'Dine-in',
                                  hint: 'Always on for table service — it is what the floor plan is.',
                                  value: true, locked: true },
                                { key: 'takeaway', icon: ShoppingBag, title: 'Takeaway',
                                  hint: 'A bag on the counter: an open bill with a ticket number and no table.',
                                  value: lanes.takeaway,
                                  set: (v) => setLanes(l => ({ ...l, takeaway: v })) },
                                { key: 'delivery', icon: Bike, title: 'Delivery',
                                  hint: 'Adds the address, the instructions, the fare, the rider and the on-the-way clock.',
                                  value: lanes.delivery,
                                  set: (v) => setLanes(l => ({ ...l, delivery: v })) },
                            ].map(l => (
                                <div key={l.key}
                                     className="rounded-xl border border-line/80 bg-surface shadow-xs p-3.5
                                                flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-xl bg-sunken/70 border border-line/70
                                                         text-ink-secondary flex items-center justify-center shrink-0">
                                            <l.icon size={16} />
                                        </span>
                                        <div className="min-w-0 space-y-1">
                                            <span className="block text-sm font-bold text-ink leading-tight">{l.title}</span>
                                            <p className="text-2xs text-ink-muted leading-relaxed">{l.hint}</p>
                                        </div>
                                    </div>
                                    <Toggle checked={l.value} onChange={l.set || (() => {})}
                                            label={l.title} disabled={l.locked} />
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'floor' && (
                        <div className="max-w-[620px] space-y-4">
                            <label className="rounded-xl border border-line/80 bg-surface shadow-xs p-3.5
                                              flex items-start justify-between gap-3 cursor-pointer">
                                <div className="min-w-0 space-y-1">
                                    <span className="block text-sm font-bold text-ink leading-tight">
                                        Create tables now
                                    </span>
                                    <p className="text-2xs text-ink-muted leading-relaxed">
                                        Off if the floor is already built, or if you would rather lay it out
                                        properly in the Floor Plan first.
                                    </p>
                                </div>
                                <Toggle checked={makeFloor} onChange={setMakeFloor} label="Create tables now" />
                            </label>

                            {makeFloor && (
                                <QuickFloorSetup
                                    value={floor}
                                    onChange={setFloor}
                                    storeSlug={store?.slug}
                                />
                            )}
                        </div>
                    )}

                    {step === 'prefs' && (
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                            <div className="min-w-0 space-y-2.5">
                                <span className="text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                                    Preview
                                </span>
                                <div className="rounded-2xl border border-line/80 bg-sunken/40 p-3 overflow-hidden">
                                    <LayoutPreviewShell
                                        preset={activePreset}
                                        rail={navRail}
                                        senior={seniorMode}
                                        className="w-full"
                                    />
                                </div>
                                <p className="text-2xs text-ink-muted leading-relaxed">
                                    {activeSuggestion.title} · <b className="text-ink-secondary">{activePreset}</b> layout.
                                    The real register re-measures itself against this screen, so what you get
                                    adapts where this sketch cannot.
                                </p>
                            </div>

                            <div className="min-w-0 space-y-2.5">
                                <span className="text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                                    Preferences
                                </span>
                                {[
                                    { key: 'senior', title: 'Large text mode',
                                      hint: 'Raises every type ramp and touch target for a counter read at arm’s length.',
                                      value: seniorMode, set: setSeniorMode },
                                    { key: 'rail', title: 'Navigation rail',
                                      hint: 'Keeps the app’s side navigation on screen. Off gives the register 72px more.',
                                      value: navRail, set: setNavRail },
                                    { key: 'print', title: 'Auto-print receipt',
                                      hint: 'Prints the moment a sale completes, without a second confirmation.',
                                      value: autoPrint, set: setAutoPrint },
                                    { key: 'cash', title: 'Auto-fill exact cash',
                                      hint: 'Pre-fills the tendered amount, so an exact-cash or card sale is one tap.',
                                      value: autoFillCash, set: setAutoFillCash },
                                ].map(pf => (
                                    <div key={pf.key}
                                         className="rounded-xl border border-line/80 bg-surface shadow-xs p-3.5
                                                    flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <span className="block text-sm font-bold text-ink leading-tight">{pf.title}</span>
                                            <p className="text-2xs text-ink-muted leading-relaxed">{pf.hint}</p>
                                        </div>
                                        <Toggle checked={pf.value} onChange={pf.set} label={pf.title} />
                                    </div>
                                ))}
                                <div className="rounded-xl border border-line/70 bg-sunken/60 px-3.5 py-3">
                                    <p className="text-2xs text-ink-secondary leading-relaxed">
                                        All of this, and everything else, lives behind the settings button in
                                        the register’s top bar — or <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold">Alt</kbd>
                                        {' + '}
                                        <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold">L</kbd>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {problems.length > 0 && (
                        <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-3" role="alert">
                            <p className="text-2xs font-bold text-danger mb-1">
                                The register is set up, but some store-wide settings did not save:
                            </p>
                            <ul className="text-2xs text-danger/90 leading-relaxed list-disc pl-4">
                                {problems.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <footer className="shrink-0 px-6 py-4 border-t border-line bg-sunken/40 flex items-center gap-2">
                    {stepIdx === 0 ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-4 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink
                                       hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        >
                            Skip for now
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setStepIdx(i => Math.max(0, i - 1))}
                            className="h-11 px-4 rounded-xl border border-line bg-surface text-ink
                                       hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer
                                       flex items-center gap-2
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        >
                            <ArrowLeft size={15} /> Back
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => (isLast ? finish() : setStepIdx(i => i + 1))}
                        className="ml-auto h-11 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white
                                   text-xs font-bold transition-colors cursor-pointer flex items-center gap-2
                                   disabled:opacity-60 disabled:cursor-default
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {isLast ? 'Start selling' : <>Continue <ArrowRight size={15} /></>}
                    </button>
                </footer>
            </div>
        </div>
    );
}
