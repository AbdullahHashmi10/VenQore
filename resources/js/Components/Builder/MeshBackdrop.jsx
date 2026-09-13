/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  MeshBackdrop — the ambient ground the builder sits on.                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * A mesh gradient, not a hero video and not a WebGL shader. Three reasons:
 *
 *   1. It costs nothing. No `ogl`, no `three`, no new dependency, no canvas
 *      readback. Six blurred divs and a transform.
 *   2. It survives the light theme. Most "premium" backgrounds are dark-only —
 *      they are glow on black, and on a white page they read as smudges. This
 *      one is built light-first and dimmed for dark, which is the direction
 *      that actually works.
 *   3. It respects `prefers-reduced-motion`. The drift stops; the colour stays.
 *      A background that induces nausea is not premium.
 *
 * ── Colour ─────────────────────────────────────────────────────────────────
 * Every pigment is a V6 ramp token read through `var()`. Nothing is typed as a
 * hex here, so re-tinting the whole product re-tints this with it. The blobs
 * use the four "playmates" plus the brand teal, in the ratio the design system
 * asks for: teal leads, the others accent. Never a rainbow.
 *
 * ── Motion ─────────────────────────────────────────────────────────────────
 * Durations are 28-46s. That is deliberately far slower than anything a user
 * will consciously notice — the effect should register as "this page is alive"
 * on a second glance, never as "something is moving at me". The V6 ambient
 * token (`--vq-dur-amb`, 9s) is the floor for this class of motion; these sit
 * well above it because the shapes are large and a large shape moving fast is
 * what makes a background feel cheap.
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Blob field. `x`/`y` are percentages of the viewport, `s` a scale multiplier,
 * `d` the drift duration in seconds. Positions are hand-placed rather than
 * random so the composition is stable across reloads — a background that
 * reshuffles on every visit reads as a bug.
 */
const BLOBS = [
    { tint: 'var(--vq-teal-300)',   x: '8%',  y: '-6%',  size: 46, o: 0.55, d: 34, dx: 4,  dy: 3 },
    { tint: 'var(--vq-sky-300)',    x: '72%', y: '-12%', size: 40, o: 0.42, d: 41, dx: -5, dy: 4 },
    { tint: 'var(--vq-lime-300)',   x: '84%', y: '46%',  size: 34, o: 0.34, d: 37, dx: -3, dy: -5 },
    { tint: 'var(--vq-coral-300)',  x: '-6%', y: '58%',  size: 38, o: 0.30, d: 46, dx: 5,  dy: -3 },
    { tint: 'var(--vq-butter-300)', x: '38%', y: '84%',  size: 32, o: 0.28, d: 29, dx: -4, dy: -4 },
    { tint: 'var(--vq-teal-400)',   x: '46%', y: '18%',  size: 28, o: 0.22, d: 43, dx: 3,  dy: 5 },
];

export default function MeshBackdrop({ intensity = 1 }) {
    const still = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden bg-app"
        >
            {/* The blobs are dimmed as a GROUP. Putting `dark:opacity-*` on each
                blob does nothing — every blob carries an inline `opacity`, and
                inline style beats a utility class. */}
            <div className="absolute inset-0 opacity-100 dark:opacity-45">
            {BLOBS.map((b, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        left: b.x,
                        top: b.y,
                        width: `${b.size}vmax`,
                        height: `${b.size}vmax`,
                        background: `radial-gradient(circle at 50% 50%, ${b.tint} 0%, transparent 68%)`,
                        opacity: b.o * intensity,
                        filter: 'blur(60px)',
                        willChange: still ? undefined : 'transform',
                    }}
                    animate={
                        still
                            ? undefined
                            : {
                                  x: [`0%`, `${b.dx}%`, `0%`],
                                  y: [`0%`, `${b.dy}%`, `0%`],
                                  scale: [1, 1.08, 1],
                              }
                    }
                    transition={
                        still
                            ? undefined
                            : {
                                  duration: b.d,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                  delay: i * -6,
                              }
                    }
                />
            ))}
            </div>

            {/* Wash — pulls the blobs back toward the page ground so text on top
                keeps its contrast ratio no matter which blob drifts under it. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(120% 80% at 50% 0%, transparent 0%, var(--vq-bg) 82%)',
                    opacity: 0.72,
                }}
            />

            {/* Grain. 3% is the whole budget: enough to kill gradient banding on
                a cheap panel, not enough to read as texture. */}
            <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.035 }}>
                <filter id="vq-builder-grain">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.82"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#vq-builder-grain)" />
            </svg>
        </div>
    );
}
