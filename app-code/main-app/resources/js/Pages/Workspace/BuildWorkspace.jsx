/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  BuildWorkspace — the public builder. Landing sentence in, system out.    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * FLOW (11 Sep 2026 — nothing is compulsory except a login)
 *   intent   — describe the business (recommended) OR one-click a ready-made
 *              setup (goes straight to reveal, no questions)
 *   questions— AI or manual; "Skip questions" always visible → reveal
 *   reveal   — the stack; add/remove anything
 *   plan     — pick the plan for after the trial, or "Skip — decide later"
 *   account  — business name (defaults) + currency + Google / email+password
 *   → emailed code (local dev: 0000) → dashboard
 * ?preset=<key> opens on the reveal; ?plan=<key> preselects the plan step.
 *
 * WHAT CHANGED AND WHY (earlier)
 *
 * This screen used to open on `step: 'result'` with `isAnalyzing: true`. One
 * sentence typed on the landing page went in, and a finished architecture came
 * out with no questions in between. It read as a guess, because it was one —
 * and the two follow-up dropdowns further in (sales method, team size) were not
 * even validated server-side, so answering them changed nothing at all.
 *
 * The replacement asks six questions before the reveal. That is more friction
 * on paper and less in practice, for one reason: every answer visibly moves the
 * panel on the right. Friction the user can see paying off is not friction; it
 * is the thing that makes the result feel earned rather than assigned. The rule
 * that keeps it honest lives in the config — a question that cannot move the
 * stack does not get asked.
 *
 * ── This flow is not for one industry ──────────────────────────────────────
 * Fifteen presets ship in `config/ai_builder.php` — pharmacy, salon, freelancer,
 * wholesale, repair workshop, multi-branch retail and the rest. Nothing on this
 * screen is written for retail or for food. The questions are the ones a
 * consultant would ask any business in any trade (do you hold stock, do you make
 * anything, where does money change hands, do people pay late, how many of you
 * are there), and the reveal is written from whichever preset matched. If a
 * question ever needs an industry-specific option, that is the signal it has
 * become the wrong question.
 *
 * ── Contracts kept exactly ─────────────────────────────────────────────────
 *   workspace.analyze   { prompt, preset, answers? } -> preset + modules + capabilities
 *   workspace.demand    { prompt, email, source }
 *   workspace.provision { business_name, currency, phone, email, password,
 *                         modules, preset_key, plan? }
 * `answers` is additive and optional: the server applies the same `implies` map
 * this page does, so the two agree, and an older server simply ignores it.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import {
    ArrowRight, Building2, Check, ChevronDown, Compass, FastForward, Lock, Mail,
    MessageSquareText, Phone, Rocket, Send, ShieldCheck, Sparkles,
} from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import useTurnstile from '@/Components/Builder/useTurnstile';
import BusinessTypePicker from '@/Components/Builder/BusinessTypePicker';
import { rankBusinessTypes } from '@/Components/Builder/matchBusinessTypes';
import {
    BuilderShell,
    ConversationalDiscovery,
    HandoffTips,
    LiveStack,
    ModuleGrid,
    PromptTextarea,
    QuestionStep,
    RecommendedBand,
    StackPill,
    useDiscovery,
    useSessionState,
} from '@/Components/Builder';

/* Every in-progress attempt in this tab shares one slot. A visitor who leaves
   mid-flow and comes back to /build-workspace — browser back, a closed tab
   reopened, a bookmark — gets the same attempt back rather than starting over,
   which a plain useState cannot do: any of those is a real page visit, and
   Inertia rebuilds this component from nothing when one happens. See
   useSessionState and useDiscovery's storageKey for the mechanism. */
const STORAGE_KEY = 'vq-build-workspace';

/* Symbols match App\\Services\\StoreProvisioner::CURRENCY_SYMBOLS — what
   actually prints on receipts. */
const CURRENCY_LIST = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', flag: '🇵🇰' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
];

/**
 * Example sentences for the free-text step. Deliberately spread across five
 * unrelated trades — a visitor who runs a salon should not have to translate a
 * grocery example into their own words to understand what the box wants.
 */
const EXAMPLES = [
    'I run a grocery store with two counters and sell on credit.',
    'Salon with four chairs, we book appointments and sell products.',
    'I am a freelance designer invoicing clients monthly.',
    'Wholesale distributor, 30-day terms, deliveries to shops.',
    'Phone repair shop — parts, jobs and walk-in sales.',
];

/* Smaller setups are pointed at the smaller plan by default; everything else
   at the plan the pricing page badges. Only a default — one tap changes it. */
const LIGHT_PRESETS = [
    'pos_only', 'cafe', 'freelancer', 'salon', 'professional_services', 'membership_studio',
    'food_counter', 'field_service', 'rental_hire', 'tailoring',
];

/* Words a store will use, shown before signup: "Clients · Jobs · Plumbers". */
function TermsPreview({ terms, className = '' }) {
    const words = Object.values(terms || {}).map((w) => w?.plural).filter(Boolean);
    if (!words.length) return null;
    return (
        <p className={`text-xs text-ink-secondary ${className}`}>
            Your workspace will say{' '}
            {words.map((w, i) => (
                <React.Fragment key={w}>
                    {i > 0 && ' · '}
                    <strong className="font-semibold text-ink">{w}</strong>
                </React.Fragment>
            ))}
            {' '}— you can rename anything later.
        </p>
    );
}

const isShippablePreset = (presets, key) =>
    !!key && !!presets?.[key] && !(presets[key].blocked_by || []).length;

/* The owner's real timezone, so a store opened in Dubai is not on Karachi time. */
const browserTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch (e) {
        return null;
    }
};

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
        body: JSON.stringify(body),
    });
    return res.json();
};

export default function BuildWorkspace({
    initialPrompt = '',
    initialPreset = '',
    initialType = '',
    initialEmail = '',
    initialCurrency = 'USD',
    allModules = [],
    discovery = [],
    recommended = {},
    presets = {},
    plans = [],
    intendedPlan = null,
    authUser = null,
    license = null,
    businessTypes = [],
    sectors = {},
}) {
    const getTurnstileToken = useTurnstile();

    /* A held license (AppSumo / pre-paid / gift) decides the plan — no plan step. */
    plans = license ? [] : plans;

    /* ── Phase machine ─────────────────────────────────────────────────────
       'intent' is skipped when the landing hero already captured a sentence,
       which is the common path. Asking someone to describe their business a
       second time is the fastest way to make a flow feel like paperwork.

       Everything below that a returning visit should restore lives in
       sessionStorage via useSessionState, not plain useState — see the note
       by STORAGE_KEY above. Session state hydrates synchronously from the
       initialiser, so there is no flash of the wrong phase on remount. */
    /* Where a fresh attempt opens. A landing sentence goes to the questions;
       a template picked on the site (?preset=) goes straight to its reveal —
       asking someone who already chose "Pharmacy" to describe their business
       again is exactly the friction this flow must not have. */
    const typeByKey = useMemo(() => Object.fromEntries(businessTypes.map((t) => [t.key, t])), [businessTypes]);
    const entryType = !initialPrompt && initialType ? typeByKey[initialType] || null : null;
    const directEntry = !initialPrompt && (!!entryType || isShippablePreset(presets, initialPreset));
    const entryPhase = initialPrompt ? 'questions' : directEntry ? 'reveal' : 'intent';
    const [rawPhase, setPhase] = useSessionState(`${STORAGE_KEY}:phase`, entryPhase);
    /* How this attempt reached the reveal: 'preset' (one-click setup, no
       questions) or 'questions'. Drives Back and the progress rail. */
    const [path, setPath] = useSessionState(
        `${STORAGE_KEY}:path`,
        directEntry ? 'preset' : 'questions',
    );
    /* The business type (config/business_types.php) this attempt is for —
       picked from the list, or read from the sentence by the server. It
       decides the modules AND the words the store uses. */
    const [businessType, setBusinessType] = useSessionState(`${STORAGE_KEY}:businessType`, entryType?.key || '');
    const [businessLabel, setBusinessLabel] = useSessionState(`${STORAGE_KEY}:businessLabel`, entryType?.label || '');
    const [terms, setTerms] = useSessionState(`${STORAGE_KEY}:terms`, entryType?.terms || {});
    const [candidates, setCandidates] = useSessionState(`${STORAGE_KEY}:candidates`, []);
    /* Plan picked on the plan step. null = "decide after the trial". */
    const [planKey, setPlanKey] = useSessionState(`${STORAGE_KEY}:planKey`, intendedPlan || '');
    const [planTouched, setPlanTouched] = useSessionState(`${STORAGE_KEY}:planTouched`, !!intendedPlan);
    const [skipping, setSkipping] = useState(false);
    const [qIndex, setQIndex] = useSessionState(`${STORAGE_KEY}:qIndex`, 0);

    const [prompt, setPrompt] = useSessionState(`${STORAGE_KEY}:prompt`, initialPrompt);
    const [presetKey, setPresetKey] = useSessionState(`${STORAGE_KEY}:presetKey`, entryType?.preset || initialPreset);
    const entryPreset = entryType
        ? presets[entryType.preset] || null
        : !initialPrompt && isShippablePreset(presets, initialPreset) ? presets[initialPreset] : null;
    const [presetLabel, setPresetLabel] = useSessionState(`${STORAGE_KEY}:presetLabel`, entryPreset?.label || '');
    const [presetDesc, setPresetDesc] = useSessionState(
        `${STORAGE_KEY}:presetDesc`,
        entryPreset ? entryPreset.description || entryPreset.blurb || '' : '',
    );
    /* Whether the resolved preset is a real match or the bare "found nothing,
       defaulted to Retail Shop" case — see WorkspaceBuilderController::
       analyze()'s 'matched' field. Defaults true so an explicit template pick,
       or an older cached response that predates this field, never shows the
       honest note by mistake. */
    const [matched, setMatched] = useSessionState(`${STORAGE_KEY}:matched`, true);
    const [baseModules, setBaseModules] = useSessionState(`${STORAGE_KEY}:baseModules`, entryPreset?.modules || []);
    const [capabilities, setCapabilities] = useSessionState(`${STORAGE_KEY}:capabilities`, []);
    const [analysed, setAnalysed] = useState(false);

    const legalKeys = useMemo(() => allModules.map((m) => m.key), [allModules]);

    const {
        questions, answers, answer, commitMulti, modules: proposedModules,
        attribution, headline, forget: forgetAnswers, reset: resetAnswers,
    } = useDiscovery(discovery, baseModules, legalKeys, STORAGE_KEY, presetKey);

    /* The user's own edits on the reveal screen override the proposal. Until
       they touch it, the proposal flows straight through. */
    const [edited, setEdited] = useSessionState(`${STORAGE_KEY}:edited`, null);
    const activeModules = edited ?? proposedModules;

    const [discoveryMode, setDiscoveryMode] = useSessionState(`${STORAGE_KEY}:discoveryMode`, 'ai');

    /* The intent box edits a local draft, not the persisted `prompt`. A draft
       that was never submitted must not greet someone who comes back via the
       browser's back button — only real mid-flow state is restored. So the
       draft starts empty on the intent screen, and starts from the submitted
       sentence only when this visit resumed PAST intent (then Back/Edit lands
       on a box holding what they actually sent). */
    const [draft, setDraft] = useState(() => (rawPhase !== 'intent' ? prompt || '' : ''));

    /* The conversational flow reports its own readiness (0–100); the shell's
       rail reads it so the bar moves while the AI asks. Never goes backwards. */
    const [aiProgress, setAiProgress] = useState(0);

    /* The conversation mounts only after the mount effect below has decided
       fresh-attempt vs. resume. Before that, `prompt` is still whatever this
       tab hydrated from sessionStorage — mounting on it would flash (and
       resume) the PREVIOUS business's conversation for one frame. */
    const [attemptResolved, setAttemptResolved] = useState(false);
    const handleAiProgress = (pct) => {
        if (typeof pct === 'number') setAiProgress((p) => Math.max(p, Math.min(100, pct)));
    };

    const handleAiComplete = (proposal, modules, preset) => {
        if (modules && modules.length > 0) {
            setBaseModules(modules);
        }
        if (preset) {
            setPresetKey(preset);
            const p = (presets && presets[preset]) || {};
            setPresetLabel(p.label || preset);
            setPresetDesc(p.description || '');
        }
        if (proposal?.confidence) {
            setMatched(true);
        }
        setPhase('reveal');
    };

    const handleAiStateUpdate = (confirmedCaps, facts) => {
        /* `capabilities` holds {key, label, …} objects (see analyse). The
           conversation reports bare capability keys; storing those here would
           poison catalogueByKey, so only object-shaped lists are accepted. */
        if (
            Array.isArray(confirmedCaps) &&
            confirmedCaps.length > 0 &&
            confirmedCaps.every((c) => c && typeof c === 'object' && c.key)
        ) {
            setCapabilities(confirmedCaps);
        }
    };

    /* A finished attempt should not greet the next visitor to this tab with
       someone else's half-built workspace. Everything under STORAGE_KEY is
       cleared the moment provisioning actually succeeds — see `provision`. */
    const forgetAttempt = () => {
        forgetAnswers();
        [
            'phase', 'qIndex', 'prompt', 'presetKey', 'presetLabel',
            'presetDesc', 'baseModules', 'capabilities', 'edited', 'matched',
            'converse', 'discoveryMode', 'path', 'planKey', 'planTouched',
            'businessType', 'businessLabel', 'terms', 'candidates',
        ].forEach((slot) => {
            try {
                window.sessionStorage.removeItem(`${STORAGE_KEY}:${slot}`);
            } catch (e) {
                /* nothing to clean up */
            }
        });
    };

    const [lastAnswer, setLastAnswer] = useState(null);

    /* Derived, not synced. An empty discovery config must never strand anyone on
       a blank screen, but reaching for an effect to correct the phase costs a
       second render and a frame of the wrong UI. Deriving it means the bad state
       never exists in the first place. */
    const phase =
        rawPhase === 'questions' && questions.length === 0
            ? 'reveal'
            : rawPhase === 'identity' // merged into 'account'; old tabs may still hold it
              ? 'account'
              : rawPhase;

    /* Identity + account */
    const [businessName, setBusinessName] = useState('');
    const [currency, setCurrency] = useState(initialCurrency || 'USD');
    const [phone, setPhone] = useState('');
    const [showPhone, setShowPhone] = useState(false);
    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [provisionError, setProvisionError] = useState('');
    const [buildIndex, setBuildIndex] = useState(0);
    const [googleBusy, setGoogleBusy] = useState(false);

    /* Demand log */
    const [demandOpen, setDemandOpen] = useState(false);
    const [demandText, setDemandText] = useState('');
    const [demandSent, setDemandSent] = useState(false);
    const [demandBusy, setDemandBusy] = useState(false);

    const promptRef = useRef(null);

    /* ── Analysis ──────────────────────────────────────────────────────────
       Runs once, as soon as there is a sentence to run it on. It resolves the
       preset in the background WHILE the visitor answers questions, so the
       reveal has nothing to wait for. */
    const analyse = async (text, preset, answersOverride, typeKey = null) => {
        try {
            const data = await postJson(route('workspace.analyze'), {
                prompt: text,
                preset,
                business_type: typeKey || null,
                // A caller starting a brand-new attempt (see the mount effect
                // below) passes {} here explicitly — otherwise this closes
                // over whatever `answers` happens to be at call time, which
                // for a fresh attempt is still the PREVIOUS business's
                // answers for one tick, and would taint the new preset's
                // module merge with them.
                answers: answersOverride ?? answers,
            });
            if (!data?.success) return null;
            setPresetKey(data.preset_key || '');
            setPresetLabel(data.preset_label || '');
            setPresetDesc(data.preset_description || '');
            setBaseModules(data.modules || []);
            setCapabilities(data.capabilities || []);
            setMatched(data.matched !== false);
            setBusinessType(data.business_type || '');
            setBusinessLabel(data.business_label || '');
            setTerms(data.terms || {});
            setCandidates(data.candidates || []);
            return data;
        } catch (e) {
            /* A failed match is not a dead end — the questions still build a
               stack on their own, and the reveal renders from that. */
            return null;
        } finally {
            setAnalysed(true);
        }
    };

    useEffect(() => {
        /* A prompt or preset arriving via THIS PAGE LOAD's URL that does not
           match what this tab already has cached is a NEW attempt, not a
           resume — someone who tried a different landing-page example, or
           came back and described a different business entirely.
           `prompt` and `presetKey` here are already the HYDRATED values from
           sessionStorage (see useSessionState's initialiser) — they are
           whatever this tab last resolved, not necessarily what is in the
           URL right now. Before this fix, that hydration won silently: a
           second, different prompt never even reached `analyse()`, because
           the guard below saw a truthy `presetKey` left over from the FIRST
           attempt and skipped re-analysing — which is what made the reveal
           keep naming the first business's preset (a stale "Cafe") no matter
           what the visitor typed the second time. A bare revisit with no
           prompt/preset in the URL — the browser's own back/forward, or
           reopening the tab — still falls through to the restore branch
           below exactly as before. */
        const incomingPrompt = initialPrompt || '';
        const incomingPreset = initialPreset || '';
        const incomingType = entryType ? entryType.key : '';
        const isFreshAttempt =
            (incomingPrompt && incomingPrompt !== prompt) ||
            (incomingType && incomingType !== businessType) ||
            (!incomingType && incomingPreset && incomingPreset !== presetKey);
        if (!isFreshAttempt) setAttemptResolved(true);

        if (isFreshAttempt) {
            resetAnswers();
            setDiscoveryMode('ai');
            setPrompt(incomingPrompt);
            setPresetKey(incomingPreset);
            setPresetLabel('');
            setPresetDesc('');
            setBaseModules([]);
            setCapabilities([]);
            setMatched(true);
            setEdited(null);
            setQIndex(0);
            if (!incomingPrompt && incomingType) {
                pickBusinessType(incomingType);
            } else if (!incomingPrompt && isShippablePreset(presets, incomingPreset)) {
                // Template picked on the site: straight to its reveal.
                const p = presets[incomingPreset];
                setPresetLabel(p.label || incomingPreset);
                setPresetDesc(p.description || p.blurb || '');
                setBaseModules(p.modules || []);
                setPath('preset');
                setPhase('reveal');
                analyse('', incomingPreset, {});
            } else {
                setPath('questions');
                setPhase(incomingPrompt ? 'questions' : 'intent');
                if (incomingPrompt) analyse(incomingPrompt, incomingPreset, {});
            }
            setDraft(incomingPrompt);
            setAnalysed(false);
            setAttemptResolved(true);
            return;
        }

        /* Skip re-analysing on a genuine restored attempt — a returning visit
           already has a resolved preset in sessionStorage (or is mid-questions
           with none yet, which is also fine), and re-running this would
           overwrite it with a fresh match built from an empty `answers`
           object, quietly undoing whatever the questions had already found. */
        if (analysed || presetKey || baseModules.length) {
            /* Exception: a one-click / ?preset= reveal that has not been
               resolved server-side yet (no capabilities) — resolve it once so
               the house recommendations are merged in, as provisioning will. */
            if (path === 'preset' && presetKey && !capabilities.length) {
                analyse('', presetKey, {}, businessType || null);
                return;
            }
            setAnalysed(true);
            return;
        }
        if (initialPrompt || initialPreset) analyse(initialPrompt, initialPreset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Provisioning pacer — cosmetic only; the redirect is driven by the
       response, never by this timer. */
    useEffect(() => {
        if (phase !== 'building') return;
        const t = window.setInterval(
            () => setBuildIndex((i) => Math.min(i + 1, 2)),
            900,
        );
        return () => window.clearInterval(t);
    }, [phase]);

    /* The house recommendations, resolved against the live registry. They are
       already inside `modules` (the server merges them), but they are pulled out
       here so the proposal can show them in their own labelled band. Padding a
       proposal with modules nobody asked for is only acceptable if you say so —
       see config/ai_builder.php §3b. */
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

    /* Shown once. The band owns them, so the main grid does not repeat them. */
    const gridCatalogue = useMemo(
        () => allModules.filter((m) => !recommended?.[m.key]),
        [allModules, recommended],
    );

    const catalogueByKey = useMemo(() => {
        const map = {};
        for (const m of allModules) map[m.key] = m;
        for (const c of capabilities) {
            map[c.key] = {
                ...map[c.key],
                ...c,
                description: c.desc || map[c.key]?.description,
            };
        }
        return map;
    }, [allModules, capabilities]);

    /* Hard dependencies of what is currently on. Registry-driven: a module with
       no `requires` never locks anything. */
    const locked = useMemo(() => {
        const out = {};
        for (const key of activeModules) {
            const reqs = catalogueByKey[key]?.requires || [];
            for (const dep of reqs) {
                if (activeModules.includes(dep)) {
                    out[dep] = `Required by ${catalogueByKey[key]?.label || key}`;
                }
            }
        }
        return out;
    }, [activeModules, catalogueByKey]);

    const handleAnswer = (questionKey, optionKey, opts) => {
        answer(questionKey, optionKey, opts);
        /* Re-answering re-opens the proposal. Without this, someone who edited
           the stack on the reveal screen and then went back to change an answer
           would watch their new answer do nothing at all — the exact failure
           this whole redesign exists to remove. */
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
                setPhase('reveal');
                return i;
            }
            return i + 1;
        });
    };

    /* Multi questions do not auto-advance — the user is not finished until they
       say so. Continue also RECORDS the answer even when nothing was ticked, so
       "none of these" is a real answer rather than an unanswered question. */
    const continueFromMulti = () => {
        const q = questions[qIndex];
        if (q) commitMulti(q.key);
        advance();
    };

    const startFromPrompt = (submitted) => {
        const text = (typeof submitted === 'string' ? submitted : draft).trim();
        if (!text) {
            promptRef.current?.focus();
            return;
        }
        if (text !== prompt) {
            /* A new sentence is a new attempt: re-resolve the preset in the
               background (as the landing-page path does on mount) so the side
               panel has a stack while the questions run. */
            setPrompt(text);
            setEdited(null);
            setAiProgress(0);
            setBusinessType('');
            setBusinessLabel('');
            setTerms({});
            analyse(text, '', {});
        }
        setDiscoveryMode('ai');
        setPath('questions');
        setPhase('questions');
    };

    /* ── One-click setups ─────────────────────────────────────────────────
       A business type from the catalogue, applied without a single question.
       Its preset's modules show instantly from the page props; analyse()
       then re-resolves on the server (type extras, dependencies, house
       recommendations, terminology) so the reveal matches exactly what
       provisioning will switch on. */
    function pickBusinessType(key) {
        const t = typeByKey[key];
        if (!t) return;
        const p = presets?.[t.preset] || {};
        resetAnswers();
        setEdited(null);
        setBusinessType(key);
        setBusinessLabel(t.label);
        setTerms(t.terms || {});
        setCandidates([]);
        setPresetKey(t.preset);
        setPresetLabel(p.label || t.preset);
        setPresetDesc(t.note || p.blurb || p.description || '');
        setBaseModules(p.modules || []);
        setMatched(true);
        setPath('preset');
        setPhase('reveal');
        analyse('', t.preset, {}, key);
    }

    /* Skip the rest of the questions: keep whatever was answered, use the
       standard setup for the business type matched so far, go to the reveal. */
    const skipQuestions = async () => {
        if (skipping) return;
        if (!presetKey && !baseModules.length) {
            setSkipping(true);
            await analyse(prompt || '', '', answers);
            setSkipping(false);
        }
        setPhase('reveal');
    };

    /* Default plan for the plan step: what they picked on the pricing page,
       else a size-appropriate one. Never overrides a choice they made here. */
    const suggestedPlan = useMemo(() => {
        const keys = plans.map((p) => p.key);
        if (intendedPlan && keys.includes(intendedPlan)) return intendedPlan;
        const pick = LIGHT_PRESETS.includes(presetKey) ? 'starter' : 'core';
        return keys.includes(pick) ? pick : keys[0] || '';
    }, [plans, intendedPlan, presetKey]);

    const goToPlan = () => {
        if (!planTouched) setPlanKey(suggestedPlan);
        setPhase(plans.length ? 'plan' : 'account');
    };

    const selectedPlan = plans.find((p) => p.key === planKey) || null;


    /* Instant suggestions under the sentence box — the business types the
       words so far point at. One click on one skips the questions. */
    const suggestions = useMemo(
        () => (draft.trim().length >= 3 ? rankBusinessTypes(draft, businessTypes, 3) : []),
        [draft, businessTypes],
    );

    /* What this business is called on screen: the type, else the preset when
       it was a real match — never a defaulted "Retail Shop" for a plumber. */
    const displayLabel = businessLabel || (matched ? presetLabel : '');

    const editPrompt = () => {
        setDraft(prompt || '');
        setPhase('intent');
    };

    const toggleModule = (key) => {
        const current = activeModules;
        setEdited(
            current.includes(key)
                ? current.filter((k) => k !== key)
                : [...current, key],
        );
    };

    const sendDemand = async () => {
        if (!demandText.trim()) return;
        setDemandBusy(true);
        try {
            const data = await postJson(route('workspace.demand'), {
                prompt: demandText,
                email: email || null,
                source: 'build_workspace',
            });
            if (data?.success) setDemandSent(true);
        } catch (e) {
            /* Losing a demand note must never block signup. */
        } finally {
            setDemandBusy(false);
        }
    };

    const provision = async (e) => {
        e.preventDefault();
        setProvisionError('');
        setPhase('building');
        setBuildIndex(0);
        try {
            const turnstileToken = await getTurnstileToken();
            const data = await postJson(route('workspace.provision'), {
                ...(turnstileToken ? { 'cf-turnstile-response': turnstileToken } : {}),
                business_name: businessName.trim(),
                currency,
                timezone: browserTimezone(),
                phone,
                // Signed-in users are identified by their session, not the form.
                ...(authUser ? {} : { email, password }),
                modules: activeModules,
                preset_key: presetKey || null,
                business_type: businessType || null,
                plan: planKey || null,
            });
            if (data?.success && data.redirect) {
                setBuildIndex(3);
                /* The workspace exists now — nothing left in this tab's
                   storage should outlive it. */
                forgetAttempt();
                window.setTimeout(() => {
                    window.location.href = data.redirect;
                }, 520);
                return;
            }
            setProvisionError(data?.message || 'We could not finish that. Please try again.');
            setPhase('account');
        } catch (err) {
            setProvisionError('Network problem — nothing was created. Please try again.');
            setPhase('account');
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleBusy(true);
        setProvisionError('');
        try {
            const data = await postJson(route('workspace.prepare-google'), {
                business_name: businessName.trim(),
                currency,
                timezone: browserTimezone(),
                phone,
                modules: activeModules,
                preset_key: presetKey || null,
                business_type: businessType || null,
                plan: planKey || null,
            });
            if (data && data.success === false) {
                setProvisionError(data.message || 'Please check the details above.');
                setGoogleBusy(false);
                return;
            }
            if (data?.auth_url) {
                forgetAttempt();
                window.location.href = data.auth_url;
                return;
            }
            window.location.href = route('auth.google');
        } catch (e) {
            window.location.href = route('auth.google');
        }
    };

    /* ── Progress ──────────────────────────────────────────────────────────
       Honest totals. The rail counts the screens that actually exist for this
       visitor, so someone who arrived with a sentence sees a shorter flow than
       someone who did not — because they have one. */
    const hasIntent = !initialPrompt;
    /* A one-click setup has no question screens; the rail says so. */
    const qCount = path === 'preset' ? 0 : questions.length;
    const planSteps = plans.length ? 1 : 0;
    const totalSteps = (hasIntent ? 1 : 0) + qCount + 2 + planSteps;
    const stepNow =
        phase === 'intent'
            ? 1
            : phase === 'questions'
              ? (hasIntent ? 1 : 0) +
                (discoveryMode !== 'manual'
                    ? Math.max(1, Math.round((aiProgress / 100) * questions.length))
                    : qIndex + 1)
              : phase === 'reveal'
                ? (hasIntent ? 1 : 0) + qCount + 1
                : phase === 'plan'
                  ? (hasIntent ? 1 : 0) + qCount + 2
                  : totalSteps;

    const backTarget = () => {
        if (phase === 'questions' && qIndex > 0 && discoveryMode === 'manual') return () => setQIndex((i) => i - 1);
        if (phase === 'questions') return editPrompt;
        if (phase === 'reveal' && path === 'preset') return () => setPhase('intent');
        if (phase === 'reveal' && questions.length) {
            return () => {
                setPhase('questions');
                setQIndex(Math.max(0, questions.length - 1));
            };
        }
        if (phase === 'plan') return () => setPhase('reveal');
        if (phase === 'account') return () => setPhase(plans.length ? 'plan' : 'reveal');
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

    const showStack = phase === 'questions' || phase === 'reveal';

    return (
        <>
            <Head title="Build your VenQore workspace" />
            <BuilderShell
                siteChrome
                step={stepNow}
                total={phase === 'building' ? 0 : totalSteps}
                eyebrow={displayLabel || 'Your ERP, built by AI'}
                orbState={orbState}
                onBack={phase === 'building' ? null : backTarget()}
                wide={showStack}
                footer={
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-accent-text" />
                        14-day free trial · No credit card required · Cancel anytime
                    </span>
                }
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

                        {phase === 'questions' && (
                            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs leading-relaxed text-ink-secondary">
                                    <span className="font-semibold text-ink">In a hurry?</span>{' '}
                                    Skip the questions and use the standard setup
                                    {displayLabel ? <> for <strong className="font-semibold text-ink">{displayLabel}</strong></> : ' for your business'}.
                                    Answering them gets you a closer fit.
                                </p>
                                <button
                                    type="button"
                                    onClick={skipQuestions}
                                    disabled={skipping}
                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-line bg-sunken px-3.5 text-xs font-semibold text-ink transition-colors duration-fast ease-standard hover:bg-interactive-hover disabled:opacity-60"
                                >
                                    <FastForward size={14} />
                                    {skipping ? 'Setting up…' : 'Skip questions'}
                                </button>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* ─── 1. Free text, only when the hero did not capture it ─── */}
                            {phase === 'intent' && (
                                <motion.div
                                    key="intent"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                    className="mx-auto max-w-2xl"
                                >
                                    <div className="vq-intent">
                                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-quiet px-2.5 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text">
                                            <MessageSquareText size={12} />
                                            Recommended · about a minute
                                        </span>
                                        <h1 className="vq-intent__title">
                                            Tell us what your business does.
                                        </h1>
                                        <p className="vq-intent__lede" id="vq-intent-lede">
                                            One sentence in your own words, in any language. A few
                                            quick questions after it let us fit the system to how
                                            you actually work &mdash; you can skip them at any point.
                                        </p>

                                        <PromptTextarea
                                            ref={promptRef}
                                            size="lg"
                                            value={draft}
                                            onChange={setDraft}
                                            onSubmit={startFromPrompt}
                                            maxLength={600}
                                            minRows={1}
                                            maxRows={5}
                                            autoFocus
                                            ariaLabel="Describe your business"
                                            ariaDescribedBy="vq-intent-lede"
                                            placeholder="We sell…"
                                            submitText="Start building"
                                            submitLabel="Start building"
                                            submitIcon={ArrowRight}
                                            hint={
                                                <>
                                                    <kbd>Enter</kbd> to start · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
                                                </>
                                            }
                                        />

                                        {suggestions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
                                                <span className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                                    Looks like
                                                </span>
                                                {suggestions.map((t) => (
                                                    <button
                                                        key={t.key}
                                                        type="button"
                                                        onClick={() => pickBusinessType(t.key)}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-xs font-semibold text-accent-text transition-colors duration-fast hover:bg-accent-fill hover:text-accent-on"
                                                        title="Use this setup — no questions"
                                                    >
                                                        {t.label}
                                                        <ArrowRight size={12} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="vq-intent__examples" role="group" aria-label="Examples">
                                            {EXAMPLES.map((ex) => (
                                                <button
                                                    key={ex}
                                                    type="button"
                                                    onClick={() => {
                                                        setDraft(ex);
                                                        promptRef.current?.focus();
                                                    }}
                                                    className="vq-chip"
                                                >
                                                    {ex}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {businessTypes.length > 0 && (
                                        <section className="mt-10" aria-labelledby="vq-types-title">
                                            <div className="relative flex items-center py-2">
                                                <div className="w-full border-t border-line" />
                                                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-app px-3 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                                    or skip the questions
                                                </span>
                                            </div>
                                            <h2 id="vq-types-title" className="mt-4 text-base font-semibold text-ink">
                                                Pick your business — {businessTypes.length} ready-made setups
                                            </h2>
                                            <p className="mt-1 text-sm text-ink-secondary">
                                                One click sets up the modules and the words your trade
                                                uses. You can add or remove anything before and after
                                                you sign up.
                                            </p>
                                            <BusinessTypePicker
                                                className="mt-4"
                                                types={businessTypes}
                                                sectors={sectors}
                                                selectedKey={businessType || null}
                                                onPick={pickBusinessType}
                                            />
                                        </section>
                                    )}
                                </motion.div>
                            )}

                            {/* ─── 2. The questions / AI Discovery ─────────────────── */}
                            {phase === 'questions' && (
                                discoveryMode !== 'manual' ? (
                                    attemptResolved && <ConversationalDiscovery
                                        key={`ai-discovery-${prompt || 'init'}`}
                                        initialPrompt={prompt}
                                        initialPreset={presetKey}
                                        onComplete={handleAiComplete}
                                        onFallbackToManual={() => setDiscoveryMode('manual')}
                                        onStateUpdate={handleAiStateUpdate}
                                        onProgress={handleAiProgress}
                                        onEditPrompt={editPrompt}
                                        storageKey={`${STORAGE_KEY}:converse`}
                                    />
                                ) : (
                                    questions[qIndex] && (
                                        <QuestionStep
                                            key={questions[qIndex].key}
                                            question={questions[qIndex]}
                                            value={answers[questions[qIndex].key]}
                                            onAnswer={handleAnswer}
                                            onContinue={continueFromMulti}
                                            autoAdvance={advance}
                                        />
                                    )
                                )
                            )}

                            {/* ─── 3. The reveal ────────────────────────────────────── */}
                            {phase === 'reveal' && (
                                <motion.div
                                    key="reveal"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text">
                                        <Sparkles size={12} />
                                        {displayLabel || 'Your workspace'}
                                    </span>

                                    <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                        {headline || 'Your system is ready to build.'}
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
                                        {presetDesc ||
                                            'Everything below is switched on for you. Add or remove anything — nothing here costs extra.'}
                                    </p>

                                    {/* Honest note — shown only when nothing about what was typed
                                        actually matched a trade this product has a preset for (see
                                        WorkspaceBuilderController::analyze()'s 'matched' field). The
                                        request has already been logged automatically; this just says
                                        so, instead of presenting a defaulted Retail Shop as if it were
                                        a considered recommendation. */}
                                    <TermsPreview terms={terms} className="mt-3" />

                                    {!matched && candidates.length > 0 && (
                                        <div className="mt-4 rounded-lg border border-accent bg-accent-quiet p-4">
                                            <p className="text-sm font-semibold text-ink">Did you mean one of these?</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {candidates.map((c) => (
                                                    <button
                                                        key={c.key}
                                                        type="button"
                                                        onClick={() => pickBusinessType(c.key)}
                                                        className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink hover:border-accent"
                                                    >
                                                        {c.label}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setPhase('intent')}
                                                    className="rounded-full px-3 py-1 text-xs font-semibold text-accent-text underline-offset-4 hover:underline"
                                                >
                                                    See all {businessTypes.length}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!matched && !candidates.length && (
                                        <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
                                            <Compass size={16} className="mt-0.5 shrink-0 text-ink-muted" />
                                            <p className="text-sm leading-relaxed text-ink-secondary">
                                                We don&rsquo;t have a ready-made template for what you
                                                described yet, so this is a general starting point you
                                                can fully customise below — nothing here is final.
                                                We&rsquo;ve noted what you told us for what to build
                                                next.{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setPhase('intent')}
                                                    className="font-semibold text-accent-text underline-offset-4 hover:underline"
                                                >
                                                    Pick from all {businessTypes.length} business types
                                                </button>
                                            </p>
                                        </div>
                                    )}

                                    {recommendedList.length > 0 && (
                                        <RecommendedBand
                                            items={recommendedList}
                                            active={activeModules}
                                            onToggle={toggleModule}
                                        />
                                    )}

                                    <div className="mt-7">
                                        <div className="mb-3 flex items-baseline justify-between gap-4">
                                            <h2 className="text-sm font-semibold text-ink">
                                                What your workspace can do
                                            </h2>
                                            <span className="text-2xs text-ink-muted">
                                                Tap to add or remove
                                            </span>
                                        </div>
                                        <ModuleGrid
                                            catalogue={gridCatalogue}
                                            active={activeModules}
                                            locked={locked}
                                            onToggle={toggleModule}
                                        />
                                    </div>

                                    {/* Demand log — the roadmap and the warm list, in one box. */}
                                    <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                                        {demandSent ? (
                                            <p className="flex items-center gap-2 text-sm text-ink">
                                                <Check size={15} className="text-accent-text" />
                                                Noted — thank you. We read every one of these.
                                            </p>
                                        ) : demandOpen ? (
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <input
                                                    type="text"
                                                    value={demandText}
                                                    onChange={(e) => setDemandText(e.target.value)}
                                                    placeholder="What does your business need that you don't see?"
                                                    className="h-11 flex-1 rounded-md border border-line bg-app px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={demandBusy}
                                                    onClick={sendDemand}
                                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-sunken px-4 text-xs font-semibold text-ink transition-colors duration-fast ease-standard hover:bg-interactive-hover"
                                                >
                                                    <Send size={14} />
                                                    Send
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDemandOpen(true)}
                                                className="text-xs font-semibold text-accent-text underline-offset-4 hover:underline"
                                            >
                                                Something missing for your line of work? Tell us →
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <button
                                            type="button"
                                            onClick={goToPlan}
                                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                                        >
                                            <Rocket size={16} />
                                            Build this workspace
                                            <ArrowRight size={16} />
                                        </button>
                                        {path === 'preset' ? (
                                            <button
                                                type="button"
                                                onClick={() => setPhase('intent')}
                                                className="text-xs font-semibold text-accent-text underline-offset-4 hover:underline"
                                            >
                                                Pick a different business type
                                            </button>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── 4. Plan (skippable) ─────────────────────────────────
                                Every plan starts on the same 14-day trial; this
                                only records which one they expect to continue
                                on, so Billing can offer it first. "Decide later"
                                is a first-class answer, not a hidden link. */}
                            {phase === 'plan' && (
                                <motion.div
                                    key="plan"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                    className="mx-auto max-w-3xl"
                                >
                                    <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                                        Pick a plan for after your trial.
                                    </h1>
                                    <p className="mt-3 text-base text-ink-secondary">
                                        You get 14 days free on any plan, with no card needed now.
                                        Not sure? Skip this and decide before the trial ends.
                                    </p>

                                    <div className="mt-7 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
                                        {plans.map((p) => {
                                            const on = planKey === p.key;
                                            return (
                                                <button
                                                    key={p.key}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={on}
                                                    onClick={() => {
                                                        setPlanKey(p.key);
                                                        setPlanTouched(true);
                                                    }}
                                                    className={`relative flex flex-col rounded-lg border p-4 text-left transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                                        on
                                                            ? 'border-accent bg-accent-quiet'
                                                            : 'border-line bg-surface hover:border-line-strong'
                                                    }`}
                                                >
                                                    <span className="flex items-start justify-between gap-3">
                                                        <span>
                                                            <span className="block text-sm font-semibold text-ink">{p.name}</span>
                                                            <span className="mt-0.5 block font-display text-2xl font-semibold text-ink">
                                                                {p.price_monthly > 0 ? `$${p.price_monthly}` : 'Free'}
                                                                {p.price_monthly > 0 && (
                                                                    <span className="text-xs font-medium text-ink-muted"> /mo</span>
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                                on ? 'border-accent bg-accent-fill text-accent-on' : 'border-line-strong'
                                                            }`}
                                                        >
                                                            {on && <Check size={12} strokeWidth={3} />}
                                                        </span>
                                                    </span>
                                                    {p.badge && (
                                                        <span className="mt-2 inline-flex w-fit rounded-full bg-sunken px-2 py-0.5 text-3xs font-bold uppercase tracking-widest text-ink-secondary">
                                                            {p.badge}
                                                        </span>
                                                    )}
                                                    <ul className="mt-3 space-y-1">
                                                        {(p.points || []).map((pt) => (
                                                            <li key={pt} className="flex items-center gap-2 text-xs text-ink-secondary">
                                                                <Check size={12} className="shrink-0 text-accent-text" />
                                                                {pt}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {p.price_annual ? (
                                                        <span className="mt-3 text-3xs text-ink-muted">
                                                            or ${p.price_annual}/yr billed annually
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-3 text-2xs text-ink-muted">
                                        Prices in USD. Local pricing, if available, is shown at checkout.
                                    </p>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <button
                                            type="button"
                                            onClick={() => setPhase('account')}
                                            disabled={!planKey}
                                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60 sm:w-auto"
                                        >
                                            {selectedPlan ? `Continue with ${selectedPlan.name}` : 'Continue'}
                                            <ArrowRight size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPlanKey('');
                                                setPlanTouched(true);
                                                setPhase('account');
                                            }}
                                            className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors duration-fast hover:bg-interactive-hover"
                                        >
                                            Skip — decide later
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── 5. Account ───────────────────────────────────────── */}
                            {phase === 'account' && (
                                <motion.form
                                    key="account"
                                    onSubmit={provision}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                    className="mx-auto max-w-xl"
                                >
                                    <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                                        Save your workspace.
                                    </h1>
                                    <p className="mt-3 text-base text-ink-secondary">
                                        {activeModules.length} modules, configured.{' '}
                                        {authUser ? 'Name it and it is ready.' : 'Name it, create a login, and it is yours.'}
                                    </p>

                                    {license && (
                                        <p className="mt-4 flex items-center gap-2 rounded-md border border-accent bg-accent-quiet px-4 py-2.5 text-xs text-ink">
                                            <ShieldCheck size={14} className="shrink-0 text-accent-text" />
                                            This workspace runs on your <strong className="font-semibold">{license.label}</strong> license.
                                        </p>
                                    )}

                                    {plans.length > 0 && (
                                        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-2.5 text-xs">
                                            <span className="text-ink-secondary">
                                                After the trial:{' '}
                                                <strong className="font-semibold text-ink">
                                                    {selectedPlan
                                                        ? `${selectedPlan.name} · ${selectedPlan.price_monthly > 0 ? `$${selectedPlan.price_monthly}/mo` : 'Free'}`
                                                        : 'decide later'}
                                                </strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setPhase('plan')}
                                                className="font-semibold text-accent-text underline-offset-4 hover:underline"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}

                                    {/* Business details — formerly their own screen. Only the
                                        name matters now, and even that has a default. */}
                                    <div className="mt-6 space-y-4">
                                        <Field label="Business name" icon={Building2}>
                                            <input
                                                type="text"
                                                value={businessName}
                                                onChange={(e) => setBusinessName(e.target.value)}
                                                placeholder="e.g. Rahman Trading Co. (you can change it later)"
                                                autoComplete="organization"
                                                className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                            />
                                        </Field>

                                        <div className={showPhone ? 'grid gap-4 sm:grid-cols-2' : ''}>
                                            <CurrencyDropdown value={currency} onChange={setCurrency} />
                                            {showPhone && (
                                                <Field label="Phone (optional)" icon={Phone}>
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="For receipts"
                                                        autoComplete="tel"
                                                        className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                                    />
                                                </Field>
                                            )}
                                        </div>
                                        {!showPhone && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPhone(true)}
                                                className="text-xs font-semibold text-accent-text underline-offset-4 hover:underline"
                                            >
                                                + Add a phone number for receipts (optional)
                                            </button>
                                        )}
                                    </div>

                                    {authUser ? (
                                        <p className="mt-7 flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-secondary">
                                            <ShieldCheck size={15} className="shrink-0 text-accent-text" />
                                            Signed in as <strong className="font-semibold text-ink">{authUser.email}</strong> — this workspace will be added to your account.
                                        </p>
                                    ) : (
                                        <div className="mt-7 space-y-4">
                                            <button
                                                type="button"
                                                disabled={googleBusy}
                                                onClick={handleGoogleSignUp}
                                                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-sm transition-all duration-fast hover:bg-interactive-hover hover:border-line-strong active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                            >
                                                <GoogleMark />
                                                <span>{googleBusy ? 'Connecting to Google…' : 'Continue with Google'}</span>
                                            </button>
    
                                            <div className="relative flex items-center py-2">
                                                <div className="w-full border-t border-line" />
                                                <span className="absolute left-1/2 -translate-x-1/2 bg-app px-3 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                                    or continue with email
                                                </span>
                                            </div>
    
                                            <Field label="Email" icon={Mail}>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="email"
                                                    className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                                />
                                            </Field>
                                            <Field label="Password" icon={Lock}>
                                                <input
                                                    type="password"
                                                    required
                                                    minLength={8}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                                />
                                            </Field>
                                        </div>
                                    )}

                                    {provisionError && (
                                        <p className="mt-4 rounded-md border border-danger-300 bg-danger-50 px-4 py-3 text-xs text-danger-700">
                                            {provisionError}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                    >
                                        <Rocket size={16} />
                                        {authUser ? 'Create workspace' : 'Create my workspace'}
                                    </button>
                                </motion.form>
                            )}

                            {/* ─── 6. Building ──────────────────────────────────────── */}
                            {phase === 'building' && (
                                <motion.div
                                    key="building"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mx-auto max-w-md text-center"
                                >
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center">
                                        <ThinkingOrb
                                            state="solving"
                                            size={80}
                                            aria-label="Building your workspace"
                                        />
                                    </div>
                                    <h2 className="mt-6 font-display text-2xl font-semibold text-ink">
                                        Building your workspace
                                    </h2>
                                    <ul className="mt-6 space-y-2.5 text-left">
                                        {[
                                            'Opening your ledger',
                                            'Switching on your modules',
                                            'Naming things the way you do',
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

                                    {/* The one moment a user is both committed
                                        and idle. Spending it on a spinner is a
                                        waste of the best teaching slot in the
                                        product. */}
                                    <HandoffTips className="mt-8" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* The panel that makes the questions worth asking. */}
                    {showStack && (
                        <div className="sticky top-6 hidden max-h-[calc(100vh-3rem)] flex-col gap-3.5 lg:flex">
                            <LiveStack
                                modules={activeModules}
                                catalogue={catalogueByKey}
                                attribution={attribution}
                                lastAnswer={lastAnswer}
                                className="max-h-[68vh]"
                            />
                            {phase === 'reveal' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <button
                                        type="button"
                                        onClick={goToPlan}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-all duration-normal ease-standard hover:bg-accent-fill-hover hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                    >
                                        <Rocket size={16} />
                                        Build this workspace
                                        <ArrowRight size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </BuilderShell>
        </>
    );
}

/** Custom styled currency dropdown. */
function CurrencyDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedCurrency = useMemo(() => {
        return CURRENCY_LIST.find((c) => c.code === value) || {
            code: value || 'USD',
            symbol: '$',
            name: value || 'US Dollar',
            flag: '🌐',
        };
    }, [value]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    return (
        <div ref={containerRef} className="relative block">
            <span className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                Currency
            </span>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`relative flex h-12 w-full items-center justify-between rounded-md border bg-surface px-3.5 text-left text-sm text-ink transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-focus ${
                    open ? 'border-accent ring-2 ring-focus' : 'border-line hover:border-line-strong'
                }`}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="flex items-center gap-2.5 truncate">
                    <span className="text-base leading-none">{selectedCurrency.flag}</span>
                    <span className="font-semibold text-ink">{selectedCurrency.code}</span>
                    <span className="text-xs text-ink-secondary">({selectedCurrency.symbol})</span>
                    <span className="hidden truncate text-xs text-ink-muted sm:inline">
                        — {selectedCurrency.name}
                    </span>
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-muted transition-transform duration-fast ${
                        open ? 'rotate-180 text-ink' : ''
                    }`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-xl"
                        role="listbox"
                    >
                        {CURRENCY_LIST.map((c) => {
                            const isSelected = c.code === selectedCurrency.code;
                            return (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(c.code);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs transition-colors duration-fast ${
                                        isSelected
                                            ? 'bg-accent-quiet font-semibold text-accent-text'
                                            : 'text-ink hover:bg-surface-raised'
                                    }`}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <span className="flex items-center gap-2.5 truncate">
                                        <span className="text-sm leading-none">{c.flag}</span>
                                        <span className="font-semibold">{c.code}</span>
                                        <span className="text-2xs text-ink-muted">({c.symbol})</span>
                                        <span className="truncate text-ink-secondary">{c.name}</span>
                                    </span>
                                    {isSelected && <Check size={14} className="shrink-0 text-accent-text" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Google's mark with official colours. */
function GoogleMark() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

/** Labelled control with a leading glyph. */
function Field({ label, icon: Icon, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                {label}
            </span>
            <span className="relative block">
                <Icon
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                {children}
            </span>
        </label>
    );
}
