/**
 * Builder v2 orchestrator (BUILDER_FINAL_PLAN.md §6). Display only: every
 * decision — next question, stop, modules, reasons — comes from the server.
 *
 *   intent → question… → preview (after 3, and at the end) → read-back → onBuild
 *   "Something's missing" is reachable from the read-back and from any question.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { post, getReview, remember, recall, forget } from './api';
import QuestionScreen from './QuestionScreen';
import ConfirmCard from './ConfirmCard';
import Preview from './Preview';
import ReadBack from './ReadBack';
import MissingSomething from './MissingSomething';
import BuilderLoading from './BuilderLoading';

export default function BuilderV2({
    initialPrompt = '', initialType = '', initialPreset = '', businessTypes = [], getTurnstileToken,
    email = '', onBuild, onProgress,
}) {
    const [phase, setPhase] = useState('boot');          // boot | intent | question | preview | readback
    const [sessionId, setSessionId] = useState(null);
    const [step, setStep] = useState(null);
    const [review, setReview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [liveAdds, setLiveAdds] = useState([]);
    const [showMissing, setShowMissing] = useState(false);
    const [reviewFailed, setReviewFailed] = useState(false);
    const [sentence, setSentence] = useState(initialPrompt);
    const [typeFilter, setTypeFilter] = useState('');
    const previewShown = useRef(false);
    const booted = useRef(false);

    // Tell the page where we are so its top bar tracks the real journey, not "done after one question".
    const lastN = useRef(1);
    useEffect(() => {
        if (!onProgress) return;
        const n = step?.screen?.number;
        if (n) lastN.current = n;
        const left = step?.estimate_remaining || 0;
        const total = (phase === 'question' ? n || lastN.current : lastN.current) + left + 2;
        if (phase === 'boot' || phase === 'intent') onProgress({ step: 1, total: 8 });
        else if (phase === 'question') onProgress({ step: Math.max(1, n || lastN.current), total });
        else onProgress({ step: total - 1, total });
    }, [phase, step, onProgress]);

    const typeLabel = businessTypes.find((t) => t.key === (recall()?.type || initialType))?.label || '';

    const loadReview = useCallback(async (id) => {
        const r = await getReview(id);
        setReviewFailed(!r.ok);
        if (r.ok) setReview(r.data);
        return r;
    }, []);

    const enter = useCallback(async (id, data) => {
        setStep(data);
        setLiveAdds(data.live_adds || []);
        if (data.screen) {
            if (data.preview_available && !previewShown.current && data.screen.number > 3) {
                previewShown.current = true;
                await loadReview(id);
                setPhase('preview');
            } else {
                setPhase('question');
            }
        } else {
            previewShown.current = true;
            await loadReview(id);
            setPhase('preview');
        }
    }, [loadReview]);

    const fail = (r) => {
        if (r.status === 410) {
            forget();
            setSessionId(null);
            setPhase('intent');
            setError('Your session timed out, so we need to start again.');
        } else {
            setError(r.data?.message || 'Something went wrong. Nothing was lost — please try again.');
        }
    };

    const start = useCallback(async (body) => {
        setBusy(true);
        setError('');
        try {
            const token = getTurnstileToken ? await getTurnstileToken() : null;
            const r = await post('start', { ...body, ...(token ? { 'cf-turnstile-response': token } : {}) });
            if (!r.ok) return fail(r);
            setSessionId(r.data.session_id);
            remember({ sessionId: r.data.session_id, type: body.type || null });
            await enter(r.data.session_id, r.data);
        } finally {
            setBusy(false);
        }
    }, [enter, getTurnstileToken]);

    // Boot once: resume a live run, or begin from whatever the visitor already gave us.
    useEffect(() => {
        if (booted.current) return;
        booted.current = true;
        (async () => {
            const saved = recall();
            if (saved?.sessionId) {
                const r = await post('resume', { session_id: saved.sessionId });
                if (r.ok) {
                    setSessionId(saved.sessionId);
                    previewShown.current = true;
                    await enter(saved.sessionId, r.data);
                    return;
                }
                forget();
            }
            if (initialPrompt || initialType || initialPreset) {
                // A type picked on the site comes with a canned sentence. It is not the owner's words, so only send it when no type was picked.
                await start({ sentence: initialType || initialPreset ? undefined : initialPrompt || undefined, type: initialType || undefined, preset: initialPreset || undefined });
            } else {
                setPhase('intent');
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const run = async (path, body, onOk) => {
        setBusy(true);
        setError('');
        const r = await post(path, { session_id: sessionId, ...body });
        setBusy(false);
        if (!r.ok && r.status !== 409) return fail(r);
        onOk(r);
    };

    const submit = (payload) => run('answer', {
        screen_id: step.screen.screen_id, version: step.screen.version,
        selected: payload.selected || [], unsure: !!payload.unsure, skip: !!payload.skip, explain: payload.explain,
    }, (r) => enter(sessionId, r.data));

    const back = () => run('back', {}, (r) => (r.ok ? enter(sessionId, r.data) : setError('Nothing to go back to.')));

    const resolveCard = (correct) => run('confirm-card', { correct }, (r) => enter(sessionId, r.data));

    const toReview = async () => {
        setBusy(true);
        await loadReview(sessionId);
        setBusy(false);
        setPhase('readback');
    };

    const afterChange = (data) => {
        if (data) setReview(data);
        else loadReview(sessionId);
    };

    const revise = (fact, value) => run('revise', { fact_key: fact, value }, (r) => r.ok && setReview(r.data));
    const override = (module, action) => run('override', { module, action }, (r) => r.ok && setReview(r.data));
    const gift = (module, action) => override(module, action);
    const notify = (what) => run('missing', { text: `Notify me when this is ready: ${what}`, email: email || undefined }, async () => { await loadReview(sessionId); });

    const build = async () => {
        await post('readback-confirmed', { session_id: sessionId });
        onBuild({ sessionId, modules: review.modules, typeKey: recall()?.type || initialType || null });
    };

    // ── render ──────────────────────────────────────────────────────────
    if (phase === 'boot') {
        return <BuilderLoading />;
    }

    if (phase === 'intent') {
        const list = businessTypes.filter((t) => !typeFilter || t.label.toLowerCase().includes(typeFilter.toLowerCase())).slice(0, 8);

        return (
            <div className="mx-auto w-full max-w-2xl">
                <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Tell us how your business works</h1>
                <p className="mt-2 text-base text-ink-secondary">A sentence is plenty. We'll ask a few simple questions, then show you exactly what you get.</p>
                {error && <p className="mt-3 text-sm text-danger-text" role="alert">{error}</p>}
                <label className="mt-5 block">
                    <span className="sr-only">Describe your business</span>
                    <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} rows={3} maxLength={1000} placeholder="e.g. I run a grocery shop with one counter and buy stock from suppliers" className="w-full rounded-lg border border-line bg-surface p-3 text-base text-ink" />
                </label>
                <button type="button" disabled={busy || sentence.trim().length < 3} onClick={() => start({ sentence })} className="mt-3 min-h-[48px] rounded-full bg-accent-fill px-7 text-base font-semibold text-accent-on disabled:opacity-50">Continue</button>

                <h2 className="mt-8 text-base font-semibold text-ink">Or pick your kind of business</h2>
                <input value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} placeholder="Search, e.g. pharmacy, salon, bakery" aria-label="Search business types" className="mt-2 min-h-[48px] w-full rounded-lg border border-line bg-surface px-3 text-base text-ink" />
                <ul className="mt-2">
                    {list.map((t) => (
                        <li key={t.key}>
                            <button type="button" disabled={busy} onClick={() => start({ type: t.key })} className="min-h-[48px] w-full border-b border-line py-2 text-left text-base text-ink">{t.label}</button>
                        </li>
                    ))}
                </ul>
                <button type="button" disabled={busy} onClick={async () => { await start({}); setShowMissing(true); }} className="mt-5 min-h-[44px] text-sm font-semibold text-accent-text underline-offset-2 hover:underline">I'll choose myself</button>
            </div>
        );
    }

    return (
        <div>
            {error && <p className="mx-auto mb-4 max-w-2xl text-sm text-danger-text" role="alert">{error}</p>}
            {/* Say back what we understood before asking anything, so it is clear someone listened. Only at the start, not on every screen. */}
            {step?.heard && (step.confirm_card || (step.screen?.number ?? 0) <= 1) && (
                <p className="mx-auto mb-4 w-full max-w-2xl text-base text-ink-secondary" aria-live="polite">{!step.confirm_card && <span className="font-semibold text-ink">What we understood so far: </span>}{step.heard}</p>
            )}
            {step?.confirm_card && <ConfirmCard card={step.confirm_card} busy={busy} onResolve={resolveCard} />}

            {showMissing && sessionId ? (
                <MissingSomething sessionId={sessionId} email={email} onChanged={afterChange} onClose={() => { setShowMissing(false); afterChange(null); }} />
            ) : phase === 'question' && step?.screen ? (
                <QuestionScreen
                    screen={step.screen}
                    busy={busy}
                    liveAdds={liveAdds}
                    canBack={step.screen.number > 1}
                    canStop={step.screen.number >= 3}
                    onSubmit={submit}
                    onBack={back}
                    onStop={toReview}
                    onMissing={() => setShowMissing(true)}
                />
            ) : phase === 'preview' && review ? (
                <Preview
                    review={review}
                    done={!!step?.done}
                    busy={busy}
                    estimate={step?.estimate_remaining || 0}
                    onGift={gift}
                    onContinue={() => setPhase(step?.screen ? 'question' : 'readback')}
                    onReview={toReview}
                />
            ) : phase === 'readback' && review ? (
                <ReadBack
                    review={review}
                    busy={busy}
                    typeLabel={typeLabel}
                    onRevise={revise}
                    onOverride={override}
                    onNotify={notify}
                    onBuild={build}
                    onMissing={() => setShowMissing(true)}
                />
            ) : (phase === 'preview' || phase === 'readback') && reviewFailed ? (
                <div className="mx-auto max-w-md py-16 text-center">
                    <p className="text-base text-ink">We couldn't load your summary just now. Your answers are safe.</p>
                    <button type="button" onClick={() => loadReview(sessionId)} className="mt-4 min-h-[48px] rounded-full bg-accent-fill px-7 text-base font-semibold text-accent-on">Try again</button>
                </div>
            ) : (
                <BuilderLoading kind={phase === 'question' ? 'next' : 'review'} />
            )}
        </div>
    );
}
