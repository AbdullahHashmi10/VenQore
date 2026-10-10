import React from 'react';
import { Link } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { initials, tone } from '@/Components/Commerce/shop';

/** Whole amounts show without decimals ("Rs 1,230"); fractions keep two ("Rs 12.50"). */
export const fmt = (n, symbol = 'Rs') => {
    const v = Number(n ?? 0);
    const whole = Math.abs(v - Math.round(v)) < 0.005;
    return `${symbol} ${v.toLocaleString(undefined, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
};
const money = fmt;

/** Each business gets one stable accent colour from its slug, so stores feel like their own brand. */
const ACCENTS = [
    { a: '#23C4A6', b: '#0BAA8F', t: '#076B5E', on: '#04201B', glow: '35 196 166', hero: 'linear-gradient(135deg,#041c19 0%,#0A5049 55%,#0B8070 100%)' },
    { a: '#FF8A6B', b: '#E5573A', t: '#C0431F', on: '#FFFFFF', glow: '255 138 107', hero: 'linear-gradient(135deg,#240c06 0%,#5a1f10 55%,#9a361b 100%)' },
    { a: '#818CF8', b: '#4F46E5', t: '#4338CA', on: '#FFFFFF', glow: '129 140 248', hero: 'linear-gradient(135deg,#0c0e2c 0%,#26286b 55%,#3f43a8 100%)' },
    { a: '#FFCD5B', b: '#F5A524', t: '#955600', on: '#2B1500', glow: '255 205 91', hero: 'linear-gradient(135deg,#261802 0%,#5c3d07 55%,#94610c 100%)' },
    { a: '#D79BD6', b: '#A24F9C', t: '#7E3E76', on: '#FFFFFF', glow: '215 155 214', hero: 'linear-gradient(135deg,#200c22 0%,#4a1f4e 55%,#78327f 100%)' },
    { a: '#A9E34B', b: '#7DBB1F', t: '#4B7A0A', on: '#10200A', glow: '169 227 75', hero: 'linear-gradient(135deg,#0a1a08 0%,#1e4616 55%,#33722a 100%)' },
];
const HEX = /^#[0-9a-fA-F]{6}$/;
const toRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lumOf = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const dark = ([r, g, b], t) => `rgb(${Math.round(r * (1 - t))} ${Math.round(g * (1 - t))} ${Math.round(b * (1 - t))})`;
const hexOf = ([r, g, b]) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/** Store accent: the owner's primary (and optional secondary) colour when set, otherwise a stable pick from the store slug. */
export function accentFor(seed = '', primary = null, secondary = null) {
    if (HEX.test(primary || '')) {
        const p = toRgb(primary);
        const bRgb = HEX.test(secondary || '') ? toRgb(secondary) : p.map((v) => v * 0.78);
        const b = hexOf(bRgb);
        const onRgb = lumOf(bRgb) > 0.62 ? '#14110f' : '#ffffff';
        const text = lumOf(p) > 0.55 ? dark(p, 0.5) : primary;
        return {
            '--sf-a': primary, '--sf-b': b, '--sf-t': text, '--sf-on': onRgb, '--sf-glow': p.join(' '),
            '--sf-hero': `linear-gradient(135deg, ${dark(p, 0.82)} 0%, ${dark(p, 0.55)} 55%, ${HEX.test(secondary || '') ? dark(bRgb, 0.15) : dark(p, 0.2)} 100%)`,
            '--sf-grad': `linear-gradient(135deg, ${primary} 0%, ${b} 100%)`,
        };
    }
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const c = ACCENTS[h % ACCENTS.length];
    return {
        '--sf-a': c.a, '--sf-b': c.b, '--sf-t': c.t, '--sf-on': c.on, '--sf-glow': c.glow, '--sf-hero': c.hero,
        '--sf-grad': `linear-gradient(135deg, ${c.a} 0%, ${c.b} 100%)`,
    };
}

export const shopUrl = (slug) => `/shop/${slug}`;
export const productsUrl = (slug, params = {}) => {
    const q = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false).map(([k, v]) => `${k}=${encodeURIComponent(v === true ? 1 : v)}`).join('&');
    return `/shop/${slug}/products${q ? `?${q}` : ''}`;
};
export const productUrl = (slug, id) => `/shop/${slug}/p/${id}`;
export const cartUrl = (slug) => `/shop/${slug}/cart`;

/** Percent off, rounded, or null. */
export const savePct = (price, was) => (was && Number(was) > Number(price) ? Math.round((1 - Number(price) / Number(was)) * 100) : null);

/** An item that needs a decision before it can be added (variants or add-on groups). */
export const needsChoice = (item) => (item.options?.length || 0) > 1 || (item.addons?.length || 0) > 0;

export function Picture({ item, showImages = true, className = '', eager = false }) {
    const t = tone(item.id);
    return (
        <span className={`sf-pic ${className}`} style={{ background: t.bg, color: t.fg }}>
            {showImages && item.image_url
                ? <img src={item.image_url} alt={item.name} loading={eager ? 'eager' : 'lazy'} decoding="async" />
                : <span className="sf-pic-fallback" aria-hidden="true">{initials(item.name)}</span>}
        </span>
    );
}

export function PriceTag({ item, sym, size = '' }) {
    const from = (item.options?.length || 0) > 1 && item.price_from != null;
    return (
        <span className={`sf-price ${size ? `sf-price--${size}` : ''}`}>
            <span className="sf-price-now">{from && <small>from </small>}<b>{money(item.price_from ?? item.price, sym)}</b></span>
            {item.was_price && <s>{money(item.was_price, sym)}</s>}
        </span>
    );
}

export function Stepper({ value, onChange, max = 50, min = 0, label = '', small = false }) {
    return (
        <span className={`sf-step ${small ? 'sf-step--sm' : ''}`}>
            <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(value - 1)} disabled={value <= min}><Minus size={small ? 12 : 14} strokeWidth={2.5} /></button>
            <span aria-live="polite">{value}</span>
            <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} disabled={value >= max}><Plus size={small ? 12 : 14} strokeWidth={2.5} /></button>
        </span>
    );
}

export function SectionHead({ eyebrow, title, href, linkText = 'View all', children }) {
    return (
        <header className="sf-sechead">
            <div>
                {eyebrow && <span className="sf-eyebrow">{eyebrow}</span>}
                <h2>{title}</h2>
                {children}
            </div>
            {href && <Link href={href} className="sf-seelink">{linkText} <span aria-hidden="true">→</span></Link>}
        </header>
    );
}

export function Crumbs() {
    return null; // breadcrumbs removed on purpose
}

function CrumbsUnused({ trail }) {
    return (
        <nav className="sf-crumbs" aria-label="Breadcrumb">
            {trail.map((t, i) => (i === trail.length - 1
                ? <span key={i} aria-current="page">{t.label}</span>
                : <React.Fragment key={i}><Link href={t.href}>{t.label}</Link><i aria-hidden="true">/</i></React.Fragment>))}
        </nav>
    );
}
