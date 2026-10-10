import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Heart, Minus, Plus, Star } from 'lucide-react';
import { initials } from '@/Components/Commerce/shop';

/* Shared pieces for the VenQore storefront design (StoreFrame + the store pages). */

/** Whole amounts without decimals ("Rs 1,230"); fractions keep two. */
export const money = (n, symbol = 'Rs') => {
    const v = Number(n ?? 0);
    const whole = Math.abs(v - Math.round(v)) < 0.005;
    return `${symbol} ${v.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
};

export const shopUrl = (slug) => `/shop/${slug}`;
export const productsUrl = (slug, params = {}) => {
    const q = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false).map(([k, v]) => `${k}=${encodeURIComponent(v === true ? 1 : v)}`).join('&');
    return `/shop/${slug}/products${q ? `?${q}` : ''}`;
};
export const productUrl = (slug, id) => `/shop/${slug}/p/${id}`;
export const cartUrl = (slug) => `/shop/${slug}/cart`;
export const savePct = (price, was) => (was && Number(was) > Number(price) ? Math.round((1 - Number(price) / Number(was)) * 100) : null);
export const needsChoice = (item) => (item.options?.length || 0) > 1 || (item.addons?.length || 0) > 0;
export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

/* ── brand colour → design tokens ───────────────────────── */
const HEX = /^#[0-9a-fA-F]{6}$/;
const FALLBACK = ['#2F7A56', '#1E4FD8', '#B4532A', '#7A3E9D', '#0F7C8C', '#8A5A2B'];
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const hex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, t, to) => a.map((v, i) => v + (to[i] - v) * t);

/** The store's own colour (or a stable pick from its slug) as light + dark accent tokens. */
export function brandTokens(seed = '', color = null) {
    let base = HEX.test(color || '') ? color : null;
    if (!base) {
        let h = 0;
        for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        base = FALLBACK[h % FALLBACK.length];
    }
    const c = rgb(base);
    let light = c; while (lum(light) > 0.5) light = mix(light, 0.12, [0, 0, 0]);
    let dark = c; while (lum(dark) < 0.55) dark = mix(dark, 0.12, [255, 255, 255]);
    return {
        '--brand-l': hex(light), '--brand-l-ink': lum(light) > 0.6 ? '#0B0B0D' : '#FFFFFF', '--brand-l-soft': `rgba(${c.join(',')},.10)`,
        '--brand-d': hex(dark), '--brand-d-ink': '#05100B', '--brand-d-soft': `rgba(${dark.map(Math.round).join(',')},.14)`,
    };
}

/** Split a name so the last word can be set in the italic serif ("Corner <i>Mart</i>"). */
export function Headline({ text }) {
    const words = String(text || '').trim().split(/\s+/);
    if (words.length < 2) return <>{text}</>;
    const last = words.pop();
    return <>{words.join(' ')} <span className="serif">{last}</span></>;
}

/** Product photo, or a soft tile with initials when the shop has no image or hides images. */
export function Pic({ src, name, show = true, eager = false }) {
    const [broken, setBroken] = useState(false);
    const has = show && src && !broken;
    return (
        <span className={`vqsf-pic ${has ? 'has-img' : ''}`}>
            {has ? <img src={src} alt={name || ''} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBroken(true)} /> : <span className="ini" aria-hidden="true">{initials(name || '')}</span>}
        </span>
    );
}

export function Price({ item, sym }) {
    const from = (item.options?.length || 0) > 1 && item.price_from != null;
    return (
        <div className="vqsf-price">
            <div className="now">{from && <small>from</small>}{money(item.price_from ?? item.price, sym)}</div>
            {item.was_price && <s>{money(item.was_price, sym)}</s>}
        </div>
    );
}

export function Stepper({ value, onChange, min = 0, max = 50, label = '', large = false }) {
    const s = large ? 15 : 12;
    return (
        <span className={`vqsf-step ${large ? 'vqsf-step--lg' : ''}`}>
            <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={s} strokeWidth={2.4} /></button>
            <span aria-live="polite">{value}</span>
            <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={s} strokeWidth={2.4} /></button>
        </span>
    );
}

export function Stars({ value = 5, size = 13 }) {
    return (
        <span className="vqsf-stars" aria-label={`${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} fill="currentColor" strokeWidth={0} className={n <= value ? '' : 'off'} />)}
        </span>
    );
}

export function SectionHead({ eyebrow, accent = false, title, children, max }) {
    return (
        <div className="vqsf-sechead" data-reveal="">
            <div style={max ? { maxWidth: max } : undefined}>
                {eyebrow && <div className={`vqsf-eyebrow ${accent ? 'vqsf-eyebrow--accent' : ''}`}>{eyebrow}</div>}
                <h2 className="vqsf-h2">{title}</h2>
            </div>
            {children && <div className="side">{children}</div>}
        </div>
    );
}

export function SeeAll({ href, children }) {
    return <Link href={href} className="vqsf-seelink">{children}<ArrowRight size={15} strokeWidth={2} /></Link>;
}

/* ── saved items (per store, in this browser) ────────────── */
const SAVED_EVENT = 'vqsf-saved';
const savedKey = (slug) => `vqsf-saved:${slug}`;
const readSaved = (slug) => { try { const v = JSON.parse(localStorage.getItem(savedKey(slug)) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

export function useSaved(slug) {
    const [list, setList] = useState(() => (typeof window === 'undefined' ? [] : readSaved(slug)));
    useEffect(() => {
        const f = () => setList(readSaved(slug));
        f();
        window.addEventListener(SAVED_EVENT, f); window.addEventListener('storage', f);
        return () => { window.removeEventListener(SAVED_EVENT, f); window.removeEventListener('storage', f); };
    }, [slug]);
    const write = (next) => { try { localStorage.setItem(savedKey(slug), JSON.stringify(next.slice(0, 60))); } catch { /* storage blocked */ } try { window.dispatchEvent(new Event(SAVED_EVENT)); } catch { /* ignore */ } };
    const has = useCallback((id) => list.some((x) => String(x.id) === String(id)), [list]);
    const toggle = (item) => {
        const cur = readSaved(slug);
        const on = cur.some((x) => String(x.id) === String(item.id));
        write(on ? cur.filter((x) => String(x.id) !== String(item.id)) : [{ id: item.id, name: item.name, image_url: item.image_url || null, price: item.price_from ?? item.price, was_price: item.was_price || null, choice: needsChoice(item), out: item.stock === 'out', options: item.options || [], addons: item.addons || [] }, ...cur]);
        return !on;
    };
    const remove = (id) => write(readSaved(slug).filter((x) => String(x.id) !== String(id)));
    return { list, has, toggle, remove, count: list.length };
}

export function HeartBtn({ on, onClick, name }) {
    return (
        <button type="button" className={`vqsf-heart ${on ? 'on' : ''}`} aria-pressed={on} aria-label={on ? `Remove ${name} from saved` : `Save ${name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>
            <Heart size={15} strokeWidth={1.8} />
        </button>
    );
}

/** Open the frame's search, drawer or account modals from anywhere on the page. */
export const frame = {
    search: (q = '') => window.dispatchEvent(new CustomEvent('vqsf-open', { detail: { what: 'search', q } })),
    cart: () => window.dispatchEvent(new CustomEvent('vqsf-open', { detail: { what: 'cart' } })),
    saved: () => window.dispatchEvent(new CustomEvent('vqsf-open', { detail: { what: 'saved' } })),
    account: () => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'account' })),
    rate: () => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'rating' })),
    track: () => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'track' })),
};

/** Sticky bar helper: `stuck` is true once the bar is pinned under the nav, so it can turn into a frosted card. */
export function useStuck(top = 80) {
    const ref = useRef(null);
    const [stuck, setStuck] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const f = () => { const r = el.getBoundingClientRect(); setStuck(r.top <= top + 1 && window.scrollY > 40); };
        f(); window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f);
        return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f); };
    }, [top]);
    return [ref, stuck];
}

/** Horizontal chip row: drops the right-edge fade once scrolled to the end. */
export function useRowEnd() {
    const ref = useRef(null);
    const [end, setEnd] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const f = () => setEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
        f(); el.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f);
        return () => { el.removeEventListener('scroll', f); window.removeEventListener('resize', f); };
    });
    return [ref, end];
}
