/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QuestionStep — one question, filling the screen.                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * One question per screen is the point. Twelve questions on one page is a form;
 * one screen each is a conversation, and the difference is almost entirely how
 * much the visitor holds in their head at once. Branching keeps the set honest:
 * a solo consultant answers seven of the twelve, a multi-branch grocer answers
 * all eleven, and neither is asked anything that could not change their build.
 *
 * Everything rendered here comes from the question object out of
 * `config/ai_builder.php`. No question text in this file, no option labels, no
 * ordering, no branch rules.
 *
 * ── Single vs multi, and why they behave differently ───────────────────────
 *
 * SINGLE auto-advances. Choosing moves on by itself after a beat long enough to
 * watch the tick land and the module row arrive in the side panel (~460ms).
 * Without the beat the payoff is invisible; much longer and it feels laggy.
 * There is no Continue button, because a second click to confirm a choice you
 * already made is the most reliable way to make a short flow feel long.
 *
 * MULTI cannot auto-advance — the user is not finished until they say so — so
 * it gets exactly one Continue button, and that is the only place in the flow a
 * button appears. An `optional` multi also gets a quiet Skip, because a question
 * whose honest answer is "none of these" must have somewhere to put that.
 *
 * ── Keyboard ───────────────────────────────────────────────────────────────
 * Arrow keys and roving focus come free from the native inputs inside
 * OptionCard. This layer adds number keys (1-9) for direct selection and Enter
 * to continue on a multi, which is what makes the flow fast for the second and
 * third store a multi-branch owner sets up.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Info } from 'lucide-react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs';
import OptionCard from './OptionCard';
import { glyph } from './icons';

const prefersStill = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const asList = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []);

export default function QuestionStep({
    question,
    value,
    onAnswer,
    onContinue,
    autoAdvance,
}) {
    const optionKeys = useMemo(
        () => Object.keys(question?.options || {}),
        [question],
    );

    const isMulti = question?.type === 'multi';
    const chosen = asList(value);

    const choose = (optionKey) => {
        onAnswer(question.key, optionKey, { multi: isMulti });
        /* Multi waits for Continue; single moves as soon as the tick lands. */
        if (isMulti || !autoAdvance) return;
        window.setTimeout(autoAdvance, prefersStill() ? 0 : 460);
    };

    /* Keep the latest handlers reachable from the document listener without
       re-binding it on every render. Written in an effect, not during render —
       a ref mutated while rendering is how you get a handler that silently
       belongs to a previous question. */
    const handlers = useRef({ choose, onContinue, isMulti, optionKeys });
    useEffect(() => {
        handlers.current = { choose, onContinue, isMulti, optionKeys };
    });

    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const t = e.target;
            const typing =
                t instanceof HTMLElement &&
                (t.isContentEditable ||
                    (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) &&
                        !['radio', 'checkbox'].includes(t.getAttribute('type'))));
            if (typing) return;

            const h = handlers.current;

            if (e.key === 'Enter' && h.isMulti && h.onContinue) {
                e.preventDefault();
                h.onContinue();
                return;
            }

            const digit = Number(e.key);
            if (!Number.isInteger(digit) || digit < 1 || digit > h.optionKeys.length) return;
            e.preventDefault();
            h.choose(h.optionKeys[digit - 1]);
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    if (!question) return null;

    const meta = question.option_meta || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
        >
            <fieldset>
                <legend className="mb-7 flex w-full items-start gap-4">
                    {/* The orb, not a glyph. A different lucide icon on every
                        question made the header look like a settings menu and
                        said nothing; the orb is the same thing Vena wears, so
                        the header reads as "it is listening" and stays visually
                        identical from the first question to the dashboard.
                        `listening` is the state, and it is not decoration —
                        it is literally what this screen is doing. */}
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center">
                        <ThinkingOrb
                            state="listening"
                            size={44}
                            aria-label=""
                        />
                    </span>
                    <span className="min-w-0">
                        <span className="block font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
                            {question.question}
                        </span>
                        {question.hint && (
                            <span className="mt-2 block text-sm leading-relaxed text-ink-secondary">
                                {question.hint}
                            </span>
                        )}
                        {isMulti && (
                            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-3xs font-semibold uppercase tracking-widest text-ink-muted">
                                Choose as many as apply
                            </span>
                        )}
                    </span>
                </legend>

                <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
                    {optionKeys.map((optKey, i) => {
                        const om = meta[optKey] || {};
                        return (
                            <motion.div
                                key={optKey}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.34,
                                    delay: 0.06 * i,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full"
                            >
                                <OptionCard
                                    name={`vq-q-${question.key}`}
                                    value={optKey}
                                    label={question.options[optKey]}
                                    hint={om.hint}
                                    icon={glyph(om.icon)}
                                    multi={isMulti}
                                    selected={chosen.includes(optKey)}
                                    onSelect={choose}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* The one place this flow openly offers rather than deduces.
                    Shown only where the config supplies it — see `reassurance`. */}
                {question.reassurance && (
                    <p className="mt-4 flex items-start gap-2.5 rounded-md border border-line-subtle bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
                        <Info size={14} className="mt-0.5 shrink-0 text-accent-text" />
                        {question.reassurance}
                    </p>
                )}

                {isMulti && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onContinue}
                            className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                            Continue
                            <ArrowRight size={16} />
                        </button>

                        {chosen.length > 0 && (
                            <span className="text-xs text-ink-muted">
                                {chosen.length} selected
                            </span>
                        )}

                        {/* An optional question must have somewhere to put "none
                            of these". Without it, the honest answer is a dead end
                            and people invent one instead. */}
                        {question.optional && chosen.length === 0 && (
                            <button
                                type="button"
                                onClick={onContinue}
                                className="text-xs font-semibold text-ink-muted underline-offset-4 transition-colors duration-fast ease-standard hover:text-ink hover:underline"
                            >
                                None of these — skip
                            </button>
                        )}
                    </div>
                )}
            </fieldset>
        </motion.div>
    );
}
