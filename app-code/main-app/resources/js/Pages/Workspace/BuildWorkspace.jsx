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
    MessageSquareText, Phone, Rocket, Send, ShieldCheck, Sliders, Sparkles,
} from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import useTurnstile from '@/Components/Builder/useTurnstile';
import BusinessTypePicker from '@/Components/Builder/BusinessTypePicker';
import BuilderV2 from '@/Components/Builder/v2/BuilderV2';
import { post as postV2 } from '@/Components/Builder/v2/api';
import { rankBusinessTypes } from '@/Components/Builder/matchBusinessTypes';
import {
    BuilderShell,
    ConversationalDiscovery,
    GiftBundle,
    HandoffTips,
    ModuleCatalog,
    moduleGlyph,
    PromptTextarea,
    QuestionStep,
    useDiscovery,
    useSessionState,
    isAnswered,
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
    gifts = null,
    companions = {},
    builderV2 = false,
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
    /* Why each module is here, in the visitor's own words — present only when
       the server actually read the sentence (see BusinessUnderstanding). Empty
       on the deterministic path, and the panel then shows what each module does
       instead of inventing a reason. */
    const [reasons, setReasons] = useSessionState(`${STORAGE_KEY}:reasons`, {});
    /* Things they asked for that this product does not do yet. Named on the
       reveal rather than quietly approximated with a module that does something
       else — the demand log already records them. */
    const [unsupported, setUnsupported] = useSessionState(`${STORAGE_KEY}:unsupported`, []);
    const [analysed, setAnalysed] = useState(false);

    const legalKeys = useMemo(() => allModules.map((m) => m.key), [allModules]);

    const {
        questions, answers, answer, commitMulti, modules: proposedModules,
        attribution, headline, forget: forgetAnswers, reset: resetAnswers,
    } = useDiscovery(discovery, baseModules, legalKeys, STORAGE_KEY, presetKey);

    /* The user's own edits on the reveal screen override the proposal. Until
       they touch it, the proposal flows straight through. */
    const [edited, setEdited] = useSessionState(`${STORAGE_KEY}:edited`, null);
    /* Someone who already knows what they want should not be interviewed. The
       blank slate skips every question and opens the full list with nothing
       chosen, so the whole setup is however many taps they feel like. */
    const [blankSlate, setBlankSlate] = useSessionState(`${STORAGE_KEY}:blankSlate`, false);
    /* ── Free extras (config/signup_gifts.php) ───────────────────────────
       null = not touched: the defaults decide (always / sells_goods). Once the
       visitor taps one it becomes an explicit list and is never second-guessed.
       Claimed gifts are UNIONED into the module set, so a gift survives the
       visitor editing the stack, re-answering a question or skipping ahead. */
    const giftItems = useMemo(() => gifts?.items || [], [gifts]);
    const giftKeys = useMemo(() => giftItems.map((g) => g.key), [giftItems]);
    const [giftChoice, setGiftChoice] = useSessionState(`${STORAGE_KEY}:gifts`, null);
    /* Companions (config/module_companions.php): buy from suppliers → you
       will also return things to them. Folded into the PROPOSAL, one hop, so
       they show on the review with a reason and the visitor can still switch
       any of them off (an edit replaces the proposal, as before). */
    const companionWhy = useMemo(() => {
        const out = {};
        for (const k of proposedModules || []) {
            for (const [to, why] of Object.entries(companions?.[k] || {})) {
                if (!(proposedModules || []).includes(to) && !out[to]) out[to] = why;
            }
        }
        return out;
    }, [proposedModules, companions]);
    const proposedWithCompanions = useMemo(
        () => Array.from(new Set([...(proposedModules || []), ...Object.keys(companionWhy)])),
        [proposedModules, companionWhy],
    );
    const [v2Session, setV2Session] = useSessionState(`${STORAGE_KEY}:v2session`, '');
    const [v2Modules, setV2Modules] = useSessionState(`${STORAGE_KEY}:v2modules`, []);
    const baseActive = edited ?? proposedWithCompanions;
    const sellsGoods = (baseActive || []).includes('products');
    const claimedGifts = useMemo(() => {
        // Builder v2: the server's module list is the truth, so what was added on the preview is still ticked here.
        if (v2Session) return giftKeys.filter((k) => (v2Modules || []).includes(k));
        if (Array.isArray(giftChoice)) return giftChoice.filter((k) => giftKeys.includes(k));
        if (blankSlate) return [];
        return giftItems
            .filter((g) => g.default_on === 'always' || (g.default_on === 'sells_goods' && sellsGoods))
            .map((g) => g.key);
    }, [v2Session, v2Modules, giftChoice, giftKeys, giftItems, sellsGoods, blankSlate]);
    const toggleGift = async (key) => {
        if (v2Session) {
            // The server owns the module list: ask it, then take its answer back.
            const r = await postV2('override', { session_id: v2Session, module: key, action: claimedGifts.includes(key) ? 'remove' : 'add' });
            if (r.ok && Array.isArray(r.data?.modules)) setV2Modules(r.data.modules);
            return;
        }
        setGiftChoice(claimedGifts.includes(key) ? claimedGifts.filter((k) => k !== key) : [...claimedGifts, key]);
    };
    /* Builder v2: the SERVER composed these. The old gift/override logic never touches them. */
    const legacyActive = useMemo(
        () => Array.from(new Set([...(baseActive || []).filter((k) => !giftKeys.includes(k)), ...claimedGifts])),
        [baseActive, giftKeys, claimedGifts],
    );
    const activeModules = v2Session ? v2Modules : legacyActive;
    /* Guided by default: the hand-picked catalogue opens only on request
       ("In a hurry? Choose modules myself") or on the blank slate. */
    const [customising, setCustomising] = useSessionState(`${STORAGE_KEY}:customising`, false);
    /* True once they have gone round the "make it yours" questions (or skipped
       out of them). The reveal then becomes a plain review — "here is everything
       we think is right, add what you like" — and stops offering more questions. */
    const [deepRound, setDeepRound] = useSessionState(`${STORAGE_KEY}:deepRound`, false);
    const reviewMode = deepRound && !blankSlate;
    const showCatalog = customising || blankSlate || reviewMode;
    const catalogRef = useRef(null);
    const openCatalog = () => {
        setCustomising(true);
        window.setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };

    const [discoveryMode, setDiscoveryMode] = useSessionState(`${STORAGE_KEY}:discoveryMode`, 'ai');

    /* The intent box edits a local draft, not the persisted `prompt`. A draft
       that was never submitted must not greet someone who comes back via the
       browser's back button — only real mid-flow state is restored. So the
       draft starts empty when nothing has ever been submitted, and otherwise
       always starts from the last submitted sentence — whether this visit
       resumed past intent (Back/Edit lands on a box holding what was sent),
       or resumed ON intent itself, which happens whenever someone used Back
       to reconsider their sentence and then actually left (closed the tab,
       navigated away) before resubmitting. Gating this on rawPhase !== 'intent'
       used to blank the box in exactly that case: `prompt` still held their
       sentence in sessionStorage, but a fresh mount landing on a persisted
       'intent' phase threw it away for no reason — the one persistence gap
       'going back' could actually walk someone into. */
    const [draft, setDraft] = useState(() => prompt || '');

    /* The conversational flow reports its own readiness (0–100); the shell's
       rail reads it so the bar moves while the AI asks. Never goes backwards. */
    const [aiProgress, setAiProgress] = useState(0);

    /* Is what arrived on THIS page load a new attempt, or the one this tab is
       already in the middle of? Both the first render and the mount effect need
       the answer, computed from the same hydrated values, so it lives here
       rather than inside the effect. See the long note on the effect itself. */
    const isFreshAttempt = () => {
        const incomingPrompt = initialPrompt || '';
        const incomingPreset = initialPreset || '';
        const incomingType = entryType ? entryType.key : '';

        return Boolean(
            (incomingPrompt && incomingPrompt !== prompt) ||
            (incomingType && incomingType !== businessType) ||
            (!incomingType && incomingPreset && incomingPreset !== presetKey),
        );
    };

    /* The conversation must not mount on a `prompt` that the mount effect is
       about to replace — that would flash, and resume, the PREVIOUS business's
       conversation for one frame. Only a FRESH attempt rewrites `prompt`, and
       whether this is one is knowable on the first render, so a resume clears
       this gate immediately (one frame earlier than it used to) and only a
       fresh attempt waits for the effect to finish resetting. Evaluated once,
       in an initialiser: re-deriving it later would read the values the effect
       has already rewritten and answer a different question. */
    const [attemptResolved, setAttemptResolved] = useState(() => !isFreshAttempt());
    const handleAiProgress = (pct) => {
        if (typeof pct === 'number') setAiProgress((p) => Math.max(p, Math.min(100, pct)));
    };

    /* The finished conversation, kept so the reveal can reopen it for a
       deeper round. `turns` is how many questions were actually asked, which
       decides whether offering more is honest or just nagging. */
    const [aiSession, setAiSession] = useSessionState(`${STORAGE_KEY}:aiSession`, null);
    /* The deeper round, written-question form. The AI's pool is the capability
       registry filtered to this trade, and round one's tick lists usually
       settle most of it — so "a few more questions" often found nothing left
       and jumped straight to the review. When that happens the round continues
       with the written question bank instead: only questions that could still
       switch something on, at most DEEP_LIMIT of them, each skippable.
       deepCurrent = the question on screen (frozen, so answering it cannot swap
       it out); deepSeen = keys already shown this round. */
    const [deepCurrent, setDeepCurrent] = useSessionState(`${STORAGE_KEY}:deepCurrent`, null);
    const [deepSeen, setDeepSeen] = useSessionState(`${STORAGE_KEY}:deepSeen`, []);
    const [deepening, setDeepening] = useState(false);

    const handleAiComplete = (proposal, modules, preset, meta = {}) => {
        if (meta.sessionId) setAiSession({ id: meta.sessionId, turns: meta.turns || 0 });
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
    /* (Deep round via AI that ends having asked very little is handled by the
       server's MIN_ROUND_TURNS; the written fallback above covers the case
       where it asks nothing at all.) */

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
        try { window.sessionStorage.removeItem('vq-builder-v2'); } catch (e) { /* nothing to clean up */ }
        [
            'phase', 'qIndex', 'prompt', 'presetKey', 'presetLabel',
            'presetDesc', 'baseModules', 'capabilities', 'edited', 'matched',
            'converse', 'discoveryMode', 'path', 'planKey', 'planTouched',
            'businessType', 'businessLabel', 'terms', 'candidates',
            'v2session', 'v2modules', 'reasons', 'unsupported', 'blankSlate', 'aiSession', 'customising', 'deepRound', 'gifts', 'deepCurrent', 'deepSeen',
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
        builderV2 && (rawPhase === 'intent' || rawPhase === 'questions' || rawPhase === 'reveal')
            ? 'v2'
            :
        /* Only the written questions can be "empty". In AI mode the questions come
           from the conversation, not from `questions` — treating an empty written
           list as "nothing to ask" bounced every AI round straight back here. */
        rawPhase === 'questions' && discoveryMode === 'manual' && questions.length === 0
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

    /* Roadmap notice — an unsupported request is a named person who told us
       what to build next AND who to tell when it exists. The same demand log
       the rest of this page writes to, with an address attached. */
    const [notifyEmail, setNotifyEmail] = useState('');
    const [notifyBusy, setNotifyBusy] = useState(false);
    const [notifySent, setNotifySent] = useState(false);

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
            setReasons(data.reasons && typeof data.reasons === 'object' ? data.reasons : {});
            setUnsupported(Array.isArray(data.unsupported) ? data.unsupported : []);
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
        /* The resume case needs nothing announced here: `attemptResolved` was
           initialised true for it on the first render. */
        if (isFreshAttempt()) {
            resetAnswers();
            setDiscoveryMode('ai');
            setPrompt(incomingPrompt);
            setPresetKey(incomingPreset);
            setPresetLabel('');
            setPresetDesc('');
            setBaseModules([]);
            setCapabilities([]);
            setReasons({});
            setUnsupported([]);
            setBlankSlate(false);
            setDeepRound(false);
            setCustomising(false);
            setGiftChoice(null);
            /* The trade and its vocabulary belong to the attempt that resolved
               them. Leaving them behind is why a tab that once described a
               plumbing business kept telling the NEXT description that its
               workspace would say Job, Client, Plumber and Material — the
               reveal was reading words the previous attempt had left in
               sessionStorage. */
            setBusinessType('');
            setBusinessLabel('');
            setTerms({});
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
            /* This whole branch is "a new attempt arrived on the URL, reset for
               it" — a dozen pieces of state plus sessionStorage plus a network
               match, in response to props rather than to a render. There is no
               render-time form of that, and the resume path (the common one)
               no longer passes through here at all. */
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    /* Shown once. The band owns them, so the main grid does not repeat them.
       Arranged by business type relevance: modules belonging to the matched business
       type / preset are placed first, with less relevant modules at the bottom.
       Critically, this arrangement is computed ONCE per business profile and does NOT
       shift when individual cards are toggled on or off. */
    const gridCatalogue = useMemo(() => {
        const available = allModules.filter((m) => !recommended?.[m.key]);
        const primarySet = new Set([...(baseModules || []), ...(presets?.[presetKey]?.modules || [])]);
        return [...available].sort((a, b) => {
            const aPrimary = primarySet.has(a.key);
            const bPrimary = primarySet.has(b.key);
            if (aPrimary && !bPrimary) return -1;
            if (!aPrimary && bPrimary) return 1;
            return 0; // retain stable natural catalog order within each tier
        });
    }, [allModules, recommended, baseModules, presets, presetKey]);

    /* What we recommend, keyed for the catalogue badge: the proposal itself
       plus the house suggestions, each with its reason when we have one. */
    const recommendedWhy = useMemo(() => {
        const out = {};
        for (const k of proposedModules || []) out[k] = (reasons && typeof reasons[k] === 'string' && reasons[k]) || true;
        for (const r of recommendedList) out[r.key] = r.why || out[r.key] || true;
        for (const [k, why] of Object.entries(companionWhy)) if (!out[k] || out[k] === true) out[k] = why;
        return out;
    }, [proposedModules, reasons, recommendedList, companionWhy]);
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

    const catalogueModules = useMemo(
        () => allModules.map((m) => ({ ...m, ...(catalogueByKey[m.key] || {}), group: m.group })),
        [allModules, catalogueByKey],
    );
    const recommendedSetup = useMemo(
        () => (proposedWithCompanions || []).map((k) => catalogueByKey[k]).filter(Boolean),
        [proposedWithCompanions, catalogueByKey],
    );
    const changedCount = useMemo(() => {
        if (edited === null) return 0;
        const a = new Set(proposedWithCompanions || []), b = new Set(edited);
        let n = 0;
        for (const k of a) if (!b.has(k)) n++;
        for (const k of b) if (!a.has(k)) n++;
        return n;
    }, [edited, proposedWithCompanions]);

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

    /* `advance` runs from a 460ms timeout after a single-select (see
       QuestionStep) and straight after commitMulti on a multi — in both cases
       from a render that predates the answer which triggered it. Reading
       `questions` out of that closure meant an answer that REVEALS a follow-up
       question (show_if) could still be measured against the shorter list it
       replaced, and the flow would call itself finished and jump to the reveal
       with the follow-up never asked. Refs refreshed every render below give
       it the list and position that actually exist when it runs.

       It also no longer calls setPhase from inside a setQIndex updater: state
       updaters must be pure, and React is free to run them twice. */
    const questionsRef = useRef(questions);
    const qIndexRef = useRef(qIndex);
    const deepCurrentRef = useRef(deepCurrent);
    const deepSeenRef = useRef(deepSeen);
    const activeRef = useRef(activeModules);
    const answersRef = useRef(answers);
    useEffect(() => {
        questionsRef.current = questions;
        qIndexRef.current = qIndex;
        deepCurrentRef.current = deepCurrent;
        deepSeenRef.current = deepSeen;
        activeRef.current = activeModules;
        answersRef.current = answers;
    });

    /* Could this question still change the setup? Only if at least one module
       any of its answers would switch on is not on already. A question that
       cannot move the stack is not worth anyone's time. */
    const DEEP_LIMIT = 5;
    const canStillAdd = (q, active) => {
        const implies = q?.implies || {};
        const mods = Object.values(implies).flat();
        return mods.some((k) => !active.includes(k));
    };
    const pickDeepQuestion = (seen) =>
        (questionsRef.current || []).find(
            (q) =>
                q.key !== 'what' &&
                !seen.includes(q.key) &&
                !isAnswered(q, answersRef.current || {}) &&
                canStillAdd(q, activeRef.current || []),
        ) || null;
    const nextDeepQuestion = () => {
        const seen = deepCurrentRef.current
            ? Array.from(new Set([...(deepSeenRef.current || []), deepCurrentRef.current]))
            : deepSeenRef.current || [];
        setDeepSeen(seen);
        const next = seen.length < DEEP_LIMIT ? pickDeepQuestion(seen) : null;
        if (!next) {
            setDeepCurrent(null);
            setDiscoveryMode('ai');
            setPhase('reveal');
            return;
        }
        setDeepCurrent(next.key);
    };
    /* Begin the written deeper round. Returns false when there is genuinely
       nothing left that could change the setup. */
    const startDeepWritten = () => {
        const first = pickDeepQuestion([]);
        if (!first) return false;
        setDeepSeen([]);
        setDeepCurrent(first.key);
        setDiscoveryMode('manual');
        setPhase('questions');
        return true;
    };

    const advance = () => {
        if (deepCurrentRef.current) {
            nextDeepQuestion();
            return;
        }
        const next = qIndexRef.current + 1;
        if (next >= questionsRef.current.length) {
            setPhase('reveal');
            return;
        }
        setQIndex(next);
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
        setBlankSlate(false);
        setDeepRound(false);   // a new sentence starts the first round again
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
        setDeepRound(false);
        setAiSession(null);
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

    /* Whatever the AI has already confirmed this attempt (capabilities) is
       kept separately from baseModules for display purposes only (see
       catalogueByKey) — it was never folded into the actual module set. That
       was invisible as long as the AI conversation always ran to completion
       (handleAiComplete does the folding itself), but the moment someone
       leaves early — switches to manual, or hits Skip — baseModules still
       only reflects the ORIGINAL one-sentence match, and every answer given
       to the AI in between is silently dropped. Call this before leaving AI
       mid-conversation so "switch" or "skip" never means "forget". Safe to
       call whenever: merging an already-merged key is a no-op. */
    const foldInConfirmedCapabilities = () => {
        if (!capabilities.length) return;
        setBaseModules((prev) => {
            const merged = [...(prev || [])];
            for (const c of capabilities) {
                if (c?.key && !merged.includes(c.key)) merged.push(c.key);
            }
            return merged;
        });
    };

    /* Hand off from AI to manual without losing progress — see
       foldInConfirmedCapabilities above. This is the only place discoveryMode
       should be set to 'manual'; the AI panel's own "manual setup" link and
       the toggle below both call this rather than setDiscoveryMode directly. */
    const switchToManual = () => {
        foldInConfirmedCapabilities();
        setDiscoveryMode('manual');
    };

    /* "I'll pick them myself." No questions, no proposal, no starting set —
       the full catalogue with nothing ticked. Distinct from the AI/manual
       toggle above it, which is about who asks the questions; this is about
       not being asked any. */
    const openBlankSlate = () => {
        setEdited([]);
        setBlankSlate(true);
        setPath('preset');
        setPhase('reveal');
    };

    /* Skip the rest of the questions: keep whatever was answered, use the
       standard setup for the business type matched so far, go to the reveal. */
    const skipQuestions = async () => {
        if (skipping) return;
        if (!presetKey && !baseModules.length) {
            setSkipping(true);
            await analyse(prompt || '', '', answers);
            setSkipping(false);
        }
        foldInConfirmedCapabilities();
        setDeepCurrent(null);
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
        if (giftKeys.includes(key)) {
            toggleGift(key);
            return;
        }
        const current = activeModules;
        setEdited(
            current.includes(key)
                ? current.filter((k) => k !== key)
                : [...current, key],
        );
    };

    const selectAllModules = () => {
        const allKeys = allModules.map((m) => m.key);
        setEdited(Array.from(new Set([...activeModules, ...allKeys])));
        setGiftChoice(giftKeys);
    };

    const deselectAllModules = () => {
        // Keep locked modules (dependencies) if any
        const lockedKeys = Object.keys(locked || {});
        setEdited(lockedKeys);
        setGiftChoice([]);
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

    /* "Make it closer." Continues the same conversation with the questions it
       did not get to, rather than starting again. Only offered after they have
       seen what their first answers produced — that is the point at which
       asking for more of someone's time is a fair trade rather than a form. */
    /* Ask the server for the next round of questions and hand the first one to
       the conversation screen. Returns 'ok' | 'none' | 'error'.
       Two things were missing before, and either alone made the button do
       nothing: the route is behind the security check (it needs the same token
       /start sends), and the question it returned was thrown away — the
       conversation screen then found nothing to resume and began again. */
    const CONVERSE_SLOT = `${STORAGE_KEY}:converse`;
    const deepenQuestions = async () => {
        if (!aiSession?.id) return 'error';
        setDeepening(true);
        try {
            const token = await getTurnstileToken();
            const data = await postJson(route('workspace.converse.deepen'), {
                session_id: aiSession.id,
                ...(token ? { 'cf-turnstile-response': token } : {}),
            });
            const question = ((data && (data.question || data.assistant_message)) || '').trim();
            if (data?.ok && question && !data.fallback && !data.is_complete) {
                let stored = {};
                try { stored = JSON.parse(window.sessionStorage.getItem(CONVERSE_SLOT) || '{}') || {}; } catch (e) { stored = {}; }
                const seed = {
                    ...stored,
                    prompt: (prompt || '').trim() || 'I want to set up a new workspace for my business.',
                    sessionId: data.session_id || aiSession.id,
                    history: stored.history || [],
                    current: {
                        question,
                        hint: data.question_hint || null,
                        options: Array.isArray(data.quick_options) ? data.quick_options.slice(0, 5) : [],
                        notice: null,
                        opener: false,
                        multi: !!data.is_multi,
                    },
                };
                try { window.sessionStorage.setItem(CONVERSE_SLOT, JSON.stringify(seed)); } catch (e) { /* the screen will start a fresh round instead */ }
                return 'ok';
            }
            if (data?.is_complete) return 'none';
            return 'error';
        } catch (e) {
            return 'error';
        } finally {
            setDeepening(false);
        }
    };

    /* "Continue — a few more questions". Continues the conversation they have
       if there is one, otherwise opens a fresh one for this business. */
    const refineWithQuestions = async () => {
        if (deepening) return;
        setBlankSlate(false);
        setDeepRound(true);
        setDiscoveryMode('ai');
        setPath('questions');
        setDeepCurrent(null);
        setDeepSeen([]);
        if (aiSession?.id) {
            const result = await deepenQuestions();
            if (result === 'ok') { setPhase('questions'); return; }
        }
        /* The AI had nothing left to ask (or could not continue). Carry on with
           the written questions rather than skipping to the review — they
           asked for more questions, so they get them. */
        if (startDeepWritten()) return;
        setPhase('reveal');
    };

    const requestNotify = async () => {
        const address = notifyEmail.trim();
        if (!address || notifyBusy) return;
        setNotifyBusy(true);
        try {
            const data = await postJson(route('workspace.demand'), {
                prompt: `[not supported yet] ${unsupported.join(' | ')} — asked for in: ${prompt || ''}`.slice(0, 1000),
                email: address,
                source: 'build_workspace_unsupported',
            });
            if (data?.success) setNotifySent(true);
        } catch (e) {
            /* Never let a roadmap signup block a signup. */
        } finally {
            setNotifyBusy(false);
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
                ...(v2Session ? { builder_session: v2Session } : {}),
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
    const [v2Prog, setV2Prog] = useState({ step: 1, total: 8 });
    const stepNow =
        phase === 'v2'
            ? v2Prog.step
            : phase === 'intent'
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
        if (phase === 'questions' && deepCurrent) {
            return () => { setDeepCurrent(null); setDiscoveryMode('ai'); setDeepRound(false); setPhase('reveal'); };
        }
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

    /* The stack is shown ONCE, at the end.
       While the questions run there is no module list, no count and no rows
       sliding in — answering five questions beside a panel that keeps
       rewriting itself is two jobs at once, and the count in its header was
       the thing that made a lean setup still feel like a pile. The answers are
       recorded; our own engine works out what they add up to; the reveal is
       where that arrives. It is also free: nothing has to be re-resolved on
       the server after every single answer. */
    /* The reveal is full width. There is no side panel: the checkpoint card
       already shows what has been set up, and a second copy beside it only
       competed with the one thing this screen is for. */
    const isReveal = phase === 'reveal';

    return (
        <>
            <Head title="Build your VenQore workspace" />
            <BuilderShell
                siteChrome
                step={stepNow}
                total={phase === 'building' ? 0 : phase === 'v2' ? v2Prog.total : totalSteps}
                eyebrow={displayLabel || 'Your ERP, built by AI'}
                orbState={orbState}
                onBack={phase === 'building' ? null : backTarget()}
                wide={isReveal}
                footer={
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-accent-text" />
                        14-day free trial · No credit card required · Cancel anytime
                    </span>
                }
            >
                <div
                    className={isReveal ? 'w-full' : 'mx-auto w-full max-w-3xl'}
                >
                    <div className="min-w-0">
                        {/* Mode and escape hatch on ONE line. This was a pill row
                            stacked on top of a bordered card carrying three lines of
                            copy about being in a hurry — together they pushed the
                            actual question below the fold on a laptop, which is a
                            strange thing for the question to be. The button says what
                            it does; the paragraph explaining it was the third thing
                            competing with it for the same glance. */}
                        {phase === 'questions' && (
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                {deepCurrent ? <span className="text-xs font-semibold text-ink-secondary">A few more questions</span> : <div
                                    className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-1"
                                    role="group"
                                    aria-label="Answer with AI, or do it yourself"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setDiscoveryMode('ai')}
                                        aria-pressed={discoveryMode !== 'manual'}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ease-standard ${
                                            discoveryMode !== 'manual'
                                                ? 'bg-accent-fill text-accent-on'
                                                : 'text-ink-secondary hover:text-ink'
                                        }`}
                                    >
                                        <Sparkles size={13} />
                                        AI is asking
                                    </button>
                                    <button
                                        type="button"
                                        onClick={switchToManual}
                                        aria-pressed={discoveryMode === 'manual'}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ease-standard ${
                                            discoveryMode === 'manual'
                                                ? 'bg-accent-fill text-accent-on'
                                                : 'text-ink-secondary hover:text-ink'
                                        }`}
                                    >
                                        <Sliders size={13} />
                                        I&rsquo;ll answer myself
                                    </button>
                                </div>}

                                <button
                                    type="button"
                                    onClick={skipQuestions}
                                    disabled={skipping}
                                    title={
                                        displayLabel
                                            ? `Stop here and set up the essentials for ${displayLabel}`
                                            : 'Stop here and set up the essentials'
                                    }
                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink-secondary transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink disabled:opacity-60"
                                >
                                    <FastForward size={13} />
                                    {skipping ? 'Setting up…' : deepRound ? 'Skip the rest — show my modules' : 'Skip questions'}
                                </button>
                            </div>
                        )}

                        {phase === 'questions' && deepRound && (
                            <p className="-mt-2 mb-4 text-xs text-ink-muted">
                                Up to 5 quick questions. Skip any you like &mdash; you can switch anything on yourself
                                on the next screen, and your free extras are already saved.
                            </p>
                        )}

                        {phase === 'v2' && (
                            <BuilderV2
                                initialPrompt={initialPrompt}
                                initialType={initialType}
                                initialPreset={initialPreset}
                                onProgress={setV2Prog}
                                businessTypes={businessTypes}
                                getTurnstileToken={getTurnstileToken}
                                email={email || authUser?.email || ''}
                                onBuild={({ sessionId, modules, typeKey }) => {
                                    setV2Session(sessionId);
                                    setV2Modules(modules);
                                    if (typeKey) setBusinessType(typeKey);
                                    setPhase(plans.length ? 'plan' : 'account');
                                }}
                            />
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
                                                    in a hurry? skip the questions
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
                                        onFallbackToManual={openBlankSlate}
                                        onStateUpdate={handleAiStateUpdate}
                                        onProgress={handleAiProgress}
                                        onEditPrompt={editPrompt}
                                        storageKey={`${STORAGE_KEY}:converse`}
                                    />
                                ) : (
                                    deepCurrent ? (() => {
                                        const dq = questions.find((q) => q.key === deepCurrent);
                                        if (!dq) return null;
                                        return (
                                            <div key={`deep-${dq.key}`}>
                                                <p className="mb-3 text-2xs font-semibold uppercase tracking-widest text-accent-text">
                                                    Question {Math.min(deepSeen.length + 1, DEEP_LIMIT)} of up to {DEEP_LIMIT}
                                                </p>
                                                <QuestionStep
                                                    key={dq.key}
                                                    question={dq}
                                                    value={answers[dq.key]}
                                                    onAnswer={handleAnswer}
                                                    onContinue={() => { commitMulti(dq.key); advance(); }}
                                                    autoAdvance={advance}
                                                />
                                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                                                    <span className="text-xs text-ink-muted">Not sure, or not relevant?</span>
                                                    <button
                                                        type="button"
                                                        onClick={advance}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink-secondary transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink"
                                                    >
                                                        <FastForward size={13} />
                                                        Skip this question
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })() : questions[qIndex] && (
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
                                    {blankSlate ? (
                                        <>
                                            <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text">
                                                <Sparkles size={12} />
                                                {displayLabel || 'Your workspace'}
                                            </span>
                                            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                                Build it yourself.
                                            </h1>
                                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
                                                Nothing is switched on. Tap whatever you want &mdash; anything that
                                                needs something else switches that on too, and nothing here costs extra.
                                            </p>
                                        </>
                                    ) : reviewMode ? (
                                        <>
                                            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs font-semibold uppercase tracking-widest" aria-label="Setup progress">
                                                <li className="inline-flex items-center gap-1.5 text-accent-text"><Check size={12} strokeWidth={3} /> Essentials</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="inline-flex items-center gap-1.5 text-accent-text"><Check size={12} strokeWidth={3} /> Made yours</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="inline-flex items-center gap-1.5 text-ink"><span className="h-1.5 w-1.5 rounded-full bg-accent-fill" /> Final check</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="text-ink-muted">Launch</li>
                                            </ol>
                                            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                                Here&rsquo;s everything we think is right for you.
                                            </h1>
                                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
                                                <span className="vq-num font-semibold text-ink">{activeModules.length}</span> modules are switched on
                                                for you. If there&rsquo;s anything else you&rsquo;d like, add it below &mdash; then
                                                continue to create your store.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            {/* Where they are: the essentials are done, the fitting is next.
                                                It reads as the middle of a journey, not the end of one. */}
                                            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs font-semibold uppercase tracking-widest" aria-label="Setup progress">
                                                <li className="inline-flex items-center gap-1.5 text-accent-text"><Check size={12} strokeWidth={3} /> Essentials</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="inline-flex items-center gap-1.5 text-ink"><span className="h-1.5 w-1.5 rounded-full bg-accent-fill" /> Make it yours</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="text-ink-muted">Plan</li>
                                                <li className="text-ink-faint" aria-hidden="true">&mdash;</li>
                                                <li className="text-ink-muted">Launch</li>
                                            </ol>
                                            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                                                Good start. Now let&rsquo;s make it fit{displayLabel ? ` your ${displayLabel.toLowerCase()}` : ' your business'}.
                                            </h1>
                                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
                                                We&rsquo;ve set up the essentials. A few more questions about how you
                                                actually work let us fine-tune the rest &mdash; so the software feels
                                                built for you from day one, not something you have to bend into shape.
                                            </p>
                                        </>
                                    )}

                                    {/* Honest note — shown only when nothing about what was typed
                                        actually matched a trade this product has a preset for (see
                                        WorkspaceBuilderController::analyze()'s 'matched' field). The
                                        request has already been logged automatically; this just says
                                        so, instead of presenting a defaulted Retail Shop as if it were
                                        a considered recommendation. */}
                                    <TermsPreview terms={terms} className="mt-3" />

                                    {!blankSlate && !matched && candidates.length > 0 && (
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

                                    {!blankSlate && !matched && !candidates.length && (
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

                                    {!blankSlate && unsupported.length > 0 && (
                                        <div className="mt-4 rounded-lg border border-line bg-surface p-4">
                                            <p className="text-sm font-semibold text-ink">
                                                {unsupported.length === 1
                                                    ? 'One thing we don\u2019t do yet'
                                                    : 'A few things we don\u2019t do yet'}
                                            </p>
                                            <ul className="mt-1.5 space-y-1">
                                                {unsupported.map((item) => (
                                                    <li key={item} className="text-sm leading-relaxed text-ink-secondary">
                                                        {item} <span className="text-ink-muted">&mdash; noted for our roadmap</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                                                Nothing below pretends to cover it. That is the whole reason
                                                we said so rather than switching on something that sounds close.
                                            </p>

                                            {notifySent ? (
                                                <p className="mt-3 flex items-center gap-2 text-sm text-ink">
                                                    <Check size={15} className="text-accent-text" />
                                                    We&rsquo;ll email you the day it ships.
                                                </p>
                                            ) : (
                                                <div className="mt-3">
                                                    <label htmlFor="vq-notify" className="text-xs font-semibold text-ink">
                                                        Want it? We&rsquo;ll tell you when it&rsquo;s ready.
                                                    </label>
                                                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                                                        <input
                                                            id="vq-notify"
                                                            type="email"
                                                            value={notifyEmail}
                                                            onChange={(e) => setNotifyEmail(e.target.value)}
                                                            placeholder="you@yourbusiness.com"
                                                            className="h-11 flex-1 rounded-md border border-line bg-app px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={requestNotify}
                                                            disabled={notifyBusy || !notifyEmail.trim()}
                                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-sunken px-4 text-xs font-semibold text-ink transition-colors duration-fast ease-standard hover:bg-interactive-hover disabled:opacity-50"
                                                        >
                                                            <Send size={14} />
                                                            {notifyBusy ? 'Saving…' : 'Notify me'}
                                                        </button>
                                                    </div>
                                                    <p className="mt-1.5 text-3xs text-ink-faint">
                                                        Only about this. No newsletter.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── The checkpoint ─────────────────────────────────────────
                                        A stop on the way, not a destination. Full width, no side
                                        panel. The way forward is the questions: one big, warm,
                                        obvious button. Doing it yourself is offered below as an
                                        honest second option; building as-is is plain text. */}
                                    {!blankSlate && !reviewMode && (
                                        <div className="mt-8 space-y-4">
                                            <GiftBundle gifts={gifts} claimed={claimedGifts} onToggle={toggleGift} />
                                            <div className="overflow-hidden rounded-xl border border-accent bg-surface shadow-sm">
                                                <div className="bg-accent-quiet p-6 sm:p-8 lg:p-10">
                                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                                        <div className="max-w-2xl">
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-fill px-2.5 py-1 text-3xs font-bold uppercase tracking-widest text-accent-on">
                                                                <Sparkles size={11} /> Best way to continue
                                                            </span>
                                                            <h2 className="mt-4 text-2xl font-semibold leading-snug text-ink sm:text-3xl">
                                                                Tell us more about your business
                                                            </h2>
                                                            <p className="mt-2 text-base leading-relaxed text-ink-secondary">
                                                                Up to five quick questions, about two minutes. Each answer adds
                                                                something you&rsquo;d miss or removes something you&rsquo;d never use.
                                                                Skip any question &mdash; or stop whenever you like and keep what you have.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={refineWithQuestions}
                                                            disabled={deepening}
                                                            className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-2.5 rounded-lg bg-accent-fill px-8 text-base font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60 lg:w-auto"
                                                        >
                                                            <MessageSquareText size={18} />
                                                            {deepening ? 'Getting your first question…' : 'Continue — a few more questions'}
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </div>

                                                    <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                                                        {[
                                                            ['Only what you need', 'No clutter from features your business never touches.'],
                                                            ['Your words, your screens', 'Menus, reports and the till follow how you actually trade.'],
                                                            ['Right from day one', 'Far less to change or switch on later.'],
                                                        ].map(([t, d]) => (
                                                            <li key={t} className="flex items-start gap-3">
                                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-fill text-accent-on">
                                                                    <Check size={11} strokeWidth={3} />
                                                                </span>
                                                                <span className="text-sm text-ink">
                                                                    <span className="font-semibold">{t}.</span>{' '}
                                                                    <span className="text-ink-secondary">{d}</span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="border-t border-line p-6 sm:px-8 lg:px-10">
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <h3 className="text-sm font-semibold text-ink">What we&rsquo;ve set up so far</h3>
                                                        <span className="vq-num text-sm font-semibold text-accent-text">{activeModules.length} modules</span>
                                                    </div>
                                                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Modules set up so far">
                                                        {recommendedSetup.map((m) => {
                                                            const Glyph = moduleGlyph(m.key, m.icon);
                                                            return (
                                                                <li
                                                                    key={m.key}
                                                                    title={recommendedWhy[m.key] && recommendedWhy[m.key] !== true ? recommendedWhy[m.key] : m.description || undefined}
                                                                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sunken px-3 py-1.5 text-xs font-semibold text-ink"
                                                                >
                                                                    <Glyph size={13} className="text-accent-text" />
                                                                    {m.label}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* The honest second option: pick it yourself. */}
                                            <button
                                                type="button"
                                                onClick={openCatalog}
                                                className="group flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-left transition-colors duration-fast ease-standard hover:border-line-strong hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-muted group-hover:text-ink">
                                                        <Sliders size={16} />
                                                    </span>
                                                    <span>
                                                        <span className="block text-sm font-semibold text-ink">
                                                            {customising ? 'Choosing my own modules' : 'I\u2019d rather choose my own modules'}
                                                        </span>
                                                        <span className="block text-xs text-ink-muted">
                                                            Browse all {allModules.length} modules and switch on exactly what you want.
                                                        </span>
                                                    </span>
                                                </span>
                                                <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform duration-fast ${customising ? 'rotate-180' : ''}`} />
                                            </button>

                                            <p className="text-xs text-ink-muted">
                                                <button
                                                    type="button"
                                                    onClick={() => { if (!customising) setEdited(null); goToPlan(); }}
                                                    disabled={activeModules.length === 0}
                                                    className="text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
                                                >
                                                    Build this workspace as it is
                                                </button>
                                                {edited !== null && changedCount > 0 && (
                                                    <>
                                                        <span className="mx-2 text-ink-faint" aria-hidden="true">·</span>
                                                        You&rsquo;ve changed {changedCount} {changedCount === 1 ? 'module' : 'modules'}.{' '}
                                                        <button type="button" onClick={() => setEdited(null)} className="underline-offset-4 hover:text-ink hover:underline">
                                                            Undo
                                                        </button>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {(reviewMode || blankSlate) && (
                                        <GiftBundle
                                            gifts={gifts}
                                            claimed={claimedGifts}
                                            onToggle={toggleGift}
                                            variant={reviewMode ? 'hero' : 'compact'}
                                            className="mt-8"
                                        />
                                    )}

                                    {showCatalog && (
                                        <div className="mt-10" ref={catalogRef} id="vq-choose-modules">
                                            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <h2 className="text-lg font-semibold text-ink">{reviewMode ? 'Add anything else you\u2019d like' : 'Choose your modules'}</h2>
                                                    <p className="text-sm text-ink-secondary">
                                                        Switch on what you need. Anything a module depends on comes on with it.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 text-xs">
                                                    <button type="button" onClick={selectAllModules} className="font-semibold text-accent-text hover:underline">Switch all on</button>
                                                    <span className="text-ink-faint">·</span>
                                                    <button type="button" onClick={deselectAllModules} className="font-semibold text-ink-secondary hover:underline">Switch all off</button>
                                                </div>
                                            </div>
                                            <ModuleCatalog
                                                modules={catalogueModules}
                                                active={activeModules}
                                                locked={locked}
                                                recommended={blankSlate ? {} : recommendedWhy}
                                                onToggle={(key) => toggleModule(key)}
                                            />
                                        </div>
                                    )}

                                    {showCatalog && (
                                        <div>
                                    {/* Guarantee notice: nothing here is final */}
                                    <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                                        <p className="text-xs leading-relaxed text-ink-secondary">
                                            <span className="font-semibold text-ink">Nothing here is final.</span>{' '}
                                            Once you are in, everything on this page lives under{' '}
                                            <strong className="font-semibold text-ink">Store Configuration &rarr; Builder</strong>,
                                            where you can switch anything on or off, or answer a few
                                            questions and have it worked out for you again. Adding a
                                            module later costs nothing extra on your plan.
                                        </p>
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
                                            disabled={activeModules.length === 0}
                                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                        >
                                            {reviewMode ? 'Continue to create my store' : 'Continue with my modules'}
                                            <ArrowRight size={16} />
                                        </button>
                                        {path === 'preset' ? (
                                            <button type="button" onClick={() => setPhase('intent')} className="text-xs font-semibold text-accent-text underline-offset-4 hover:underline">
                                                Pick a different business type
                                            </button>
                                        ) : null}
                                    </div>
                                        </div>
                                    )}
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

                                    <GiftBundle gifts={gifts} claimed={claimedGifts} onToggle={toggleGift} variant="compact" className="mt-4" />

                                    {license && (
                                        <p className="mt-4 flex items-center gap-2 rounded-md border border-accent bg-accent-quiet px-4 py-2.5 text-xs text-ink">
                                            <ShieldCheck size={14} className="shrink-0 text-accent-text" />
                                            This workspace runs on your <strong className="font-semibold">{license.label}</strong> license.
                                        </p>
                                    )}

                                    {plans.length > 0 && (
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 gap-3 rounded-md border border-line bg-surface px-4 py-2.5 text-xs">
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
            {/* eslint-disable-next-line no-restricted-syntax -- Google brand colour; the "Sign up with Google" mark must not follow our theme. */}
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            {/* eslint-disable-next-line no-restricted-syntax -- Google brand colour; the "Sign up with Google" mark must not follow our theme. */}
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            {/* eslint-disable-next-line no-restricted-syntax -- Google brand colour; the "Sign up with Google" mark must not follow our theme. */}
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            {/* eslint-disable-next-line no-restricted-syntax -- Google brand colour; the "Sign up with Google" mark must not follow our theme. */}
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
