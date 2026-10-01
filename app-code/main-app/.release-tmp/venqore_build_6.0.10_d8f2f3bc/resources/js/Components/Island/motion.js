/**
 * VenQore Dynamic Island — the motion contract.
 *
 * Everything about how the island *feels* is defined here and nowhere else.
 * Point, never copy: a component that needs a curve imports it from this file.
 *
 * ── Why real springs and not the V6 duration tokens ───────────────────────────
 * DESIGN-RULES v3.0 §9 fixes four durations and four cubic-beziers. That rule
 * exists so colour, hover and entrance timing stay uniform across 312 pages, and
 * it still governs every one of those things here — see EASE_OUT / DUR below,
 * which are the tokens verbatim.
 *
 * The island's *geometry* is the one exception, and deliberately so. A
 * duration-based curve travels the same shape whether it moves 6px or 600px, and
 * it cannot be interrupted: retarget it mid-flight and it restarts from zero
 * velocity, which is the visible "stutter" in the old island. A spring carries
 * velocity across a retarget, so an alert that lands while the panel is still
 * opening bends the motion instead of snapping it. That property is the entire
 * reason Apple's island reads as one physical object, and no cubic-bezier has it.
 *
 * So: springs for width/height only. Everything else stays on the tokens.
 */

// ── V6 tokens, verbatim (tokens/motion.css) ──────────────────────────────────
export const DUR = { d1: 0.12, d2: 0.2, d3: 0.32, d4: 0.52 };
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];
export const EASE_SPRING_SOFT = [0.32, 1.28, 0.5, 1];
export const STAGGER = 0.06; // --vq-stagger: 60ms

// ── Geometry springs ─────────────────────────────────────────────────────────
//
// Width and height get DIFFERENT springs, and that asymmetry is the whole trick.
// Damping ratio z = c / (2*sqrt(k*m)):
//
//   OPEN_W  34 / (2*sqrt(380 * 1.00)) = 0.87  -> ~2% overshoot, arrives late
//   OPEN_H  40 / (2*sqrt(460 * 0.90)) = 0.98  -> effectively critical, no wobble
//
// Height snaps to its mark while width is still easing past it, so the island
// "unfurls" sideways instead of scaling like a box. Matched springs on both axes
// is what makes every Dynamic Island clone read as a resizing div.
export const OPEN_W = { type: 'spring', stiffness: 380, damping: 34, mass: 1.0 };
export const OPEN_H = { type: 'spring', stiffness: 460, damping: 40, mass: 0.9 };

// Collapsing flips the relationship: width leads, height trails, so the surface
// draws inward to the centre rather than dropping.
export const CLOSE_W = { type: 'spring', stiffness: 520, damping: 42, mass: 0.85 };
export const CLOSE_H = { type: 'spring', stiffness: 400, damping: 38, mass: 1.0 };

// An alert arriving is the one moment that should feel *bouncy*.
//   z = 30 / (2*sqrt(520 * 1.15)) = 0.61  -> a real, visible overshoot
export const POP = { type: 'spring', stiffness: 520, damping: 30, mass: 1.15 };

// Press feedback. Stiff and heavily damped so it reads as a click, not a squish.
export const PRESS = { type: 'spring', stiffness: 900, damping: 45, mass: 0.6 };

/** Pick the geometry transition for a morph, given its direction. */
export const geometryTransition = (isGrowing, isAlert = false) => {
  if (isAlert) return { width: POP, height: POP };
  return isGrowing
    ? { width: OPEN_W, height: OPEN_H }
    : { width: CLOSE_W, height: CLOSE_H };
};

// ── Content crossfade ────────────────────────────────────────────────────────
//
// The counter-motion is the point. The container is growing underneath, so
// incoming content starts slightly LARGER and settles down into place while
// outgoing content shrinks away. Both blur through the change. Read together
// they look like one surface resolving, not two divs swapping.
//
// Timing is intentionally *inside* the container morph: content is done at
// ~320ms while the geometry spring is still settling to ~500ms. Content that
// finishes with the container looks like a slide transition.
export const contentVariants = {
  initial: { opacity: 0, scale: 1.05, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: DUR.d3, delay: DUR.d1 * 0.5, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: 'blur(6px)',
    transition: { duration: DUR.d1, ease: EASE_OUT },
  },
};

/** Children of a revealed panel, staggered on the V6 60ms step. */
export const listVariants = {
  animate: { transition: { staggerChildren: STAGGER, delayChildren: DUR.d1 } },
};

export const itemVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DUR.d3, ease: EASE_SPRING_SOFT },
  },
};

// ── Radius law ───────────────────────────────────────────────────────────────
//
// Radius is DERIVED from height, never animated on its own. Give it its own
// transition and it overshoots on a different clock from the box it belongs to,
// and the corners visibly breathe — the single most common tell in a clone.
//
// Ceiling is --vq-r-xl (28px), the V6 modal radius, so the open panel is shaped
// like every other modal in the product.
export const RADIUS_CEILING = 28;
export const radiusForHeight = (h) => Math.min(h / 2, RADIUS_CEILING);

// ── Reduced motion ───────────────────────────────────────────────────────────
export const REDUCED = { duration: DUR.d2, ease: EASE_OUT };
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
