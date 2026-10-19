/**
 * GuidedTour — shows WHERE things are and HOW to do things, on the real screen.
 *
 * It dims the page, outlines the real button / field / section, and explains it in a small
 * card next to it. "Do it yourself" steps wait for you to actually do the thing (click, type,
 * choose) and move on by themselves. Content lives in lib/tours.js.
 *
 * The run is kept in sessionStorage so it follows you between pages (the layout remounts on
 * every page change). Start one from anywhere:
 *     import { startTour } from '@/lib/tourControl';  startTour('purchase');
 *
 * Never traps: a step whose target is not on screen is skipped (optional steps) or shown as a
 * centred card that says so. Esc, the X and "Skip tour" always leave. Arrow keys move.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, MousePointerClick, X } from 'lucide-react';
import { TOURS } from '@/lib/tours';

const KEY = 'vq-tour-run';
const PAD = 8;
const GAP = 16;
const CARD_W = 360;
const FIND_FOR_MS = 4500;
const OPTIONAL_FOR_MS = 1500;

const read = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
};
const write = (run) => {
    try { run ? sessionStorage.setItem(KEY, JSON.stringify(run)) : sessionStorage.removeItem(KEY); } catch (e) { /* private window: the tour just will not follow page changes */ }
};

const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = window.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
};

/** First visible match for a step: selector(s), optional text filter, optional nth. */
function findTarget(step) {
    if (!step.target) return null;
    const want = step.contains ? step.contains.toLowerCase() : null;
    for (const sel of [].concat(step.target)) {
        let list = [];
        try { list = Array.from(document.querySelectorAll(sel)).filter(isVisible); } catch (e) { list = []; }
        if (want) list = list.filter((el) => `${el.innerText || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase().includes(want));
        const el = list[step.pick || 0];
        if (el) return el;
    }
    return null;
}

/** Choose where the card goes: below, above, beside, else docked at the bottom. */
function placeCard(rect, w, h, vw, vh, narrow) {
    if (narrow) return { dock: true, side: 'bottom' };
    const m = 12;
    const cx = Math.min(Math.max(m, rect.left + rect.width / 2 - w / 2), vw - w - m);
    const cy = Math.min(Math.max(m, rect.top + rect.height / 2 - h / 2), vh - h - m);
    const fits = {
        bottom: rect.top + rect.height + PAD + GAP + h < vh - m,
        top: rect.top - PAD - GAP - h > m,
        right: rect.left + rect.width + PAD + GAP + w < vw - m,
        left: rect.left - PAD - GAP - w > m,
    };
    // A tall or narrow target (a side menu) reads best with the card beside it.
    const tall = rect.height > vh * 0.45 || (rect.width < 96 && rect.height > 120);
    const order = tall ? ['right', 'left', 'bottom', 'top'] : ['bottom', 'top', 'right', 'left'];
    const side = order.find((s) => fits[s]);
    if (!side) return { dock: true, side: 'bottom' };
    if (side === 'bottom') return { side, left: cx, top: rect.top + rect.height + PAD + GAP, ax: rect.left + rect.width / 2 - cx };
    if (side === 'top') return { side, left: cx, top: rect.top - PAD - GAP - h, ax: rect.left + rect.width / 2 - cx };
    if (side === 'right') return { side, left: rect.left + rect.width + PAD + GAP, top: cy, ay: rect.top + rect.height / 2 - cy };
    return { side, left: rect.left - PAD - GAP - w, top: cy, ay: rect.top + rect.height / 2 - cy };
}

export default function GuidedTour() {
    const { url, props } = usePage();
    const store = props?.store;
    const slug = store?.slug || '';
    const [run, setRun] = useState(() => read());
    const [rect, setRect] = useState(null);
    const [searching, setSearching] = useState(false);
    const [done, setDone] = useState(false);
    const [narrow, setNarrow] = useState(false);
    const [cardH, setCardH] = useState(220);
    const [label, setLabel] = useState('');
    const cardRef = useRef(null);
    const targetRef = useRef(null);
    const dirRef = useRef(1);

    const tour = run ? TOURS[run.id] : null;
    const step = tour ? tour.steps[run.i] : null;
    const total = tour ? tour.steps.length : 0;
    const last = tour ? run.i === total - 1 : false;

    const stop = useCallback((finished = false) => {
        if (run && finished) {
            try { localStorage.setItem(`vq-tour-done:${run.id}:${slug}`, '1'); } catch (e) { /* ignore */ }
        }
        write(null);
        setRun(null);
        setRect(null);
        setDone(false);
    }, [run, slug]);

    const go = useCallback((delta) => {
        if (!run || !tour) return;
        dirRef.current = delta;
        const i = run.i + delta;
        if (i < 0) return;
        if (i >= tour.steps.length) { setDone(true); return; }
        const next = { id: run.id, i };
        write(next);
        setRun(next);
    }, [run, tour]);

    // Start from anywhere (Getting started card, checklist, etc. — 'welcome' is handled by WelcomeTourModal).
    useEffect(() => {
        const onStart = (e) => {
            const id = e.detail;
            if (id === 'welcome' || !TOURS[id]) return;
            const next = { id, i: 0 };
            dirRef.current = 1;
            write(next);
            setDone(false);
            setRun(next);
        };
        window.addEventListener('vq-tour-start', onStart);
        return () => window.removeEventListener('vq-tour-start', onStart);
    }, []);

    // Move to the page a step belongs on.
    useEffect(() => {
        if (!step?.go || !slug) return;
        if (step.match && window.location.pathname.includes(step.match)) return;
        router.visit(route(step.go, { store_slug: slug }), { preserveState: false });
    }, [step, slug]);

    // Find the highlighted thing (it may appear a moment after a page or a window opens).
    useEffect(() => {
        if (!step) return undefined;
        targetRef.current = null;
        queueMicrotask(() => { setRect(null); setLabel(''); setSearching(!!step.target); });
        if (!step.target) return undefined;
        const started = Date.now();
        const limit = step.optional ? OPTIONAL_FOR_MS : FIND_FOR_MS;
        let raf = 0;
        let timer = 0;
        const measure = () => {
            const el = targetRef.current;
            if (!el || !el.isConnected) { targetRef.current = null; setRect(null); timer = window.setTimeout(tick, 200); return; }
            const r = el.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
            raf = requestAnimationFrame(measure);
        };
        const tick = () => {
            const el = findTarget(step);
            if (el) {
                targetRef.current = el;
                if (step.labelFrom) setLabel((el.querySelector(step.labelFrom)?.textContent || '').trim());
                el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
                setSearching(false);
                measure();
                return;
            }
            if (Date.now() - started > limit) {
                setSearching(false);
                if (step.optional) go(dirRef.current < 0 ? -1 : 1);
                return;
            }
            timer = window.setTimeout(tick, 200);
        };
        tick();
        return () => { cancelAnimationFrame(raf); window.clearTimeout(timer); };
    }, [step, url]); // eslint-disable-line react-hooks/exhaustive-deps

    // "Do it yourself" steps move on when you actually do the thing.
    useEffect(() => {
        if (!step?.advanceOn || step.advanceOn === 'manual' || !rect) return undefined;
        let timer = 0;
        const inTarget = (n) => targetRef.current && n instanceof Node && targetRef.current.contains(n);
        const fire = (delay) => { window.clearTimeout(timer); timer = window.setTimeout(() => go(1), delay); };
        const onClick = (e) => { if (step.advanceOn === 'click' && inTarget(e.target)) fire(450); };
        const onInput = (e) => {
            if (step.advanceOn !== 'input' || !inTarget(e.target)) return;
            const v = e.target.value;
            if (v === undefined || String(v).trim() !== '') fire(900);
        };
        const onFocus = (e) => { if (step.advanceOn === 'focus' && inTarget(e.target)) fire(250); };
        document.addEventListener('click', onClick, true);
        document.addEventListener('input', onInput, true);
        document.addEventListener('focusin', onFocus, true);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('focusin', onFocus, true);
        };
    }, [step, go, !!rect]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onKey = (e) => {
            if (!run) return;
            if (e.key === 'Escape') stop(false);
            const typing = /^(input|textarea|select)$/i.test(e.target?.tagName || '') || e.target?.isContentEditable;
            if (typing) return;
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [run, stop, go]);

    useEffect(() => {
        const set = () => setNarrow(window.innerWidth < 640);
        set();
        window.addEventListener('resize', set);
        return () => window.removeEventListener('resize', set);
    }, []);

    useLayoutEffect(() => {
        if (cardRef.current) setCardH(cardRef.current.offsetHeight);
        cardRef.current?.querySelector('[data-tour-primary]')?.focus({ preventScroll: true });
    }, [run?.i, run?.id, rect, done, label]);

    if (!run || !tour || !step || typeof document === 'undefined') return null;
    // A step that needs another page waits there quietly, so nothing flashes in the wrong place.
    if (step.go && step.match && !window.location.pathname.includes(step.match)) return null;

    const anchored = !!rect && !searching;
    const missing = !!step.target && !anchored && !searching;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(CARD_W, vw - 24);
    const pos = anchored ? placeCard(rect, w, cardH, vw, vh, narrow) : null;
    const cardStyle = !anchored
        ? { left: '50%', top: '50%', width: w, x: '-50%', y: '-50%' }
        : pos.dock
            ? { left: 12, right: 12, bottom: 12 }
            : { left: pos.left, top: pos.top, width: w };
    const waits = !!step.advanceOn && step.advanceOn !== 'manual' && anchored;
    const title = step.labelFrom && label ? label : step.title;
    const body = step.labelFrom && label && step.bodyFor ? step.bodyFor.replace('{label}', label) : step.body;

    return createPortal(
        <div className="fixed inset-0 z-[10000100] pointer-events-none" aria-live="polite">
            {anchored ? (
                <>
                    <div
                        className="fixed rounded-xl transition-[top,left,width,height] duration-200"
                        style={{
                            top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2,
                            boxShadow: '0 0 0 9999px rgba(6, 16, 13, 0.6)',
                        }}
                    />
                    <div
                        className="fixed rounded-xl border-[3px] animate-pulse transition-[top,left,width,height] duration-200"
                        style={{
                            top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2,
                            borderColor: 'var(--vq-accent-fill, #0b6b5b)', boxShadow: '0 0 0 4px rgba(255,255,255,0.35)',
                        }}
                    />
                </>
            ) : (
                <div className="fixed inset-0 bg-black/60" />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${run.id}-${run.i}-${done}`}
                    ref={cardRef}
                    role="dialog"
                    aria-label={tour.title}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ position: 'fixed', ...cardStyle }}
                    className="pointer-events-auto rounded-2xl border border-line bg-surface p-5 shadow-2xl"
                >
                    {anchored && pos && !pos.dock && (
                        <span
                            aria-hidden="true"
                            className="absolute h-3.5 w-3.5 rotate-45 border-line bg-surface"
                            style={{
                                ...(pos.side === 'bottom' && { top: -8, left: Math.min(Math.max(20, pos.ax - 7), w - 34), borderLeftWidth: 1, borderTopWidth: 1 }),
                                ...(pos.side === 'top' && { bottom: -8, left: Math.min(Math.max(20, pos.ax - 7), w - 34), borderRightWidth: 1, borderBottomWidth: 1 }),
                                ...(pos.side === 'right' && { left: -8, top: Math.min(Math.max(20, pos.ay - 7), cardH - 34), borderLeftWidth: 1, borderBottomWidth: 1 }),
                                ...(pos.side === 'left' && { right: -8, top: Math.min(Math.max(20, pos.ay - 7), cardH - 34), borderRightWidth: 1, borderTopWidth: 1 }),
                            }}
                        />
                    )}

                    {done ? (
                        <div className="text-center">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-fill text-accent-on"><Check size={24} strokeWidth={3} aria-hidden="true" /></span>
                            <h3 className="mt-3 text-lg font-bold text-ink">{tour.doneTitle || 'All done'}</h3>
                            <p className="mt-1 text-sm text-ink-secondary">{tour.doneBody || 'You can replay this any time from your profile.'}</p>
                            <button type="button" data-tour-primary onClick={() => stop(true)} className="mt-4 min-h-[44px] rounded-full bg-accent-fill px-6 text-sm font-semibold text-accent-on">Close</button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-fill text-sm font-bold text-accent-on">{run.i + 1}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">{tour.title}</p>
                                        <h3 className="mt-0.5 text-lg font-bold leading-snug text-ink">{title}</h3>
                                    </div>
                                </div>
                                <button type="button" onClick={() => stop(false)} aria-label="Close tour" className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-interactive-hover">
                                    <X size={18} aria-hidden="true" />
                                </button>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{body}</p>
                            {missing && (
                                <p className="mt-2 rounded-lg bg-sunken p-3 text-xs text-ink-muted">{step.where || 'This is not showing on your screen right now, so there is nothing to point at. Carry on and you will find it later.'}</p>
                            )}
                            {waits && (
                                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-quiet px-3 py-1.5 text-xs font-semibold text-accent-text">
                                    <MousePointerClick size={14} aria-hidden="true" />{step.hint || 'Go ahead, we will move on when you do it.'}
                                </p>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1" aria-hidden="true">
                                    {tour.steps.map((_, n) => (
                                        <span key={n} className={`h-1.5 rounded-full transition-all ${n === run.i ? 'w-5 bg-accent-fill' : n < run.i ? 'w-1.5 bg-accent-fill/60' : 'w-1.5 bg-line'}`} />
                                    ))}
                                </div>
                                <span className="text-xs text-ink-muted">{run.i + 1} of {total}</span>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <button type="button" onClick={() => stop(false)} className="min-h-[44px] text-sm font-semibold text-ink-muted hover:text-ink">Skip tour</button>
                                <div className="flex items-center gap-2">
                                    {run.i > 0 && (
                                        <button type="button" onClick={() => go(-1)} className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-line px-4 text-sm font-semibold text-ink">
                                            <ArrowLeft size={15} aria-hidden="true" />Back
                                        </button>
                                    )}
                                    <button type="button" data-tour-primary onClick={() => go(1)} className={`inline-flex min-h-[44px] items-center gap-1 rounded-full px-5 text-sm font-semibold ${waits ? 'border border-line text-ink-secondary' : 'bg-accent-fill text-accent-on'}`}>
                                        {waits ? 'Skip this step' : last ? 'Finish' : 'Next'}{!waits && !last && <ArrowRight size={15} aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body,
    );
}
