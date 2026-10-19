/**
 * "Getting started" — how far along the store is, what is left, and how to do each thing.
 * Reads the same list as the checklist popup (lib/gettingStarted.js). Done = real data exists.
 */
import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ArrowRight, Check, ChevronDown, Compass, Play } from 'lucide-react';
import { startTour } from '@/lib/tourControl';
import { FIND_YOUR_WAY, GETTING_STARTED, isStepDone, startStep } from '@/lib/gettingStarted';

export default function GettingStartedCard({ store }) {
    const metrics = usePage().props.onboarding_metrics || {};
    const [open, setOpen] = useState(null);

    if (!store) return null;

    const steps = GETTING_STARTED.map((s) => ({ ...s, done: isStepDone(s, metrics, store) }));
    const done = steps.filter((s) => s.done).length;
    const left = steps.length - done;
    const pct = Math.round((done / steps.length) * 100);
    const next = steps.find((s) => !s.done);

    return (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface" aria-labelledby="gs-title">
            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 id="gs-title" className="text-xl font-bold text-ink">Getting started</h2>
                        <p className="mt-1 text-sm text-ink-muted">
                            {left === 0 ? 'You have done everything on the list. Nicely done.' : `${done} of ${steps.length} done · ${left} left`}
                        </p>
                    </div>
                    <span className="text-2xl font-bold text-accent-text" aria-hidden="true">{pct}%</span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Getting started progress">
                    <div className="h-full rounded-full bg-accent-fill transition-all duration-slower" style={{ width: `${pct}%` }} />
                </div>

                {next && (
                    <button type="button" onClick={() => startStep(store, next)} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-on">
                        Next: {next.label}<ArrowRight size={16} aria-hidden="true" />
                    </button>
                )}
            </div>

            <ul className="divide-y divide-line border-t border-line">
                {steps.map((s) => (
                    <li key={s.key}>
                        <div className="flex items-center gap-3 px-6 py-3">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-accent-fill text-accent-on' : 'border border-line text-ink-muted'}`}>
                                {s.done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : null}
                            </span>
                            <button type="button" onClick={() => setOpen(open === s.key ? null : s.key)} aria-expanded={open === s.key} className="flex min-h-[44px] flex-1 items-center justify-between gap-2 text-left">
                                <span className={`text-sm font-semibold ${s.done ? 'text-ink-muted line-through' : 'text-ink'}`}>{s.label}</span>
                                <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform ${open === s.key ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                            {s.done ? (
                                <span className="shrink-0 text-xs font-semibold text-accent-text">Done</span>
                            ) : (
                                <button type="button" onClick={() => startStep(store, s)} className="min-h-[36px] shrink-0 rounded-full border border-line px-4 text-xs font-semibold text-ink hover:bg-interactive-hover">Show me</button>
                            )}
                        </div>
                        {open === s.key && (
                            <div className="px-6 pb-4 pl-[4.25rem] text-sm text-ink-secondary">
                                <p>{s.why}</p>
                                <p className="mt-1 font-semibold text-ink">{s.how}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            <div className="border-t border-line bg-sunken p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-bold text-ink"><Compass size={18} className="text-accent-text" aria-hidden="true" />Find your way around</h3>
                    <button type="button" onClick={() => startTour('welcome')} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-on">
                        <Play size={14} aria-hidden="true" />Take the tour
                    </button>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {FIND_YOUR_WAY.map((t) => (
                        <div key={t.title} className="rounded-xl border border-line bg-surface p-4">
                            <dt className="text-sm font-semibold text-ink">{t.title}</dt>
                            <dd className="mt-1 text-sm text-ink-secondary">{t.text}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
