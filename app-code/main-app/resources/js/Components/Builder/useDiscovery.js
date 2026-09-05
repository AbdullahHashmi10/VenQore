/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  useDiscovery — answers in, module set out.                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The questions, their options, their `implies` maps, their branching rules and
 * their copy ALL come from `config/ai_builder.php → discovery`, handed over as
 * an Inertia prop. Nothing here restates any of it. This hook only walks
 * whatever it is given, which means adding a question, renaming an option or
 * rewiring a branch is a config edit and nothing else.
 *
 * That is the repo's "point, never copy" rule applied to onboarding. The screen
 * this replaces hard-coded three dropdowns whose values the server never read.
 *
 * ── The three shapes a question can take ───────────────────────────────────
 *
 *   type: 'text'    a sentence. Answered on the landing page; not a step here.
 *   type: 'choice'  one option. Answer is a string.
 *   type: 'multi'   any number of options. Answer is an array of strings.
 *
 * Multi exists because forcing one answer throws away the thing that decides
 * the build. "What do people pay you for?" is goods AND made AND recurring for
 * a bakery with a wholesale line, and a single-select version of that question
 * quietly builds the wrong system.
 *
 * ── Branching ──────────────────────────────────────────────────────────────
 *
 *   'show_if' => ['stock' => ['catalogue', 'deep']]
 *
 * means: show this only if `stock` was answered 'catalogue' or 'deep'. Several
 * keys are ANDed by default; `'show_if_mode' => 'any'` ORs them instead. When
 * the dependency is a multi question, the test passes if ANY selected option is
 * in the list.
 *
 * A hidden question contributes NOTHING, even if it holds a stale answer from
 * before the user went back and changed its parent. That is the whole reason
 * visibility is computed here rather than in the page: the module set and the
 * question list have to be derived from the same rule, or a stale answer keeps
 * a module switched on that the user can no longer see the question for.
 *
 * ── What `implies` may and may not do ──────────────────────────────────────
 *
 * It may only ADD. A discovery answer never removes a module the matched preset
 * asked for, because the preset came from the user's own sentence and outranks
 * a tick box. Removal is the user's job on the reveal screen, where they can
 * see what they are removing.
 *
 * ── Surviving a real navigation ─────────────────────────────────────────────
 *
 * Pass `storageKey` and a person's answers survive the browser's own back
 * button, closing and reopening the tab, or wandering off mid-flow and coming
 * back to the same URL — all of which throw this component away and rebuild it
 * from nothing, which is not the same thing as the in-app Back button and was
 * quietly assumed to be. Without a key, this hook behaves exactly as before:
 * answers live in memory only, for the lifetime of this mounted component.
 * Call the returned `forget()` once a workspace is actually built, so a
 * finished attempt does not resurrect itself for whoever uses the browser next.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSessionState from './useSessionState';

/** Every answer as an array, whatever shape it was stored in. */
export function asList(answer) {
    if (Array.isArray(answer)) return answer;
    if (typeof answer === 'string' && answer !== '') return [answer];
    return [];
}

/** Has this question been answered at all? An empty multi counts as answered. */
export function isAnswered(question, answers) {
    const raw = answers[question.key];
    if (question.type === 'multi') return Array.isArray(raw);
    return typeof raw === 'string' && raw !== '';
}

/** Does `question`'s `show_if` pass, given the answers so far? */
export function isVisible(question, answers) {
    const rules = question.show_if;
    if (!rules) return true;

    const entries = Object.entries(rules);
    if (entries.length === 0) return true;

    const test = ([depKey, allowed]) => {
        const given = asList(answers[depKey]);
        if (given.length === 0) return false;
        return given.some((v) => allowed.includes(v));
    };

    return question.show_if_mode === 'any' ? entries.some(test) : entries.every(test);
}

/** The steps to actually render, in config order, for these answers. */
export function visibleQuestions(discovery = [], answers = {}) {
    return (discovery || []).filter(
        (q) => q && q.type !== 'text' && q.options && isVisible(q, answers),
    );
}

/**
 * Walk the visible answers and collect what they imply.
 *
 * @returns {{ implied: string[], attribution: Record<string,string> }}
 *          `attribution` maps module key -> the question key that asked for it,
 *          which is what lets the live panel show WHY a row appeared instead of
 *          just sliding it in.
 */
export function resolveImplied(discovery = [], answers = {}) {
    const implied = [];
    const attribution = {};

    for (const q of visibleQuestions(discovery, answers)) {
        for (const chosen of asList(answers[q.key])) {
            for (const modKey of (q.implies && q.implies[chosen]) || []) {
                if (!implied.includes(modKey)) {
                    implied.push(modKey);
                    attribution[modKey] = q.key;
                }
            }
        }
    }

    return { implied, attribution };
}

/** The reveal headline, when the user answered a question that carries one. */
export function resolveHeadline(discovery = [], answers = {}) {
    for (const q of discovery || []) {
        if (!q?.headline || !isVisible(q, answers)) continue;
        for (const chosen of asList(answers[q.key])) {
            if (q.headline[chosen]) return q.headline[chosen];
        }
    }
    return '';
}

/**
 * @param {object[]} discovery   config('ai_builder.discovery'), via prop
 * @param {string[]} baseModules the matched preset's modules
 * @param {string[]} legalKeys   live module keys; anything else is dropped
 *                               silently, exactly as the server pipeline does
 * @param {string}   [storageKey] when given, answers persist to sessionStorage
 *                                under this key and rehydrate on remount — see
 *                                the class note above on why that is not the
 *                                same thing as the in-app Back button.
 */
export default function useDiscovery(discovery = [], baseModules = [], legalKeys = null, storageKey = null) {
    const [memoryAnswers, setMemoryAnswers] = useState({});
    const [storedAnswers, setStoredAnswers, forgetStored] = useSessionState(
        storageKey ? `${storageKey}:answers` : 'vq-discovery:unused',
        {},
    );

    const answers = storageKey ? storedAnswers : memoryAnswers;
    const setAnswers = storageKey ? setStoredAnswers : setMemoryAnswers;

    /** Single-select: replace. Multi: toggle the option in and out. */
    const answer = useCallback(
        (questionKey, optionKey, { multi = false } = {}) => {
            setAnswers((prev) => {
                if (!multi) return { ...prev, [questionKey]: optionKey };
                const current = asList(prev[questionKey]);
                return {
                    ...prev,
                    [questionKey]: current.includes(optionKey)
                        ? current.filter((k) => k !== optionKey)
                        : [...current, optionKey],
                };
            });
        },
        [setAnswers],
    );

    /** Mark a multi question answered-with-nothing, so skipping is recorded. */
    const commitMulti = useCallback((questionKey) => {
        setAnswers((prev) => ({
            ...prev,
            [questionKey]: asList(prev[questionKey]),
        }));
    }, [setAnswers]);

    const reset = useCallback(() => {
        setAnswers({});
        if (storageKey) forgetStored();
    }, [setAnswers, storageKey, forgetStored]);

    /** Call once a workspace is actually built — a finished attempt should not
        greet the next visitor to this browser tab with someone else's answers. */
    const forget = useCallback(() => {
        if (storageKey) forgetStored();
    }, [storageKey, forgetStored]);

    const questions = useMemo(
        () => visibleQuestions(discovery, answers),
        [discovery, answers],
    );

    const { implied, attribution } = useMemo(
        () => resolveImplied(discovery, answers),
        [discovery, answers],
    );

    /**
     * Base first, then implied, de-duped, then filtered against the registry.
     * The order is what the live panel animates in, so it is not cosmetic: the
     * preset's own modules settle before the user's answers land on top.
     */
    const modules = useMemo(() => {
        const merged = [];
        for (const key of [...(baseModules || []), ...implied]) {
            if (key && !merged.includes(key)) merged.push(key);
        }
        if (!legalKeys) return merged;
        const legal = new Set(legalKeys);
        return merged.filter((key) => legal.has(key));
    }, [baseModules, implied, legalKeys]);

    const headline = useMemo(() => resolveHeadline(discovery, answers), [discovery, answers]);

    const answeredCount = questions.filter((q) => isAnswered(q, answers)).length;

    return {
        questions,
        answers,
        answer,
        commitMulti,
        reset,
        forget,
        modules,
        implied,
        attribution,
        headline,
        answeredCount,
        isAnswered: (q) => isAnswered(q, answers),
        isComplete: answeredCount >= questions.length,
    };
}
