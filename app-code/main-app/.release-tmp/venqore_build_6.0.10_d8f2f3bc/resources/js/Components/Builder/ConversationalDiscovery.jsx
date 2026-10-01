/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ConversationalDiscovery — one question at a time, the answer in reach.   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This used to be a chat log: two columns of bubbles, the question the AI was
 * asking buried in the last grey bubble at 14px, and the thing you had to do
 * next (answer it) squeezed into a one-line input at the bottom. It read like
 * two people texting, and in light mode it was white text on a white page.
 *
 * The layout now is a conversation with a focus:
 *
 *   1. A quiet transcript — "Q · short question → your answer" rows, 15px,
 *      collapsed to the last two, expandable. It is there to reassure (it
 *      heard me), not to be read.
 *   2. A calm inline notice when the last message was off-topic — not a
 *      bubble, not red; the same question is simply asked again below it.
 *   3. THE CURRENT QUESTION as an h2 in the display face, with one line on
 *      why it is asked. It sits in a polite live region so a screen reader
 *      announces each new question.
 *   4. Up to five answer buttons (≥56px, 17px), then an auto-growing
 *      PromptTextarea for "my own words, any language".
 *
 * While the model works, the question slot becomes the thinking state: the
 * same ThinkingOrb Vena wears, plus a shimmer line (Kokonut UI's AI Text
 * Loading pattern, MIT — rebuilt on V6 tokens in builder.css).
 *
 * ── Server contract (/workspace/converse/start + /step) ───────────────────
 *   ok, session_id, question, question_hint, quick_options[{key,label}],
 *   assistant_message, out_of_scope, is_complete, proposal, modules, preset,
 *   turn, progress, confirmed_caps, fallback, fallback_reason.
 * An out-of-scope OPENER has session_id null and quick_options keyed
 * `preset:<key>`: picking one restarts with that preset; typing restarts with
 * the new description. session_id is a server UUID — a step is never sent
 * without one.
 *
 * ── Persistence ────────────────────────────────────────────────────────────
 * With `storageKey`, the conversation (session id, transcript, current
 * question) lives in sessionStorage, so browser back/forward returns to the
 * same question instead of re-running /start. It only restores for the same
 * `initialPrompt`; a different sentence is a different conversation.
 *
 * ── Dev mock ───────────────────────────────────────────────────────────────
 * `?mockConverse=1` (or `=oos` to open out-of-scope) in a Vite DEV build swaps
 * the network for a canned responder — the preview harness has no PHP.
 * Production builds strip it: the guard is `import.meta.env.DEV`.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ArrowRight, Check, ChevronDown, Info, RotateCcw, Sliders, SkipForward } from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import PromptTextarea from './PromptTextarea';
import useSessionState from './useSessionState';
import useTurnstile from './useTurnstile';

const MAX_CHARS = 600;
const DEFAULT_REFUSAL =
    'I can only help set up your VenQore workspace — tell me about your business and I will take it from there.';

const csrfToken = () =>
    (typeof document !== 'undefined' &&
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')) ||
    '';

/* ── Dev-only mock responder ─────────────────────────────────────────────── */
const MOCK_MODE =
    import.meta.env.DEV && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('mockConverse')
        : null;

const MOCK_QUESTIONS = [
    {
        question: 'Do you keep stock on shelves, or mostly sell your time and services?',
        question_hint: 'This decides whether inventory, purchasing and stock counts are switched on.',
        quick_options: [
            { key: 'stock', label: 'Mostly physical stock' },
            { key: 'services', label: 'Mostly services' },
            { key: 'both', label: 'A mix of both' },
        ],
    },
    {
        question: 'Do customers ever take goods now and pay you later?',
        question_hint: 'If they do, we add customer ledgers, credit limits and payment reminders.',
        quick_options: [
            { key: 'yes', label: 'Yes, regularly' },
            { key: 'sometimes', label: 'Now and then' },
            { key: 'no', label: 'No, always paid upfront' },
        ],
    },
    {
        question: 'How many shops, branches or warehouses do you run today?',
        question_hint: 'More than one location adds stock transfers and per-branch reports.',
        quick_options: [
            { key: 'one', label: 'Just one' },
            { key: 'few', label: 'Two or three' },
            { key: 'many', label: 'Four or more' },
            { key: 'soon', label: 'One now, more planned' },
        ],
    },
];
const mockState = { turn: 0 };
const OFF_TOPIC = /weather|joke|poem|recipe|football|cricket/i;

async function mockPost(url, body) {
    await new Promise((r) => window.setTimeout(r, 1100));
    const base = { ok: true, is_complete: false, confirmed_caps: [], fallback: false };
    if (url.endsWith('/start')) {
        if ((MOCK_MODE === 'oos' && !body.preset && mockState.turn === 0 && !mockState.oosShown) || OFF_TOPIC.test(body.prompt || '')) {
            mockState.oosShown = true;
            const q = 'What kind of business do you run, and what do you sell?';
            return {
                ...base,
                session_id: null,
                out_of_scope: true,
                assistant_message: `${DEFAULT_REFUSAL}\n\n${q}`,
                question: q,
                question_hint: 'Your answer picks the starting template and the modules we switch on for you.',
                quick_options: [
                    { key: 'preset:retail_shop', label: 'Retail shop' },
                    { key: 'preset:grocery', label: 'Grocery store' },
                    { key: 'preset:pharmacy', label: 'Pharmacy' },
                    { key: 'preset:restaurant', label: 'Restaurant / café' },
                    { key: 'preset:clothing', label: 'Clothing store' },
                ],
                turn: 0,
                progress: 0,
            };
        }
        mockState.turn = 0;
        const q = MOCK_QUESTIONS[0];
        return { ...base, session_id: '00000000-0000-4000-8000-000000000001', out_of_scope: false, assistant_message: q.question, ...q, turn: 1, progress: 30 };
    }
    if (OFF_TOPIC.test(body.response || '')) {
        const q = MOCK_QUESTIONS[mockState.turn];
        return {
            ...base,
            session_id: body.session_id,
            out_of_scope: true,
            assistant_message: `I can only help with setting up your VenQore workspace, so I will skip that one.\n\n${q.question}`,
            ...q,
            turn: mockState.turn + 1,
            progress: 30 + mockState.turn * 25,
        };
    }
    mockState.turn += 1;
    if (mockState.turn >= MOCK_QUESTIONS.length) {
        return { ...base, session_id: body.session_id, is_complete: true, proposal: { confidence: 0.9 }, modules: [], preset: 'retail_shop', progress: 100, question: null, quick_options: [] };
    }
    const q = MOCK_QUESTIONS[mockState.turn];
    return { ...base, session_id: body.session_id, out_of_scope: false, assistant_message: q.question, ...q, turn: mockState.turn + 1, progress: 30 + mockState.turn * 25 };
}

/* ── Network ─────────────────────────────────────────────────────────────── */
async function postJson(url, body) {
    if (MOCK_MODE) return mockPost(url, body);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    });
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    if (!data) throw new Error(`HTTP ${res.status}`);
    return data;
}

/* The refusal half of an out-of-scope assistant_message ("refusal\n\nquestion"). */
function refusalFrom(data) {
    const msg = (data?.assistant_message || '').trim();
    const q = (data?.question || '').trim();
    if (!msg) return DEFAULT_REFUSAL;
    const parts = msg.split(/\n\s*\n/);
    if (parts.length > 1) return parts.slice(0, -1).join(' ').trim() || DEFAULT_REFUSAL;
    return msg === q ? DEFAULT_REFUSAL : msg;
}

const shorten = (s, n = 72) => {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

const canAutoFocus = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const THINKING_START = ['Reading your description', 'Finding businesses like yours', 'Picking a first question'];
const THINKING_STEP = ['Reading your answer', 'Updating your setup', 'Choosing the next question'];
const THINKING_DONE = ['Putting your workspace together'];

const EMPTY = { prompt: null, sessionId: null, history: [], current: null };

export default function ConversationalDiscovery({
    initialPrompt,
    initialPreset,
    onComplete,
    onFallbackToManual,
    onStateUpdate,
    onProgress,
    onEditPrompt,
    storageKey = 'vq-converse',
}) {
    const getTurnstileToken = useTurnstile();
    const startingPrompt = (initialPrompt || '').trim() || 'I want to set up a new workspace for my business.';

    const [convo, setConvo] = useSessionState(storageKey, EMPTY);
    const [phase, setPhase] = useState('idle'); // idle | thinking | done
    const [thinkingSet, setThinkingSet] = useState(THINKING_START);
    const [error, setError] = useState(null); // { tone, text, retry?, restart? }
    const [draft, setDraft] = useState('');
    const [ticked, setTicked] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const textareaRef = useRef(null);
    const headingRef = useRef(null);
    const alive = useRef(true);
    const still = useReducedMotion();

    /* Latest callbacks, without re-binding effects. */
    const cbs = useRef({ onComplete, onStateUpdate, onProgress });
    useEffect(() => {
        cbs.current = { onComplete, onStateUpdate, onProgress };
    });

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    /* One place every server response goes through. Returns true when it
       produced a question (or completion) the screen can show. */
    const apply = useCallback(
        (data, { prev } = {}) => {
            if (!data || typeof data !== 'object') return false;

            if (data.confirmed_caps) cbs.current.onStateUpdate?.(data.confirmed_caps, data.detected_facts);
            if (typeof data.progress === 'number') cbs.current.onProgress?.(data.progress);

            if ((data.is_complete || data.fallback) && data.proposal) {
                setPhase('done');
                setThinkingSet(THINKING_DONE);
                setError(null);
                /* The session id travels with the proposal so the reveal can
                   offer a deeper round that CONTINUES this conversation rather
                   than starting a second one. */
                const sessionId = data.session_id || null;
                const turns = typeof data.turn === 'number' ? data.turn : null;
                window.setTimeout(() => {
                    if (alive.current) {
                        cbs.current.onComplete?.(data.proposal, data.modules, data.preset, { sessionId, turns });
                    }
                }, 600);
                return true;
            }

            if (data.fallback) {
                /* Expired or unknown session — nothing to resume. */
                setPhase('idle');
                setConvo((c) => ({ ...c, current: prev || c.current }));
                setError({
                    tone: 'warning',
                    text: data.message || 'This conversation timed out. Start over — it only takes a minute.',
                    restart: true,
                });
                return true;
            }

            const question = (data.question || '').trim() || (data.assistant_message || '').trim();
            if (data.ok && question) {
                setConvo((c) => ({
                    ...c,
                    sessionId: data.session_id || null,
                    current: {
                        question,
                        hint: data.question_hint || null,
                        options: Array.isArray(data.quick_options) ? data.quick_options.slice(0, 5) : [],
                        notice: data.out_of_scope ? refusalFrom(data) : null,
                        opener: !data.session_id,
                        /* A tick list settles everything on it at once, so it is
                           answered with a Continue rather than by picking one. */
                        multi: !!data.is_multi,
                    },
                }));
                setError(null);
                setPhase('idle');
                return true;
            }

            /* Validation / security-check failures come back as {success:false, message}. */
            if (data.success === false && data.message) {
                setPhase('idle');
                setError({ tone: 'warning', text: data.message, restart: !prev });
                return true;
            }
            return false;
        },
        [setConvo],
    );

    /* `start`'s own error path offers a retry that calls `start` again. Naming
       it directly inside its own initialiser reads fine but leaves the retry
       closed over a binding it cannot see updating — the same reason `cbs`
       above exists. The ref is assigned in an effect below, which has always
       run by the time anyone can click Try again. */
    const startRef = useRef(null);

    const start = useCallback(
        async (text, preset, { keepHistory = true } = {}) => {
            setPhase('thinking');
            setThinkingSet(THINKING_START);
            setError(null);
            setConvo((c) => ({
                prompt: startingPrompt,
                sessionId: null,
                history: keepHistory ? c.history || [] : [],
                current: null,
            }));
            try {
                const turnstileToken = MOCK_MODE ? null : await getTurnstileToken();
                const data = await postJson('/workspace/converse/start', {
                    prompt: text.slice(0, MAX_CHARS),
                    preset: preset || null,
                    ...(turnstileToken ? { 'cf-turnstile-response': turnstileToken } : {}),
                });
                if (!alive.current) return;
                if (!apply(data)) throw new Error('Unexpected response');
            } catch (e) {
                if (!alive.current) return;
                setPhase('idle');
                setError({
                    tone: 'warning',
                    text: 'We could not reach the setup assistant just now.',
                    retry: () => startRef.current?.(text, preset, { keepHistory }),
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [apply, startingPrompt, getTurnstileToken],
    );

    useEffect(() => {
        startRef.current = start;
    });

    /* Mount: resume this tab's conversation for the same sentence, or start. */
    useEffect(() => {
        const resumable =
            convo && convo.prompt === startingPrompt && convo.current && convo.current.question;
        if (resumable) return;
        /* Kicking off the opening request on mount is what this effect is for.
           `start` flips to the thinking state before it awaits, which the rule
           reads as a cascading render; the alternative — deferring those writes
           past a microtask — buys one frame of the wrong UI and nothing else. */
        // eslint-disable-next-line react-hooks/set-state-in-effect
        start(startingPrompt, initialPreset || null, { keepHistory: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const current = convo.current;
    const busy = phase !== 'idle';

    const answer = async (rawText, optionKey = null) => {
        const text = (rawText || '').trim().slice(0, MAX_CHARS);
        if (!text || busy || !current) return;

        const prev = current;
        const typed = optionKey === null;
        setDraft('');
        setError(null);

        /* The out-of-scope opener has no session: its answers restart. */
        if (prev.opener || !convo.sessionId) {
            setConvo((c) => ({ ...c, history: [...(c.history || []), { id: Date.now(), q: prev.question, a: text }] }));
            if (optionKey && optionKey.startsWith('preset:')) {
                start(text, optionKey.slice('preset:'.length));
            } else {
                start(text, null);
            }
            return;
        }

        // eslint-disable-next-line react-hooks/purity -- event handler, not render; ids must stay unique against rows rehydrated from sessionStorage, which a per-mount counter would collide with.
        const entry = { id: Date.now(), q: prev.question, a: text };
        setConvo((c) => ({ ...c, history: [...(c.history || []), entry], current: null }));
        setThinkingSet(THINKING_STEP);
        setPhase('thinking');

        try {
            const data = await postJson('/workspace/converse/step', {
                session_id: convo.sessionId,
                response: text,
                selected_option_key: optionKey,
            });
            if (!alive.current) return;
            /* An off-topic reply does not count as an answer — drop it from
               the transcript; the same question comes back with a notice. */
            if (data && data.out_of_scope && !data.is_complete) {
                setConvo((c) => ({ ...c, history: (c.history || []).filter((h) => h.id !== entry.id) }));
            }
            if (!apply(data, { prev })) throw new Error('Unexpected response');
        } catch (e) {
            if (!alive.current) return;
            setConvo((c) => ({
                ...c,
                history: (c.history || []).filter((h) => h.id !== entry.id),
                current: prev,
            }));
            if (typed) setDraft(text);
            setPhase('idle');
            setError({
                tone: 'warning',
                text: 'That answer did not go through — nothing was lost.',
                retry: () => answer(text, optionKey),
            });
        }
    };

    /* Answer a tick list. Unticked is a real answer — the server settles every
       option on the list, ticked as a yes and untouched as a no — so sending an
       empty selection is meaningful and must not be blocked. */
    const answerList = async () => {
        if (busy || !current || !convo.sessionId) return;

        const prev = current;
        const chosen = prev.options.filter((o) => ticked.includes(o.key));
        const label = chosen.length ? chosen.map((o) => o.label).join(', ') : 'None of these';

        // eslint-disable-next-line react-hooks/purity -- see the note in answer() below.
        const entry = { id: Date.now(), q: prev.question, a: label };
        setTicked([]);
        setError(null);
        setConvo((c) => ({ ...c, history: [...(c.history || []), entry], current: null }));
        setThinkingSet(THINKING_STEP);
        setPhase('thinking');

        try {
            const data = await postJson('/workspace/converse/step', {
                session_id: convo.sessionId,
                response: label,
                selected_option_keys: chosen.map((o) => o.key),
            });
            if (!alive.current) return;
            if (!apply(data, { prev })) throw new Error('Unexpected response');
        } catch (e) {
            if (!alive.current) return;
            setConvo((c) => ({
                ...c,
                history: (c.history || []).filter((h) => h.id !== entry.id),
                current: prev,
            }));
            setPhase('idle');
            setError({
                tone: 'warning',
                text: 'That did not go through — nothing was lost.',
                retry: () => answerList(),
            });
        }
    };

    /* Decline the current question and move on.
       This is a first-class server call, not an answer of "skip": the backend
       records the question's target capability on the session's skipped list,
       which is the only thing that stops its deterministic selector from
       picking the same capability — and therefore asking the same question —
       on the very next turn. The transcript keeps the row: "you were asked
       this and passed on it" is part of the history worth showing. */
    const skipQuestion = async () => {
        if (busy || !current || current.opener || !convo.sessionId) return;

        const prev = current;
        // eslint-disable-next-line react-hooks/purity -- see the note on the same pattern in answer() above.
        const entry = { id: Date.now(), q: prev.question, a: 'Skipped', skipped: true };
        setDraft('');
        setError(null);
        setConvo((c) => ({ ...c, history: [...(c.history || []), entry], current: null }));
        setThinkingSet(THINKING_STEP);
        setPhase('thinking');

        try {
            const data = await postJson('/workspace/converse/step', {
                session_id: convo.sessionId,
                skip: true,
            });
            if (!alive.current) return;
            if (!apply(data, { prev })) throw new Error('Unexpected response');
        } catch (e) {
            if (!alive.current) return;
            setConvo((c) => ({
                ...c,
                history: (c.history || []).filter((h) => h.id !== entry.id),
                current: prev,
            }));
            setPhase('idle');
            setError({
                tone: 'warning',
                text: 'That skip did not go through — the question is still here.',
                retry: () => skipQuestion(),
            });
        }
    };

    const startOver = () => {
        if (busy) return;
        if (convo.sessionId && !MOCK_MODE) {
            postJson('/workspace/converse/reset', { session_id: convo.sessionId }).catch(() => {});
        }
        mockState.turn = 0;
        setExpanded(false);
        start(startingPrompt, initialPreset || null, { keepHistory: false });
    };

    /* New question on screen → focus the answer box (fine pointers only: on a
       phone it would open the keyboard over the answer buttons). */
    const questionText = current?.question || null;
    useEffect(() => {
        if (!questionText || busy) return;
        if (canAutoFocus()) textareaRef.current?.focus({ preventScroll: true });
    }, [questionText, busy]);

    /* Transcript rows: the business description first, then each answer. */
    const rows = useMemo(() => {
        const out = [{ id: 'prompt', q: 'Your business', a: startingPrompt, isPrompt: true }];
        for (const h of convo.history || []) out.push(h);
        return out;
    }, [convo.history, startingPrompt]);

    const showToggle = rows.length > 2;
    const visibleRows = expanded || !showToggle ? rows : rows.slice(-2);
    const hasAnswers = (convo.history || []).length > 0;

    const fade = still
        ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -8 },
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          };

    return (
        <section className="vq-cd" aria-label="Set up your workspace with VenQore AI">
            {/* 1 · Transcript */}
            <div className="vq-cd-log">
                <div className="vq-cd-log__head">
                    {showToggle ? (
                        <button
                            type="button"
                            className="vq-cd-log__toggle"
                            aria-expanded={expanded}
                            aria-controls="vq-cd-log-list"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? 'Hide earlier answers' : `Show all ${rows.length} answers`}
                            <ChevronDown size={15} aria-hidden="true" />
                        </button>
                    ) : (
                        <span className="vq-cd-log__toggle" style={{ cursor: 'default' }}>
                            What you have told us
                        </span>
                    )}
                    {hasAnswers && (
                        <button type="button" className="vq-cd-link" onClick={startOver} disabled={busy}>
                            <RotateCcw size={14} aria-hidden="true" />
                            Start over
                        </button>
                    )}
                </div>
                <ol className="vq-cd-log__list" id="vq-cd-log-list">
                    {visibleRows.map((r) => (
                        <li key={r.id} className="vq-cd-log__row">
                            <span className="vq-cd-log__q">
                                {!r.isPrompt && <b aria-hidden="true">Q</b>}
                                {shorten(r.q)}
                            </span>
                            <span className="vq-cd-log__a">{r.isPrompt ? shorten(r.a, 140) : r.a}</span>
                            {r.isPrompt && onEditPrompt && (
                                <button
                                    type="button"
                                    className="vq-cd-link vq-cd-log__edit"
                                    onClick={onEditPrompt}
                                    disabled={busy}
                                    aria-label="Edit your business description"
                                >
                                    Edit
                                </button>
                            )}
                        </li>
                    ))}
                </ol>
            </div>

            {/* 2 · Notices (off-topic, errors) */}
            <AnimatePresence initial={false}>
                {error ? (
                    <motion.div key="err" {...fade}>
                        <div className="vq-cd-notice" data-tone="warning" role="alert">
                            <AlertTriangle size={18} aria-hidden="true" />
                            <div>
                                <p style={{ margin: 0 }}>{error.text}</p>
                                <div className="vq-cd-notice__actions">
                                    {error.retry && (
                                        <button type="button" className="vq-btn vq-btn--secondary vq-btn--sm" onClick={error.retry}>
                                            Try again
                                        </button>
                                    )}
                                    {error.restart && (
                                        <button type="button" className="vq-btn vq-btn--secondary vq-btn--sm" onClick={startOver}>
                                            Start over
                                        </button>
                                    )}
                                    <button type="button" className="vq-btn vq-btn--quiet vq-btn--sm" onClick={onFallbackToManual}>
                                        Choose modules myself
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : current?.notice && !busy ? (
                    <motion.div key={`oos-${current.question}`} {...fade}>
                        <div className="vq-cd-notice" role="status">
                            <Info size={18} aria-hidden="true" />
                            <p style={{ margin: 0 }}>{current.notice}</p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* 3 · The current question, or the thinking state */}
            <div>
                <AnimatePresence mode="wait" initial={false}>
                    {busy || !current ? (
                        <motion.div key="thinking" {...fade}>
                            {/* Keyed on the set itself: a new set of lines is a new
                                Thinking, which starts at line 0 by construction
                                rather than by resetting state inside an effect. */}
                            <Thinking key={thinkingSet[0]} texts={thinkingSet} still={still} />
                        </motion.div>
                    ) : (
                        <motion.div key={`q-${current.question}`} {...fade}>
                            <div className="vq-cd-ask__who">
                                <ThinkingOrb state="listening" size={20} aria-label="" />
                                VenQore AI
                            </div>
                            <div aria-live="polite" aria-atomic="true">
                                <h2 ref={headingRef} className="vq-cd-question" tabIndex={-1}>
                                    {current.question}
                                </h2>
                                {current.hint && <p className="vq-cd-why">{current.hint}</p>}
                            </div>

                            {current.options.length > 0 && current.multi && (
                                <>
                                    <div className="vq-cd-options" role="group" aria-label="Tick everything that applies">
                                        {current.options.map((opt, i) => {
                                            const on = ticked.includes(opt.key);
                                            return (
                                                <motion.button
                                                    key={opt.key || i}
                                                    type="button"
                                                    aria-pressed={on}
                                                    className="vq-cd-option"
                                                    data-ticked={on ? 'true' : undefined}
                                                    onClick={() =>
                                                        setTicked((t) =>
                                                            t.includes(opt.key)
                                                                ? t.filter((k) => k !== opt.key)
                                                                : [...t, opt.key],
                                                        )
                                                    }
                                                    initial={still ? false : { opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.26, delay: still ? 0 : 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                                                >
                                                    <span className="vq-cd-option__text">
                                                        <span className="vq-cd-option__label">{opt.label}</span>
                                                        {opt.desc && (
                                                            <span className="vq-cd-option__desc">{opt.desc}</span>
                                                        )}
                                                    </span>
                                                    <span className={`vq-cd-tick${on ? ' vq-cd-tick--on' : ''}`} aria-hidden="true">
                                                        {on ? <Check size={14} strokeWidth={3} /> : null}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <button type="button" className="vq-btn vq-btn--primary" onClick={answerList}>
                                            Continue
                                            <ArrowRight size={16} aria-hidden="true" />
                                        </button>
                                        <span className="vq-cd-tickcount">
                                            {ticked.length === 0
                                                ? 'Nothing ticked — we will leave all of these out'
                                                : `${ticked.length} ticked`}
                                        </span>
                                    </div>
                                </>
                            )}

                            {current.options.length > 0 && !current.multi && (
                                <div className="vq-cd-options" role="group" aria-label="Suggested answers">
                                    {current.options.map((opt, i) => (
                                        <motion.button
                                            key={opt.key || i}
                                            type="button"
                                            className="vq-cd-option"
                                            onClick={() => answer(opt.label, opt.key)}
                                            initial={still ? false : { opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.26, delay: still ? 0 : 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                                        >
                                            {/* The label says what you are picking; the line
                                                under it says what picking it actually does.
                                                Always system-authored — validOptions() lets the
                                                model restyle the label and nothing else. */}
                                            <span className="vq-cd-option__text">
                                                <span className="vq-cd-option__label">{opt.label}</span>
                                                {opt.desc && (
                                                    <span className="vq-cd-option__desc">{opt.desc}</span>
                                                )}
                                            </span>
                                            <ArrowRight size={18} aria-hidden="true" />
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4 · Own words */}
            <div>
                {current?.options?.length > 0 && !busy && (
                    <div className="vq-cd-or" id="vq-cd-or">Or answer in your own words</div>
                )}
                <PromptTextarea
                    ref={textareaRef}
                    value={draft}
                    onChange={setDraft}
                    onSubmit={(t) => answer(t, null)}
                    busy={busy}
                    disabled={phase === 'done'}
                    maxLength={MAX_CHARS}
                    ariaLabel={current?.question ? `Your answer to: ${current.question}` : 'Your answer'}
                    placeholder={
                        current?.opener
                            ? 'Describe your business in a sentence…'
                            : 'Type your answer — any language is fine'
                    }
                    submitLabel="Send answer"
                    hint={
                        <>
                            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
                        </>
                    }
                />
            </div>

            {current && !current.opener && convo.sessionId && phase !== 'done' && (
                <div className="vq-cd-foot">
                    <span>Not sure, or would rather not say?</span>
                    <button
                        type="button"
                        className="vq-btn vq-btn--quiet vq-btn--sm"
                        onClick={skipQuestion}
                        disabled={busy}
                    >
                        <SkipForward size={15} aria-hidden="true" />
                        Skip this question
                    </button>
                </div>
            )}

            <div className="vq-cd-foot">
                <span>Rather pick the modules yourself?</span>
                <button type="button" className="vq-btn vq-btn--quiet vq-btn--sm" onClick={onFallbackToManual}>
                    <Sliders size={15} aria-hidden="true" />
                    Manual setup
                </button>
            </div>
        </section>
    );
}

function Thinking({ texts, still }) {
    const [i, setI] = useState(0);
    useEffect(() => {
        /* No reset here: the caller keys this component on the text set, so a
           different set arrives as a fresh mount already sitting at 0. */
        if (texts.length < 2) return undefined;
        const t = window.setInterval(() => setI((n) => (n + 1) % texts.length), 1700);
        return () => window.clearInterval(t);
    }, [texts]);

    return (
        <div className="vq-cd-thinking" role="status">
            <span className="sr-only">VenQore AI is thinking…</span>
            <ThinkingOrb state="solving" size={64} aria-label="" />
            <div aria-hidden="true" style={{ minWidth: 0 }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={texts[i]}
                        className="vq-cd-shimmer"
                        initial={still ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={still ? { opacity: 0 } : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.28 }}
                    >
                        {texts[i]}…
                    </motion.span>
                </AnimatePresence>
                <p className="vq-cd-thinking__sub">Usually a couple of seconds.</p>
            </div>
        </div>
    );
}
