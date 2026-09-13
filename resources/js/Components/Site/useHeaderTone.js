/**
 * useHeaderTone — what colour is the page directly behind the header?
 *
 * The public header is transparent glass. Glass over a white band needs ink
 * text; the same glass over the dark hero, a dark band or the footer needs
 * white text. A fixed palette is readable on one of those and illegible on the
 * other, which is exactly the defect the old header had.
 *
 * So we sample. Three points across the header's vertical centre; at each one
 * we hit-test the page underneath (skipping the header itself), walk up from
 * the topmost element until something paints an opaque background, and read
 * its luminance. A majority vote of the three decides the tone.
 *
 * Sections whose background cannot be read off the DOM — a WebGL canvas, a
 * `pointer-events:none` gradient layer — declare themselves:
 *
 *   data-tone="dark" | "light"                      fixed
 *   data-tone-light="dark" data-tone-dark="light"   depends on the theme
 *
 * and `--vq-known-bg` (already used by the contrast sweep) is honoured where
 * an element defines it.
 *
 * Returns 'dark' (dark backdrop → light text) or 'light'. Runs in rAF, so a
 * scroll costs at most one measurement per frame.
 */
import { useEffect, useState } from 'react';

const DARK_THRESHOLD = 0.36;

function parseColor(str) {
    if (!str) return null;
    const s = str.trim();
    let m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
    if (m) {
        let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
        return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    m = s.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
        let h = m[1];
        if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
        const n = parseInt(h.slice(0, 6), 16);
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
    }
    return null;
}

function luminance({ r, g, b }) {
    const f = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Average of the colour stops in a gradient string, ignoring near-transparent ones. */
function gradientLuminance(bgImage) {
    if (!bgImage || bgImage === 'none' || !bgImage.includes('gradient')) return null;
    const stops = bgImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/gi) || [];
    const cols = stops.map(parseColor).filter((c) => c && c.a > 0.35);
    if (!cols.length) return null;
    return cols.reduce((sum, c) => sum + luminance(c), 0) / cols.length;
}

function declaredTone(el, isDark) {
    const ds = el.dataset || {};
    const themed = isDark ? ds.toneDark : ds.toneLight;
    const t = themed || ds.tone;
    if (t === 'dark') return 0.02;
    if (t === 'light') return 0.95;
    return null;
}

function luminanceBehind(x, y, header, isDark) {
    const stack = document.elementsFromPoint(x, y);
    const top = stack.find(
        (n) => !header.contains(n) && !(n.closest && n.closest('[data-tone-ignore]')),
    );
    let el = top || document.body;

    while (el && el.nodeType === 1) {
        const declared = declaredTone(el, isDark);
        if (declared !== null) return declared;

        const cs = getComputedStyle(el);
        const bg = parseColor(cs.backgroundColor);
        if (bg && bg.a >= 0.55) return luminance(bg);

        const grad = gradientLuminance(cs.backgroundImage);
        if (grad !== null) return grad;

        // --vq-known-bg inherits, so only trust it on the element that sets it.
        const known = cs.getPropertyValue('--vq-known-bg').trim();
        if (known && known !== 'skip') {
            const parent = el.parentElement;
            const inherited = parent ? getComputedStyle(parent).getPropertyValue('--vq-known-bg').trim() : '';
            if (known !== inherited) {
                const k = parseColor(known);
                if (k) return luminance(k);
            }
        }
        el = el.parentElement;
    }
    const rootBg = parseColor(getComputedStyle(document.body).backgroundColor);
    return rootBg && rootBg.a > 0.5 ? luminance(rootBg) : null;
}

export default function useHeaderTone(ref) {
    const [tone, setTone] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        let raf = 0;

        const measure = () => {
            raf = 0;
            const header = ref.current;
            if (!header || typeof document.elementsFromPoint !== 'function') return;
            const isDark = document.documentElement.classList.contains('dark');
            const rect = header.getBoundingClientRect();
            const y = Math.max(1, Math.round(rect.top + rect.height / 2));
            const w = window.innerWidth;
            let dark = 0;
            let seen = 0;
            [0.1, 0.5, 0.9].forEach((f) => {
                const L = luminanceBehind(Math.round(w * f), y, header, isDark);
                if (L === null) return;
                seen += 1;
                if (L < DARK_THRESHOLD) dark += 1;
            });
            if (!seen) return;
            const next = dark * 2 > seen ? 'dark' : 'light';
            setTone((prev) => (prev === next ? prev : next));
        };

        // rAF is paused in background tabs/iframes; the timeout makes sure a
        // measurement still lands (e.g. after focus() scrolls a hidden page).
        let fallback = 0;
        const schedule = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(() => { window.clearTimeout(fallback); measure(); });
            fallback = window.setTimeout(() => { if (raf) { window.cancelAnimationFrame(raf); measure(); } }, 160);
        };

        measure();
        const timers = [120, 450, 1200, 2500].map((ms) => window.setTimeout(schedule, ms));
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        window.addEventListener('theme-changed', schedule);
        window.addEventListener('load', schedule);
        const mo = new MutationObserver(schedule);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

        return () => {
            if (raf) window.cancelAnimationFrame(raf);
            window.clearTimeout(fallback);
            timers.forEach((t) => window.clearTimeout(t));
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            window.removeEventListener('theme-changed', schedule);
            window.removeEventListener('load', schedule);
            mo.disconnect();
        };
    }, [ref]);

    return tone;
}
