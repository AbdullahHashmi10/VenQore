import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MessageCircle, Menu, X, Sun, Moon, ChevronDown, Clock, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import CookieConsent from '@/Components/CookieConsent';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import { useMarketingShell } from '@/Components/Site/SiteChrome';

/* ═══════════════════════════════════════════════════════════════════════════
   UNIFIED V6 MARKETING LAYOUT
   The single master chrome across all public marketing pages, showcases,
   blog articles, tools, docs, solutions, and legal documents.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Scroll reveal helper ─────────────────────────────────────────────────── */
export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            {
                threshold: options.threshold !== undefined ? options.threshold : 0,
                rootMargin: options.rootMargin || '0px 0px -50px 0px'
            }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, isVisible];
}

export const RevealOnScroll = ({ children, delay = 0, direction = 'up', className = '', as: Tag = 'div' }) => {
    const [ref, isVisible] = useScrollReveal();
    const transforms = {
        up: 'translateY(32px)',
        down: 'translateY(-32px)',
        left: 'translateX(32px)',
        right: 'translateX(-32px)',
        scale: 'scale(0.96)',
        none: 'none',
    };
    return (
        <Tag
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : transforms[direction],
                transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </Tag>
    );
};

/* ── Animated counter ────────────────────────────────────────────────────── */
export const AnimatedCounter = ({ end, suffix = '', prefix = '', duration = 1800 }) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useScrollReveal();
    const hasAnimated = useRef(false);
    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;
        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);
    return <span ref={ref} className="vq-num">{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ── V6 Button / Magnetic Button ─────────────────────────────────────────── */
export const MagneticButton = ({ children, href, className = '', variant = 'primary', ...props }) => {
    const btnRef = useRef(null);
    const handleMouseMove = useCallback((e) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    }, []);
    const handleMouseLeave = useCallback(() => {
        if (btnRef.current) btnRef.current.style.transform = '';
    }, []);

    const variantClass = variant === 'primary' || variant === 'accent'
        ? 'vq-btn vq-btn--primary'
        : variant === 'secondary'
            ? 'vq-btn vq-btn--secondary'
            : variant === 'ghost'
                ? 'vq-btn vq-btn--ghost'
                : 'vq-btn vq-btn--quiet';

    const Tag = href ? Link : 'button';
    return (
        <Tag
            ref={btnRef}
            href={href}
            className={`${variantClass} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}
        </Tag>
    );
};

/* ── V6 Section Eyebrow Label ────────────────────────────────────────────
   The site eyebrow (Space Grotesk caps, accent ink, dot). `icon` is accepted
   for compatibility and intentionally not drawn — the dot is the mark. */
export const SectionLabel = ({ children, text, icon: Icon }) => (
    <span
        className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot"
        style={{ marginBottom: 'var(--vq-space-4)' }}
    >
        {children ?? text}
    </span>
);

/* ── V6 Glass Card ───────────────────────────────────────────────────────── */
export const GlassCard = ({
    children,
    className = '',
    hover = true,
    padding = 'p-6 sm:p-8',
    ...props
}) => (
    <div
        className={`vq-card ${hover ? 'vq-card--interactive' : ''} ${className}`}
        style={{
            borderRadius: 'var(--vq-r-lg)',
            background: 'var(--vq-surface)',
            border: '1px solid var(--vq-line)'
        }}
        {...props}
    >
        {children}
    </div>
);

/* ── V6 Inline Link ──────────────────────────────────────────────────────
   Colour comes from the site link rule (accent-text, both themes); this adds
   the weight and a quiet underline. */
export const InlineLink = ({ href, children, className = '' }) => (
    <Link href={href} className={`vq-mc-inline ${className}`}>
        {children}
    </Link>
);

/* ── V6 Related Pages ──────────────────────────────────────────────────── */
export const RelatedPages = ({
    title = 'Keep exploring',
    items = [],
    className = ''
}) => {
    if (!items || !items.length) return null;
    return (
        <section className={`vq-mc-relatedpages ${className}`}>
            <div className="vq-container">
                <div className="vq-mc-rowhead">
                    <h2 className="vq-h3">{title}</h2>
                </div>
                <div className="vq-grid vq-grid--4">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="vq-card vq-card--interactive vq-mc-lcard"
                        >
                            {item.eyebrow && (
                                <span className="vq-eyebrow vq-eyebrow--accent">{item.eyebrow}</span>
                            )}
                            <span className="vq-mc-lcard__title">{item.label}</span>
                            {item.desc && <span className="vq-mc-lcard__text">{item.desc}</span>}
                            <span className="vq-mc-lcard__cta" style={{ marginTop: 'auto', paddingTop: 'var(--vq-space-3)' }}>
                                Explore <ArrowRight size={14} aria-hidden="true" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SITE MAP TAXONOMY
   ═══════════════════════════════════════════════════════════════════════════ */
export const SITE = {
    build: [
        { label: 'Blueprint', href: '/blueprint', desc: 'Describe it. Approve the plan.' },
        { label: 'See a build', href: '/onboarding', desc: 'Four minutes, start to live.' },
        { label: 'Watch it assemble', href: '/features', desc: '140+ modules in, only yours out.' },
    ],
    run: [
        { label: 'The register', href: '/pos', desc: 'A till you compose yourself.' },
        { label: 'Documents', href: '/documents', desc: 'Thirteen types, one editor.' },
        { label: 'VenSynQ', href: '/vensynq', desc: 'Sell in five places, count once.' },
    ],
    know: [
        { label: 'The dashboard', href: '/dashboard-preview', desc: '58 readings, self-assembling.' },
        { label: 'The Reckoner', href: '/reckoner', desc: 'One place a number is defined.' },
        { label: 'Core Ledger', href: '/ledger', desc: 'One engine. Every number.' },
    ],
    solutions: [
        { label: 'Grocery & supermarket', href: '/solutions/grocery', desc: 'Fast checkout, real margins.' },
        { label: 'Wholesale & distribution', href: '/solutions/wholesale', desc: 'Credit terms and price tiers.' },
        { label: 'Pharmacy', href: '/solutions/pharmacy', desc: 'Batch and expiry that hold the line.' },
        { label: 'Apparel & fashion', href: '/solutions/clothing', desc: 'Size and colour, counted properly.' },
        { label: 'Electronics & hardware', href: '/solutions/electronics-store', desc: 'Serial and IMEI, tracked to the unit.' },
        { label: 'Multi-branch chains', href: '/solutions/multi-store', desc: 'One truth across every location.' },
    ],
    compare: [
        { label: 'VenQore vs Square', href: '/compare/venqore-vs-square' },
        { label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        { label: 'All comparisons', href: '/compare' },
    ],
    resources: [
        { label: 'Free tools', href: '/tools', desc: 'Invoices, barcodes, calculators.' },
        { label: 'Documentation', href: '/docs', desc: 'Guides and technical references.' },
        { label: 'Help centre', href: '/help', desc: 'Step-by-step feature workflows.' },
        { label: 'Security', href: '/security', desc: 'Isolation, roles and the record.' },
        { label: 'Blog', href: '/blog', desc: 'Retail and accounting playbooks.' },
        { label: 'Roadmap', href: '/roadmap', desc: 'What ships next.' },
        { label: 'Live demo', href: '/demo', desc: 'Try it with sample data.' },
    ],
    company: [
        { label: 'About', href: '/about', desc: 'Our mission, architecture, and principles.' },
        { label: 'How we prove it', href: '/ledger', desc: 'The checks we publish.' },
        { label: 'Contact', href: '/contact', desc: 'A person answers this one.' },
        { label: 'Partners', href: '/partners', desc: 'Resell and implement.' },
        { label: 'Newsletter', href: '/subscribe', desc: 'What changed, monthly.' },
    ],
    legal: [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Cookies', href: '/privacy#cookies' },
        { label: 'Refund Policy', href: '/refund-policy' },
        { label: 'Known Issues', href: '/known-issues' },
    ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: MarketingLayout
   The header, footer and cookie banner are the shared site chrome in
   Components/Site — the same components the V6 showcase pages render. This
   layout only adds the <Head> defaults and the reading surface.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MarketingLayout({ children, title, description, activeNav = '', canonical }) {
    useMarketingShell();
    const fullTitle = title
        ? (/venqore/i.test(title) ? title : `${title} | VenQore`)
        : 'VenQore — The AI ERP Builder for POS, Stock & Accounting';
    const canonicalUrl = canonical
        || (typeof window !== 'undefined' ? `https://venqore.com${window.location.pathname}` : 'https://venqore.com');

    return (
        <div
            className="vq-site vq-app-body"
            style={{
                background: 'var(--vq-bg)',
                color: 'var(--vq-text)',
                minHeight: '100vh',
                overflow: 'visible',
                position: 'relative'
            }}
        >
            <Head>
                <title>{fullTitle}</title>
                {description && <meta name="description" content={description} />}
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:title" content={fullTitle} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <SiteHeader />

            <main id="main" className="vq-page vq-mkt-main">
                {children}
            </main>

            <SiteFooter />
            <CookieConsent />
        </div>
    );
}
