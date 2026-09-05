/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Onboarding Wizard — the in-app twin of the public builder.               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This screen and `Workspace/BuildWorkspace.jsx` ask the same questions and draw
 * the same proposal, because they now import the same components from
 * `Components/Builder/`. They shared nothing before, and had drifted into two
 * different products: this one was dark-only with hand-typed neutrals, the
 * public one light with hand-typed slates, and the two disagreed about what a
 * module even was.
 *
 * ── Not an industry flow ───────────────────────────────────────────────────
 * Fifteen presets ship in `config/ai_builder.php` and this screen is written for
 * all of them. The two paths below — describe it, or pick a template — both end
 * at the same proposal, and neither assumes a shop, a kitchen or a counter.
 *
 * ── Where the AI actually sits ─────────────────────────────────────────────
 * `store.onboarding.v2.ai-discovery` matches a preset from the sentence. The six
 * questions after it are deterministic: their answers run through the same
 * `implies` maps on the client and on the server (`DiscoveryResolver`), so the
 * stack the user watches assemble is the stack that gets applied. The AI is a
 * translator, not an authority — the config's phrase, and this is what it means
 * in practice.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import {
    ArrowRight, Check, LayoutGrid, Rocket, Sparkles, Wand2,
} from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import {
    BuilderShell,
    HandoffTips,
    LiveStack,
    ModuleGrid,
    QuestionStep,
    RecommendedBand,
    StackPill,
    useDiscovery,
    useSessionState,
} from '@/Components/Builder';

const FALLBACK_MODULES = ['products', 'pos', 'inventory', 'expenses', 'reports'];

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

const postJson = async (url, body) => {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrf(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res.json();
};

export default function Wizard({
    storeSlug,
    tenantName,
    presets = {},
    allModules = [],
    discovery = [],
    recommended = {},
}) {

    /* Scoped to this tenant, not just this page: a browser reused across two
       stores (an agency setting up several, a shared kiosk) must not hand one
       tenant's half-finished wizard to the next. Everything below that a
       returning visit should restore lives in sessionStorage via
       useSessionState rather than plain useState — a real navigation away
       from this page and back (browser back/forward, a closed tab reopened)
       is a fresh Inertia visit that throws the whole component away, which a
       plain useState cannot survive. */
    const STORAGE_KEY = `vq-onboarding-wizard:${storeSlug}`;

    const [rawPhase, setPhase] = useSessionState(`${STORAGE_KEY}:phase`, 'welcome');
    const [qIndex, setQIndex] = useSessionState(`${STORAGE_KEY}:qIndex`, 0);
    const [prompt, setPrompt] = useSessionState(`${STORAGE_KEY}:prompt`, '');
    const [presetKey, setPresetKey] = useSessionState(`${STORAGE_KEY}:presetKey`, null);
    const [presetLabel, setPresetLabel] = useSessionState(`${STORAGE_KEY}:presetLabel`, '');
    const [baseModules, setBaseModules] = useSessionState(`${STORAGE_KEY}:baseModules`, FALLBACK_MODULES);
    const [serverHeadline, setServerHeadline] = useSessionState(`${STORAGE_KEY}:serverHeadline`, '');
    const [edited, setEdited] = useSessionState(`${STORAGE_KEY}:edited`, null);
    const [lastAnswer, setLastAnswer] = useState(null);
    const [buildIndex, setBuildIndex] = useState(0);

    const legalKeys = useMemo(() => allModules.map((m) => m.key), [allModules]);

    const {
        questions, answers, answer, commitMulti,
        modules: proposedModules, attribution, headline, forget: forgetAnswers,
    } = useDiscovery(discovery, baseModules, legalKeys, STORAGE_KEY);

    const activeModules = edited ?? proposedModules;

    /* Called once the workspace is actually applied — see applyAndBuild. A
       completed wizard should not resurrect itself if this tenant's owner
       ever lands on this URL again. */
    const forgetAttempt = () => {
        forgetAnswers();
        [
            'phase', 'qIndex', 'prompt', 'presetKey', 'presetLabel',
            'baseModules', 'serverHeadline', 'edited',
        ].forEach((slot) => {
            try {
                window.sessionStorage.removeItem(`${STORAGE_KEY}:${slot}`);
            } catch (e) {
                /* nothing to clean up */
            }
        });
    };

    /* Derived, not synced. An empty discovery config must never strand anyone on
       a blank screen, but reaching for an effect to correct the phase costs a
       second render and a frame of the wrong UI. Deriving it means the bad state
       never exists in the first place. */
    const phase =
        rawPhase === 'questions' && questions.length === 0 ? 'proposal' : rawPhase;

    /* The house recommendations, resolved against the live registry. Already
       inside `modules` — the server merges them — but pulled out so the proposal
       can show them in their own labelled band rather than padding the grid
       silently. See config/ai_builder.php §3b. */
    const recommendedList = useMemo(
        () =>
            Object.entries(recommended || [])
                .map(([key, meta]) => {
                    const mod = allModules.find((m) => m.key === key);
                    return mod ? { ...mod, why: meta.why } : null;
                })
                .filter(Boolean),
        [recommended, allModules],
    );

    const gridCatalogue = useMemo(
        () => allModules.filter((m) => !recommended?.[m.key]),
        [allModules, recommended],
    );

    const catalogueByKey = useMemo(() => {
        const map = {};
        for (const m of allModules) map[m.key] = m;
        return map;
    }, [allModules]);

    const locked = useMemo(() => {
        const out = {};
        for (const key of activeModules) {
            for (const dep of catalogueByKey[key]?.requires || []) {
                if (activeModules.includes(dep)) {
                    out[dep] = `Required by ${catalogueByKey[key]?.label || key}`;
                }
            }
        }
        return out;
    }, [activeModules, catalogueByKey]);

    /** Shippable templates only — a blocked preset is not something to offer. */
    const templateList = useMemo(
        () =>
            Object.entries(presets)
                .filter(([, p]) => !p?.blocked_by)
                .map(([key, p]) => ({ key, ...p })),
        [presets],
    );

    useEffect(() => {
        if (phase !== 'building') return;
        const t = window.setInterval(
            () => setBuildIndex((i) => Math.min(i + 1, 2)),
            850,
        );
        return () => window.clearInterval(t);
    }, [phase]);

    const runDiscovery = async () => {
        try {
            const data = await postJson(
                route('store.onboarding.v2.ai-discovery', { store_slug: storeSlug }),
                { prompt, answers },
            );
            if (data?.success) {
                setPresetKey(data.preset_key || null);
                setPresetLabel(data.preset?.label || '');
                setBaseModules(data.suggested_modules || FALLBACK_MODULES);
                setServerHeadline(data.headline || '');
            }
        } catch (e) {
            /* A failed match still leaves a usable stack — the questions built
               one on their own, and the proposal renders from that. */
        }
    };

    const handleAnswer = (questionKey, optionKey, opts) => {
        answer(questionKey, optionKey, opts);
        setEdited(null);
        const q = questions.find((x) => x.key === questionKey);
        setLastAnswer({
            questionKey,
            optionLabel: q?.options?.[optionKey] || '',
            at: Date.now(),
        });
    };

    const advance = () => {
        setQIndex((i) => {
            if (i + 1 >= questions.length) {
                setPhase('proposal');
                return i;
            }
            return i + 1;
        });
    };

    /* Multi questions wait for Continue, and Continue records the answer even
       when nothing was ticked — so "none of these" is an answer, not a gap. */
    const continueFromMulti = () => {
        const q = questions[qIndex];
        if (q) commitMulti(q.key);
        advance();
    };

    const chooseTemplate = (tpl) => {
        setPresetKey(tpl.key);
        setPresetLabel(tpl.label || '');
        setBaseModules(tpl.modules || FALLBACK_MODULES);
        setEdited(null);
        setPhase('questions');
        setQIndex(0);
    };

    const applyAndBuild = async () => {
        setPhase('building');
        setBuildIndex(0);
        try {
            await postJson(
                route('store.onboarding.v2.apply-preset', { store_slug: storeSlug }),
                { modules: activeModules, preset_key: presetKey },
            );
        } catch (e) {
            /* The complete step below still moves them into the product. */
        }
        setBuildIndex(3);
        try {
            const data = await postJson(
                route('store.onboarding.v2.complete', { store_slug: storeSlug }),
            );
            forgetAttempt();
            window.setTimeout(() => {
                window.location.href =
                    data?.redirect || `/s/${storeSlug}/dashboard`;
            }, 620);
        } catch (e) {
            forgetAttempt();
            window.location.href = `/s/${storeSlug}/dashboard`;
        }
    };

    const toggleModule = (key) => {
        setEdited(
            activeModules.includes(key)
                ? activeModules.filter((k) => k !== key)
                : [...activeModules, key],
        );
    };

    const totalSteps = questions.length + 2;
    const stepNow =
        phase === 'questions'
            ? qIndex + 1
            : phase === 'proposal'
              ? questions.length + 1
              : phase === 'building'
                ? totalSteps
                : 0;

    const back = () => {
        if (phase === 'questions' && qIndex > 0) return () => setQIndex((i) => i - 1);
        if (phase === 'questions') return () => setPhase('welcome');
        if (phase === 'intent' || phase === 'templates') {
            return () => setPhase('welcome');
        }
        if (phase === 'proposal' && questions.length) {
            return () => {
                setPhase('questions');
                setQIndex(questions.length - 1);
            };
        }
        return null;
    };


    /* One orb, four moods, matching what the flow is actually doing. It is the
       same component Vena wears inside the product, so the thing thinking during
       setup is visibly the thing that will be thinking afterwards. */
    const orbState =
        phase === 'building'
            ? 'solving'
            : phase === 'reveal' || phase === 'proposal'
              ? 'shaping'
              : phase === 'questions'
                ? 'listening'
                : 'breathing';


    /* The module the most recent answer pulled in — what the phone pill names. */
    const lastAdded = useMemo(() => {
        if (!lastAnswer) return null;
        const mine = activeModules.filter(
            (k) => attribution[k] === lastAnswer.questionKey,
        );
        return mine.length ? mine[mine.length - 1] : null;
    }, [lastAnswer, activeModules, attribution]);

    const showStack = phase === 'questions' || phase === 'proposal';

    return (
        <>
            <Head title="Set up your workspace" />
            <BuilderShell
                step={stepNow}
                total={phase === 'building' ? 0 : totalSteps}
                eyebrow={presetLabel || tenantName}
                orbState={orbState}
                onBack={phase === 'building' ? null : back()}
                wide={showStack}
                footer={<span>You can change any of this later in Builder.</span>}
            >
                <div
                    className={
                        showStack
                            ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10'
                            : ''
                    }
                >
                    <div className="min-w-0">
                        {/* Phone: the panel compressed to the two parts that
                            carry the payoff. See StackPill. */}
                        {showStack && (
                            <StackPill
                                modules={activeModules}
                                catalogue={catalogueByKey}
                                justAdded={lastAdded}
                                className="mb-5 lg:hidden"
                            />
                        )}

                        <AnimatePresence mode="wait">
                            {/* ─── Two ways in ─────────────────────────────── */}
                            {phase === 'welcome' && (
                                <Fade key="welcome" className="mx-auto max-w-3xl text-center">
                                    <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                        Let&rsquo;s shape {tenantName || 'your workspace'}.
                                    </h1>
                                    <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-secondary">
                                        Six quick questions and you are running. Nothing here
                                        is locked &mdash; every module is included on every
                                        plan.
                                    </p>

                                    <div className="mt-9 grid gap-4 text-left sm:grid-cols-2">
                                        <PathCard
                                            icon={Wand2}
                                            title="Describe your business"
                                            body="A sentence in your own words. We match it to the closest setup, then confirm the details with you."
                                            cta="Start with a sentence"
                                            onClick={() => setPhase('intent')}
                                        />
                                        <PathCard
                                            icon={LayoutGrid}
                                            title="Start from a template"
                                            body={`Pick from ${templateList.length} ready-made setups — retail, food, services, trade, wholesale and more.`}
                                            cta="Browse templates"
                                            onClick={() => setPhase('templates')}
                                        />
                                    </div>
                                </Fade>
                            )}

                            {/* ─── Free text ───────────────────────────────── */}
                            {phase === 'intent' && (
                                <Fade key="intent" className="mx-auto max-w-2xl">
                                    <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                                        What does your business do?
                                    </h1>
                                    <p className="mt-3 text-base text-ink-secondary">
                                        One sentence. This does most of the work.
                                    </p>
                                    <textarea
                                        rows={3}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="We…"
                                        className="mt-6 w-full resize-none rounded-lg border border-line bg-surface p-4 text-base text-ink shadow-sm placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            runDiscovery();
                                            setPhase('questions');
                                            setQIndex(0);
                                        }}
                                        className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                    >
                                        Continue
                                        <ArrowRight size={16} />
                                    </button>
                                </Fade>
                            )}

                            {/* ─── Templates ───────────────────────────────── */}
                            {phase === 'templates' && (
                                <Fade key="templates">
                                    <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                                        Closest to what you do?
                                    </h1>
                                    <p className="mt-3 text-base text-ink-secondary">
                                        Pick one to start from. The questions after it will
                                        tune it to you.
                                    </p>
                                    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {templateList.map((tpl, i) => (
                                            <motion.button
                                                key={tpl.key}
                                                type="button"
                                                onClick={() => chooseTemplate(tpl)}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: Math.min(i, 8) * 0.04,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                className="rounded-lg border border-line bg-surface p-4 text-left shadow-sm transition-colors duration-normal ease-standard hover:border-accent hover:bg-accent-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                            >
                                                <span className="block text-sm font-semibold text-ink">
                                                    {tpl.label || tpl.key}
                                                </span>
                                                {tpl.description && (
                                                    <span className="mt-1 block text-xs leading-normal text-ink-muted">
                                                        {tpl.description}
                                                    </span>
                                                )}
                                                <span className="mt-3 block text-3xs font-semibold uppercase tracking-widest text-accent-text">
                                                    {(tpl.modules || []).length} modules
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </Fade>
                            )}

                            {/* ─── Questions ───────────────────────────────── */}
                            {phase === 'questions' && questions[qIndex] && (
                                <QuestionStep
                                    key={questions[qIndex].key}
                                    question={questions[qIndex]}
                                    value={answers[questions[qIndex].key]}
                                    onAnswer={handleAnswer}
                                    onContinue={continueFromMulti}
                                    autoAdvance={advance}
                                />
                            )}

                            {/* ─── Proposal ────────────────────────────────── */}
                            {phase === 'proposal' && (
                                <Fade key="proposal">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text">
                                        <Sparkles size={12} />
                                        {presetLabel || 'Your setup'}
                                    </span>
                                    <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                        {headline || serverHeadline || 'Here is your workspace.'}
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
                                        Everything below is switched on. Add or remove
                                        anything &mdash; none of it changes what you pay.
                                    </p>

                                    {recommendedList.length > 0 && (
                                        <RecommendedBand
                                            items={recommendedList}
                                            active={activeModules}
                                            onToggle={toggleModule}
                                        />
                                    )}

                                    <div className="mt-7">
                                        <ModuleGrid
                                            catalogue={gridCatalogue}
                                            active={activeModules}
                                            locked={locked}
                                            onToggle={toggleModule}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={applyAndBuild}
                                        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                                    >
                                        <Rocket size={16} />
                                        Build my workspace
                                        <ArrowRight size={16} />
                                    </button>
                                </Fade>
                            )}

                            {/* ─── Building ────────────────────────────────── */}
                            {phase === 'building' && (
                                <Fade key="building" className="mx-auto max-w-md text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center">
                                        <ThinkingOrb
                                            state="solving"
                                            size={80}
                                            aria-label="Building your workspace"
                                        />
                                    </div>
                                    <h2 className="mt-6 font-display text-2xl font-semibold text-ink">
                                        Setting things up
                                    </h2>
                                    <ul className="mt-6 space-y-2.5 text-left">
                                        {[
                                            'Switching on your modules',
                                            'Naming things the way you do',
                                            'Laying out your dashboard',
                                            'Ready',
                                        ].map((label, i) => (
                                            <li
                                                key={label}
                                                className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors duration-slow ease-standard ${
                                                    i <= buildIndex
                                                        ? 'border-accent bg-accent-quiet text-ink'
                                                        : 'border-line bg-surface text-ink-faint'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                                        i <= buildIndex
                                                            ? 'bg-accent-fill text-accent-on'
                                                            : 'bg-sunken'
                                                    }`}
                                                >
                                                    {i <= buildIndex && (
                                                        <Check size={11} strokeWidth={3} />
                                                    )}
                                                </span>
                                                {label}
                                            </li>
                                        ))}
                                    </ul>

                                    <HandoffTips className="mt-8" />
                                </Fade>
                            )}
                        </AnimatePresence>
                    </div>

                    {showStack && (
                        <LiveStack
                            modules={activeModules}
                            catalogue={catalogueByKey}
                            attribution={attribution}
                            lastAnswer={lastAnswer}
                            className="sticky top-6 hidden max-h-[70vh] lg:flex"
                        />
                    )}
                </div>
            </BuilderShell>
        </>
    );
}

function Fade({ children, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function PathCard({ icon: Icon, title, body, cta, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 text-left shadow-sm transition-colors duration-normal ease-standard hover:border-accent hover:bg-accent-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sunken text-accent-text transition-colors duration-normal ease-standard group-hover:bg-accent-fill group-hover:text-accent-on">
                <Icon size={20} strokeWidth={1.9} />
            </span>
            <span className="mt-4 block text-lg font-semibold text-ink">{title}</span>
            <span className="mt-2 block flex-1 text-sm leading-relaxed text-ink-secondary">
                {body}
            </span>
            <span className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-accent-text">
                {cta}
                <ArrowRight
                    size={14}
                    className="transition-transform duration-normal ease-standard group-hover:translate-x-1"
                />
            </span>
        </button>
    );
}
