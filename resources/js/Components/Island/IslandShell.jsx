import React, { useRef, useState, useLayoutEffect, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { geometryTransition, radiusForHeight, PRESS, DUR, EASE_OUT, prefersReducedMotion } from './motion';

/**
 * The morphing surface.
 *
 * ── The bug this file exists to fix ──────────────────────────────────────────
 * The previous island was two separate DOM trees: a <button> pill in the header,
 * and — when focused — a portalled modal that faded in from y:-26 while the pill
 * unmounted. Nothing morphed. A thing vanished and a different thing arrived.
 * That is why it read as "basic" no matter how the easing was tuned: there was
 * no shared element for the easing to act on.
 *
 * Here there is exactly ONE island node for the whole lifetime of the component.
 * It is position:fixed and parked over an invisible slot that sits in the header
 * and reserves the pill's footprint. Expanding animates width/height on that
 * same node, so the surface genuinely stretches out of the pill and sucks back
 * into it. Every state is the same piece of glass at a different size.
 *
 * It is pinned by its horizontal CENTRE (x: -50%), so growth is symmetric about
 * the pill — the island opens *around* where it already was rather than
 * unspooling to the right.
 */

/** Keeps the fixed island parked over its in-flow slot. */
function useIslandAnchor(slotRef) {
  const [anchor, setAnchor] = useState({ cx: 0, top: 0, ready: false });
  const frame = useRef(0);

  const measure = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return; // hidden (e.g. responsive)
    setAnchor((prev) => {
      const cx = r.left + r.width / 2;
      const top = r.top;
      if (prev.ready && Math.abs(prev.cx - cx) < 0.5 && Math.abs(prev.top - top) < 0.5) return prev;
      return { cx, top, ready: true };
    });
  }, [slotRef]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useLayoutEffect(() => {
    measure();
    const el = slotRef.current;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro && el) ro.observe(el);
    if (ro) ro.observe(document.documentElement);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(frame.current);
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, { capture: true });
    };
  }, [measure, schedule, slotRef]);

  return anchor;
}

export default function IslandShell({
  width,
  height,
  restWidth,
  restHeight,
  isOpen,
  isAlert = false,
  tone = 'neutral',        // 'neutral' | 'accent' | 'warning' | 'danger'
  sheen: sheenEnabled = true,
  onHoverChange,
  onScrimClick,
  children,
  slotClassName = '',
  ariaLabel = 'VenQore Island',
}) {
  const slotRef = useRef(null);
  const surfaceRef = useRef(null);
  const anchor = useIslandAnchor(slotRef);
  const gooId = useId().replace(/:/g, '');
  const reduced = prefersReducedMotion();

  // Growth direction picks the spring pair (see motion.js). Measured against
  // REST rather than the previous frame: every mode either grows out of the
  // pill or collapses back into it, so rest is the honest reference point —
  // and it keeps this a pure render with no ref read.
  const isGrowing = width * height > restWidth * restHeight;

  // ── Radius is derived from the LIVE animated height, never animated itself ──
  // A motion value mirrors the height spring, and radius reads off it every
  // frame. Corners therefore travel on exactly the same clock as the box.
  const hMV = useMotionValue(restHeight);
  const radius = useTransform(hMV, (h) => radiusForHeight(h));

  // ── Pointer-tracked specular rim ───────────────────────────────────────────
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 30, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 220, damping: 30, mass: 0.7 });
  const sheen = useTransform(
    [sx, sy],
    ([x, y]) =>
      `radial-gradient(110px circle at ${x * 100}% ${y * 100}%, rgba(35,196,166,.09), rgba(255,255,255,.025) 40%, transparent 70%)`
  );

  const handlePointer = (e) => {
    const el = surfaceRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };

  const toneRing = {
    neutral: 'rgba(255,255,255,.10)',
    accent: 'rgba(35,196,166,.42)',
    warning: 'rgba(255,205,91,.45)',
    danger: 'rgba(255,138,107,.48)',
  }[tone];

  const toneGlow = {
    neutral: '0 24px 56px -16px rgba(13,20,18,.42)',
    accent: '0 24px 56px -16px rgba(11,170,143,.40)',
    warning: '0 24px 56px -16px rgba(166,105,10,.38)',
    danger: '0 24px 56px -16px rgba(196,68,58,.40)',
  }[tone];

  const transition = reduced
    ? { width: { duration: DUR.d2, ease: EASE_OUT }, height: { duration: DUR.d2, ease: EASE_OUT } }
    : geometryTransition(isGrowing, isAlert);

  const island = (
    <>
      {/* Scrim — z is owner minus one, per DESIGN-RULES §3 */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: DUR.d3, ease: EASE_OUT }}
        onClick={onScrimClick}
        className="fixed inset-0 z-modal-scrim"
        style={{
          background: 'rgb(13 20 18 / .40)',
          backdropFilter: 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: 'blur(10px) saturate(120%)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      <div
        className="fixed z-command"
        style={{
          left: anchor.cx,
          top: anchor.top,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          opacity: anchor.ready ? 1 : 0,
        }}
      >
        {/* ── Mercury layer ──────────────────────────────────────────────────
            Apple's island doesn't pop a badge next to itself, it grows one out
            of its own edge and reabsorbs it. That's a gooey-blob filter: blur
            the shapes together, then crush the alpha ramp so the blurred
            overlap snaps back to a hard edge. Two near shapes fuse into one
            silhouette with a real meniscus between them.

            It sits BEHIND the live surface and is purely decorative — putting a
            filter on the surface itself would kill its backdrop-filter and blur
            the text. */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs>
            <filter id={`goo-${gooId}`}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        <motion.div
          aria-hidden
          className="absolute left-1/2 top-0"
          style={{ filter: `url(#goo-${gooId})`, transform: 'translateX(-50%)', pointerEvents: 'none' }}
          animate={{ opacity: isAlert ? 1 : 0 }}
          transition={{ duration: DUR.d2, ease: EASE_OUT }}
        >
          <motion.div
            initial={{ width: restWidth, height: restHeight }}
            animate={{ width, height }}
            transition={transition}
            style={{ borderRadius: radius, background: '#0D1412' }}
          />
          {/* The satellite that detaches and re-merges on an alert. */}
          <motion.span
            className="absolute rounded-full"
            style={{ background: '#0D1412', width: 16, height: 16, left: '50%', marginLeft: -8 }}
            animate={
              isAlert
                ? { top: [restHeight * 0.5, -14, restHeight * 0.5], scale: [0.4, 1, 0.4], opacity: [0, 1, 0] }
                : { top: restHeight * 0.5, scale: 0.4, opacity: 0 }
            }
            transition={{ duration: 0.62, ease: EASE_OUT, times: [0, 0.45, 1] }}
          />
        </motion.div>

        {/* ── The one true surface ───────────────────────────────────────── */}
        <motion.div
          ref={surfaceRef}
          aria-label={ariaLabel}
          onPointerMove={handlePointer}
          onPointerEnter={() => onHoverChange?.(true)}
          onPointerLeave={() => {
            px.set(0.5);
            py.set(0.5);
            onHoverChange?.(false);
          }}
          className="relative overflow-hidden"
          initial={{ width: restWidth, height: restHeight }}
          animate={{ width, height }}
          style={{
            borderRadius: radius,
            pointerEvents: 'auto',
            background: 'linear-gradient(180deg, #131C19 0%, #0D1412 42%, #070C0A 100%)',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 0 1px ${toneRing}, 0 2px 6px rgba(13,20,18,.20), ${toneGlow}`,
            color: '#F1F5F2',
            willChange: 'width, height',
          }}
          transition={transition}
          onUpdate={(latest) => {
            if (typeof latest.height === 'number') hMV.set(latest.height);
          }}
        >
          {/* Specular rim that follows the pointer — collapsed states only. */}
          {sheenEnabled && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: sheen, mixBlendMode: 'plus-lighter' }}
            />
          )}
          {/* Fixed top gloss — the light source that makes it read as glass */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.07), transparent)' }}
          />
          {children}
        </motion.div>
      </div>
    </>
  );

  return (
    <>
      {/* In-flow slot: reserves the pill's footprint in the header and gives the
          fixed island something to track. Never painted. */}
      <div
        ref={slotRef}
        className={slotClassName}
        style={{ width: restWidth, height: restHeight }}
        aria-hidden
      />
      {typeof document !== 'undefined' && createPortal(island, document.body)}
    </>
  );
}

export { useIslandAnchor };
