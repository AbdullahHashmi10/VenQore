/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  SetupWizardModal — the first thing a new register asks                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Shown once, on a register that has never been configured. Two steps: what
 * kind of counter is this, and four preferences worth asking about before the
 * first sale. Everything it sets is also in the settings drawer, and it says
 * so — a wizard whose choices cannot be revisited is a trap, and one that
 * pretends its choices are permanent makes people agonise over them.
 *
 * REDRAWN, AND WHY
 * ----------------
 * The previous version was a second design system living inside the first: its
 * own `nqp-*` stylesheet, emoji as iconography (🛍️ ⚡ ☕ ✨ 💡 🤖), sentences
 * like "🤖 Auto Mode (Recommended)", and native checkboxes that matched nothing
 * else in the product. On the screen where a business hands over money, that
 * reads as unfinished. This is the V6 token layer, the same primitives as the
 * settings drawer, and no decoration that is not carrying information.
 *
 * It writes into the SAME prefs shape the register already understands, so
 * there is still exactly one settings model behind all of it.
 */

import React, { useMemo, useState } from 'react';
import {
    Store, Zap, Coffee, Type, UtensilsCrossed,
    Check, ArrowRight, ArrowLeft, X,
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
    table: UtensilsCrossed,
};

function Toggle({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        ${checked ? 'bg-brand-600' : 'bg-line-strong'}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                              transition-[left,right] duration-150 ${checked ? 'right-0.5' : 'left-0.5'}`} />
        </button>
    );
}

export default function SetupWizardModal({
    open,
    onClose,
    onApply,
    currentPrefs = DEFAULTS,
    store = null,
}) {
    /* Hooks run unconditionally — the early `if (!open) return null` this file
       used to open with sat ABOVE four useState calls, which is a hooks-order
       violation that React only forgives because the component happened to
       unmount rather than re-render when it closed. */
    const detectedType = useMemo(() => {
        const raw = (store?.business_type || store?.industry || store?.name || '').toLowerCase();
        if (/pharmac|medical|drug|chemist|hardware|wholesal|distribut/.test(raw)) return 'scan';
        if (/cafe|coffee|rest|baker|food|dine|burger|pizza/.test(raw)) return 'visual';
        return 'retail';
    }, [store]);

    const [selectedOptionId, setSelectedOptionId] = useState(() => {
        const match = BUSINESS_SUGGESTIONS.find(b => b.id === currentPrefs?.profile);
        return match ? match.id : detectedType;
    });
    const [step, setStep] = useState(1);
    const [seniorMode, setSeniorMode] = useState(Boolean(currentPrefs?.ops?.senior));
    const [autoPrint, setAutoPrint] = useState(currentPrefs?.ops?.autoPrint ?? true);
    const [navRail, setNavRail] = useState(currentPrefs?.rail ?? false);
    const [autoFillCash, setAutoFillCash] = useState(currentPrefs?.ops?.autoFillCash ?? true);

    if (!open) return null;

    const activeSuggestion = BUSINESS_SUGGESTIONS.find(b => b.id === selectedOptionId) || BUSINESS_SUGGESTIONS[0];
    const activePreset = activeSuggestion.preset || 'column';

    const handleSelectOption = (optId) => {
        setSelectedOptionId(optId);
        /* The "simple counter" answer is not a layout choice, it is a legibility
           one — so it brings its two settings with it rather than leaving the
           operator to find them. */
        if (optId === 'simple') { setSeniorMode(true); setAutoFillCash(true); }
    };

    const handleComplete = () => {
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
        onClose?.();
    };

    const PREFS = [
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
    ];

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
                            <span className="text-3xs font-extrabold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                                Step {step} of 2
                            </span>
                            <h2 className="mt-1 text-lg font-extrabold text-ink leading-tight">
                                {step === 1 ? 'What kind of counter is this?' : 'Four things worth setting now'}
                            </h2>
                            <p className="mt-1 text-xs text-ink-muted leading-relaxed max-w-[62ch]">
                                {step === 1
                                    ? 'This picks a starting layout. Every part of it can be changed afterwards, and none of it is locked in.'
                                    : 'A preview of the register you are about to get, and the settings most counters change first.'}
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

                    {/* Progress. Two segments, no dots and no connector art. */}
                    <div className="mt-4 flex gap-1.5" aria-hidden="true">
                        {[1, 2].map(n => (
                            <span
                                key={n}
                                className={`h-1 flex-1 rounded-full transition-colors
                                            ${step >= n ? 'bg-brand-600' : 'bg-line'}`}
                            />
                        ))}
                    </div>
                </header>

                {/* ── BODY ── */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
                    {step === 1 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {BUSINESS_SUGGESTIONS.map(sug => {
                                const selected = sug.id === selectedOptionId;
                                const recommended = sug.id === detectedType;
                                const Icon = ICONS[sug.id] || Store;
                                return (
                                    <button
                                        key={sug.id}
                                        type="button"
                                        onClick={() => handleSelectOption(sug.id)}
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
                                                <span className="text-3xs font-extrabold uppercase tracking-wide px-2 py-1 rounded-lg
                                                                 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400
                                                                 border border-emerald-200/70 dark:border-emerald-900/60">
                                                    Suggested
                                                </span>
                                            )}
                                        </div>
                                        <span className="block text-sm font-extrabold text-ink leading-snug">
                                            {sug.title}
                                        </span>
                                        <span className="block text-2xs text-ink-muted leading-relaxed flex-1">
                                            {sug.desc}
                                        </span>
                                        <span className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                                            <span className="text-3xs font-bold text-ink-muted uppercase tracking-wide">
                                                {sug.preset} layout
                                            </span>
                                            {selected && (
                                                <span className="flex items-center gap-1 text-3xs font-extrabold text-brand-700 dark:text-brand-300">
                                                    <Check size={12} /> Selected
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                            <div className="min-w-0 space-y-2.5">
                                <span className="text-3xs font-extrabold uppercase tracking-[0.12em] text-ink-muted">
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
                                <span className="text-3xs font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                                    Preferences
                                </span>
                                {PREFS.map(pf => (
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
                </div>

                {/* ── FOOTER ── */}
                <footer className="shrink-0 px-6 py-4 border-t border-line bg-sunken/40 flex items-center gap-2">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-11 px-4 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink
                                           hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                Skip for now
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="ml-auto h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white
                                           text-xs font-extrabold transition-colors cursor-pointer
                                           flex items-center gap-2
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                Continue <ArrowRight size={15} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="h-11 px-4 rounded-xl border border-line bg-surface text-ink
                                           hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer
                                           flex items-center gap-2
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                <ArrowLeft size={15} /> Back
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                className="ml-auto h-11 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white
                                           text-xs font-extrabold transition-colors cursor-pointer
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                Start selling
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
}
