/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  OptionCard — the thing the whole flow is made of.                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * A choice, not a form field. That distinction is the entire design brief, and
 * it is carried by four decisions:
 *
 *   · SIZE. The whole card is the target, not a 16px circle inside it.
 *     Comfortably past the 44px minimum on the smallest phone, which is what
 *     makes a six-question flow feel quick instead of fiddly.
 *   · WEIGHT. Selection moves the border, the ground and the glyph together.
 *     One of those alone reads as hover; three read as a commitment.
 *   · SPRING. `--vq-ease-spring` overshoots. The card is briefly larger than it
 *     ends up, which is the physical tell that something was chosen rather than
 *     merely highlighted.
 *   · SPOTLIGHT. A radial that tracks the cursor — the mechanic borrowed from
 *     React Bits' SpotlightCard, not the code. Theirs paints a hard-coded dark
 *     grey ground at a radius above this system's ceiling; both are classes the
 *     §16 greps reject, so the effect is rebuilt here on accent tokens. It is
 *     the only hover affordance, so a mouse user gets feedback without the
 *     layout shifting.
 *
 * ── Why a real <input> ─────────────────────────────────────────────────────
 * The first cut used `role="radio"` on a button and hand-rolled arrow-key
 * navigation. A native input inside a label is strictly better: the browser
 * gives arrow keys, roving focus, form semantics, voice control and Windows
 * high-contrast for free, and there is no custom keyboard code left to get
 * wrong. The input is positioned off-screen rather than `display:none`, because
 * a hidden input is not focusable and would take the keyboard support with it.
 *
 * `multi` swaps it to a checkbox, which is not a cosmetic change: a radio group
 * is "pick the one", a checkbox group is "pick as many as are true", and using
 * radios for a question like "what do people pay you for?" quietly forces the
 * user to throw away the part of the answer that decides the build. The tick
 * mark squares off to match, so the shape tells you which kind of question you
 * are on before you read a word of it.
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { SPRING } from './ThemeSegment';

export default function OptionCard({
    name,
    value,
    label,
    hint,
    icon: Icon,
    selected = false,
    multi = false,
    onSelect,
}) {
    const hostRef = useRef(null);
    const still = useReducedMotion();
    const [spot, setSpot] = useState({ x: 0, y: 0, on: false });

    const handleMove = useCallback(
        (e) => {
            if (still || !hostRef.current) return;
            const r = hostRef.current.getBoundingClientRect();
            setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
        },
        [still],
    );

    return (
        <motion.label
            ref={hostRef}
            onMouseMove={handleMove}
            onMouseLeave={() => setSpot((s) => ({ ...s, on: false }))}
            whileTap={still ? undefined : { scale: 0.975 }}
            animate={still ? undefined : { scale: selected ? 1.015 : 1 }}
            transition={SPRING}
            className={`group relative flex h-full w-full cursor-pointer items-start gap-4 overflow-hidden rounded-lg border-2 p-5 text-left transition-colors duration-normal ease-standard has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus sm:p-6 ${
                selected
                    ? 'border-accent bg-accent-quiet shadow-glow'
                    : 'border-line bg-surface shadow-sm hover:border-line-strong hover:bg-interactive-hover'
            }`}
        >
            {/* Off-screen, not hidden: it must stay focusable for the browser to
                give us arrow keys and roving focus. */}
            <input
                type={multi ? 'checkbox' : 'radio'}
                name={multi ? `${name}[]` : name}
                value={value}
                checked={selected}
                onChange={() => onSelect(value)}
                className="absolute h-px w-px opacity-0"
            />

            {/* Cursor spotlight. Under the content, above the ground. */}
            {!still && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-slow ease-standard"
                    style={{
                        opacity: spot.on && !selected ? 0.5 : 0,
                        background: `radial-gradient(220px circle at ${spot.x}px ${spot.y}px, var(--vq-accent-quiet), transparent 72%)`,
                    }}
                />
            )}

            {Icon && (
                <span
                    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors duration-normal ease-standard ${
                        selected
                            ? 'bg-accent-fill text-accent-on'
                            : 'bg-sunken text-ink-muted group-hover:text-accent-text'
                    }`}
                >
                    <Icon size={20} strokeWidth={1.9} />
                </span>
            )}

            <span className="relative min-w-0 flex-1">
                <span className="block text-base font-semibold leading-snug text-ink">
                    {label}
                </span>
                {hint && (
                    <span className="mt-1 block text-xs leading-normal text-ink-muted">
                        {hint}
                    </span>
                )}
            </span>

            {/* The tick. Springs in, so the commitment has a sound even though
                there is no sound. */}
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                <motion.span
                    initial={false}
                    animate={
                        still
                            ? { opacity: selected ? 1 : 0 }
                            : { scale: selected ? 1 : 0.4, opacity: selected ? 1 : 0 }
                    }
                    transition={SPRING}
                    className={`flex h-6 w-6 items-center justify-center bg-accent-fill text-accent-on ${
                        multi ? 'rounded-xs' : 'rounded-full'
                    }`}
                >
                    <Check size={14} strokeWidth={3} />
                </motion.span>
                {!selected && (
                    <span
                        className={`absolute h-5 w-5 border-2 border-line-strong ${
                            multi ? 'rounded-xs' : 'rounded-full'
                        }`}
                    />
                )}
            </span>
        </motion.label>
    );
}
