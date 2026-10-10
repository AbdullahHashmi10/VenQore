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
 * THE REGISTER IS A COUNTER, AND ONLY A COUNTER
 * ---------------------------------------------
 * Tables, takeaway tickets, delivery and the floor plan live in Front of
 * House, not here. This wizard therefore never asks how people are served
 * and never writes `service_mode`: a restaurant that finishes it must not
 * have its floor switched off as a side effect. Two steps: what kind of
 * counter, then the handful of preferences counters change first.
 *
 * WHAT IS LOCAL AND WHAT IS STORE-WIDE
 * ------------------------------------
 * Layout and the four preferences are THIS device's (localStorage, via
 * `onApply`). Kitchen preparation is the BUSINESS's — a row in `settings`
 * shared by every till. It goes to the server, it can fail, and the wizard
 * reports it rather than closing over a silent 403.
 */

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
    Store, Zap, Coffee, Type, ChefHat,
    Check, ArrowRight, ArrowLeft, X, Loader2,
} from 'lucide-react';
import { BUSINESS_SUGGESTIONS, DEFAULT_OPS, DEFAULTS } from './settings';
import { presetComposition } from '@/LayoutLaw/engine';
import LayoutPreviewShell from './LayoutPreviewShell';

/* Icons, by counter type. Mapped here rather than stored on the suggestion,
   because an icon is a rendering decision and settings.js is a data file. */
const ICONS = {
    retail: Store,
    scan: Zap,
    visual: Coffee,
    simple: Type,
};

/* What kind of counter this business almost certainly runs, from what they
   told the builder they are. A suggestion and never a decision: it is the card
   that gets the badge, not the card that gets chosen for them. */
function recommendFor(store) {
    const raw = `${store?.business_type || ''} ${store?.industry || ''} ${store?.name || ''}`.toLowerCase();

    if (/cafe|café|coffee|tea.?shop|chai|bistro|lounge|restaurant|dine.?in|dhaba|eatery|diner|fast.?food|burger|pizza|shawarma|broast|fried.?chicken|biryani|food.?truck|kiosk|juice|dessert|ice.?cream|bakery|sweets|catering/.test(raw)) {
        return { counter: 'visual', prepares: true };
    }
    if (/pharmac|medical|chemist|hardware|wholesal|distribut/.test(raw)) {
        return { counter: 'scan', prepares: false };
    }
    return { counter: 'retail', prepares: false };
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
    /* Kitchen preparation is store-wide and gated on `admin.settings_manage`.
       Without it the toggle is not shown at all — offering a cashier a switch
       that 403s on submit is worse than not offering it. */
    canManageStore = false,
    onDone,
}) {
    const suggestion = useMemo(() => recommendFor(store), [store]);

    /* Hooks run unconditionally — the early `if (!open) return null` this file
       used to open with sat ABOVE the useState calls, which is a hooks-order
       violation React only forgives because the component happened to unmount
       rather than re-render when it closed. */
    const [preparesOrders, setPreparesOrders] = useState(() => {
        if (settings?.prepares_orders !== undefined) {
            return String(settings.prepares_orders) === '1';
        }
        return ['restaurant', 'cafe', 'bakery', 'food_counter', 'catering'].includes(store?.business_type) || suggestion.prepares;
    });
    const [selectedOptionId, setSelectedOptionId] = useState(() => {
        const match = BUSINESS_SUGGESTIONS.find(b => b.id === currentPrefs?.profile);
        return match ? match.id : suggestion.counter;
    });

    const [seniorMode, setSeniorMode] = useState(Boolean(currentPrefs?.ops?.senior));
    const [autoPrint, setAutoPrint] = useState(currentPrefs?.ops?.autoPrint ?? true);
    const [navRail, setNavRail] = useState(currentPrefs?.rail ?? false);
    const [autoFillCash, setAutoFillCash] = useState(currentPrefs?.ops?.autoFillCash ?? true);

    const [stepIdx, setStepIdx] = useState(0);
    const [saving, setSaving] = useState(false);
    const [problems, setProblems] = useState([]);

    /* THE PATH. Everything that shows progress reads from this, so a
       hard-coded "of 2" can never disagree with it. */
    const steps = ['counter', 'prefs'];

    if (!open) return null;

    const step = steps[Math.min(stepIdx, steps.length - 1)];
    const isLast = stepIdx >= steps.length - 1;

    const activeSuggestion = BUSINESS_SUGGESTIONS.find(b => b.id === selectedOptionId) || BUSINESS_SUGGESTIONS[0];
    const activePreset = activeSuggestion.preset || 'column';

    const handleSelectOption = (optId) => {
        setSelectedOptionId(optId);
        /* The "simple counter" answer is not a layout choice, it is a
           legibility one — so it brings its two settings with it rather than
           leaving the operator to find them. */
        if (optId === 'simple') { setSeniorMode(true); setAutoFillCash(true); }
    };

    const finish = async () => {
        setSaving(true);
        setProblems([]);
        const failed = [];
        const slug = store?.slug;
        const r = (name) => route(name, { store_slug: slug });

        /* Store-wide first. A failure here is REPORTED and the local half still
           applies, because a cashier whose layout silently reverted will simply
           run the wizard again and hit the same wall. */
        if (canManageStore && slug) {
            try {
                await axios.post(r('store.tables.prepares-orders'), {
                    prepares_orders: preparesOrders ? '1' : '0',
                });
            } catch (_) {
                failed.push('Kitchen preparation setting could not be saved.');
            }
        }

        /* This device's half. Always applied — it cannot fail and it is what
           the operator sees the instant the wizard closes. */
        onApply?.({
            ...currentPrefs,
            wizardCompleted: true,
            auto: true,
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

        onDone?.({});
        onClose?.();
    };

    const HEADINGS = {
        counter: {
            t: 'What kind of counter is this?',
            s: 'This picks a starting layout. Every part of it can be changed afterwards, and none of it is locked in.',
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

                    {step === 'counter' && (
                        <>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {BUSINESS_SUGGESTIONS.map(sug => (
                                    <PickCard
                                        key={sug.id}
                                        icon={ICONS[sug.id] || Store}
                                        title={sug.title}
                                        desc={sug.desc}
                                        meta={`${sug.preset} layout`}
                                        selected={sug.id === selectedOptionId}
                                        recommended={sug.id === suggestion.counter}
                                        onClick={() => handleSelectOption(sug.id)}
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
                                            This shop prepares orders before handing them over (enables kitchen order tickets and the KDS queue).
                                        </p>
                                    </div>
                                    <Toggle checked={preparesOrders} onChange={setPreparesOrders} label="Kitchen preparation" />
                                </div>
                            )}
                        </>
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
