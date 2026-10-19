/**
 * One decision screen (plan §6.2). Mobile first: large tap cards (min 48px), the
 * grey example under each label, and a footer that is always the same four things:
 * Not sure · Skip · Back · (from screen 3) Stop and show my setup.
 */
import React, { useMemo, useState } from 'react';
import OptionCard from '../OptionCard';

export default function QuestionScreen({
    screen, busy, liveAdds = [], canBack, canStop, onSubmit, onBack, onStop, onMissing, providers = [],
}) {
    const [picked, setPicked] = useState({});   // option id -> true
    const [explain, setExplain] = useState('');

    const panels = screen.panels;
    const opt = useMemo(() => {
        const m = {};
        panels.forEach((p) => p.options.forEach((o) => { m[o.id] = { ...o, panel: p }; }));
        return m;
    }, [panels]);

    const toggle = (id) => {
        const o = opt[id];
        setPicked((prev) => {
            const next = { ...prev };
            const p = o.panel;
            if (p.kind === 'single') {
                p.options.forEach((x) => delete next[x.id]);
                next[id] = true;
                return next;
            }
            if (next[id]) {
                delete next[id];
                return next;
            }
            if (o.exclusive) {
                p.options.forEach((x) => delete next[x.id]);   // an exclusive answer stands alone
            } else {
                p.options.filter((x) => x.exclusive).forEach((x) => delete next[x.id]);
            }
            next[id] = true;
            return next;
        });
    };

    const selected = Object.keys(picked);
    const needsExplain = selected.some((id) => opt[id]?.explain);
    const submit = (extra) => onSubmit({ selected, explain: needsExplain ? explain : undefined, ...extra });

    return (
        <div className="mx-auto w-full max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Question {screen.number}
                {screen.estimate_remaining > 0 ? ` · about ${screen.estimate_remaining} more` : ' · last one'}
            </p>

            {liveAdds.length > 0 && (
                <p className="mb-3 rounded-md bg-accent-quiet px-3 py-2 text-sm text-accent-text" role="status">
                    This adds: {liveAdds.join(', ')}
                </p>
            )}

            {screen.reask && (
                <p className="mb-3 text-sm text-ink-secondary">
                    We want to get this right, so one more try — a tap on whichever is closest is enough.
                </p>
            )}

            {panels.map((p, i) => (
                <fieldset key={p.id} className={i > 0 ? 'mt-8' : ''}>
                    <legend className="text-xl font-semibold leading-snug text-ink sm:text-2xl">{p.title}</legend>
                    {p.subtitle && <p className="mt-1 text-sm text-ink-muted">{p.subtitle}</p>}
                    <div className="mt-4 grid gap-3">
                        {p.options.map((o) => (
                            <OptionCard
                                key={o.id}
                                name={p.id}
                                value={o.id}
                                label={o.label}
                                hint={o.example || null}
                                multi={p.kind === 'multi'}
                                selected={!!picked[o.id]}
                                onSelect={toggle}
                            />
                        ))}
                        {p.none && p.kind === 'multi' && !p.options.some((o) => o.exclusive) && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => submit({ selected: selected.filter((id) => opt[id].panel.id !== p.id) })}
                                className="min-h-[48px] rounded-lg border-2 border-dashed border-line px-5 py-3 text-left text-base text-ink-secondary hover:border-line-strong"
                            >
                                {p.none}
                            </button>
                        )}
                    </div>
                </fieldset>
            ))}

            {needsExplain && (
                <label className="mt-5 block">
                    <span className="text-sm font-semibold text-ink">Tell us in your words</span>
                    <textarea
                        value={explain}
                        onChange={(e) => setExplain(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-line bg-surface p-3 text-base text-ink"
                    />
                </label>
            )}

            {panels.some((p) => p.options.some((o) => o.provider_picker && picked[o.id])) && (
                <p className="mt-3 text-sm text-ink-muted">
                    {providers.length
                        ? 'We can connect: ' + providers.join(', ')
                        : "We can't connect to any online marketplace yet — we'll note it and tell you when we can."}
                </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => submit()}
                    className="min-h-[48px] w-full sm:w-auto text-center rounded-full bg-accent-fill px-7 py-3 text-base font-semibold text-accent-on disabled:opacity-50"
                >
                    {selected.length ? 'Continue' : 'Continue with none of these'}
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" disabled={busy} onClick={() => onSubmit({ unsure: true })} className="min-h-[48px] px-3 text-sm font-semibold text-ink-secondary hover:text-ink">
                        Not sure
                    </button>
                    <button type="button" disabled={busy} onClick={() => onSubmit({ skip: true })} className="min-h-[48px] px-3 text-sm font-semibold text-ink-secondary hover:text-ink">
                        Skip
                    </button>
                    {canBack && (
                        <button type="button" disabled={busy} onClick={onBack} className="min-h-[48px] px-3 text-sm font-semibold text-ink-secondary hover:text-ink">
                            Back
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                {canStop && (
                    <button type="button" onClick={onStop} className="font-semibold text-accent-text underline-offset-2 hover:underline">
                        Stop and show my setup
                    </button>
                )}
                <button type="button" onClick={onMissing} className="text-ink-muted underline-offset-2 hover:underline">
                    Missing something?
                </button>
            </div>
        </div>
    );
}
