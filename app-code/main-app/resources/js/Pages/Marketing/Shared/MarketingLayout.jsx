import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MessageCircle, Menu, X, Sun, Moon, ChevronDown, Clock, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

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

/* ── V6 Section Eyebrow Label ────────────────────────────────────────────── */
export const SectionLabel = ({ children, text, icon: Icon }) => (
    <span
        className="vq-eyebrow vq-eyebrow--accent"
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
        }}
    >
        <span
            style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--vq-accent)',
                boxShadow: '0 0 8px var(--vq-accent)'
            }}
        />
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

/* ── V6 Inline Link ──────────────────────────────────────────────────────── */
export const InlineLink = ({ href, children, className = '' }) => (
    <Link
        href={href}
        className={`font-semibold text-brand-600 dark:text-brand-300 underline decoration-brand-500/30 underline-offset-4 hover:decoration-brand-500 transition-colors ${className}`}
    >
        {children}
    </Link>
);

/* ── V6 Related Pages ────────────────────────────────────────────────────── */
export const RelatedPages = ({
    title = 'Keep exploring',
    items = [],
    className = ''
}) => {
    if (!items || !items.length) return null;
    return (
        <section className={`px-6 pb-24 relative z-10 ${className}`}>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                        {title}
                    </h2>
                    <div
                        className="hidden sm:block flex-1 h-px"
                        style={{ background: 'var(--vq-line)' }}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group vq-card vq-card--interactive p-6 transition-all duration-slow flex flex-col justify-between"
                            style={{
                                borderRadius: 'var(--vq-r-lg)',
                                background: 'var(--vq-surface)',
                                border: '1px solid var(--vq-line)'
                            }}
                        >
                            <div>
                                {item.eyebrow && (
                                    <span
                                        className="block text-3xs font-bold uppercase tracking-[0.25em] mb-3"
                                        style={{ color: 'var(--vq-accent)' }}
                                    >
                                        {item.eyebrow}
                                    </span>
                                )}
                                <span className="block text-base font-bold text-ink mb-2 leading-snug group-hover:text-brand-500 transition-colors">
                                    {item.label}
                                </span>
                                {item.desc && (
                                    <span
                                        className="block text-sm leading-relaxed mb-4"
                                        style={{ color: 'var(--vq-text-muted)' }}
                                    >
                                        {item.desc}
                                    </span>
                                )}
                            </div>
                            <span
                                className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider group-hover:gap-2.5 transition-all mt-2"
                                style={{ color: 'var(--vq-accent)' }}
                            >
                                Explore <ArrowRight size={12} />
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
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MarketingLayout({ children, title, description, activeNav = '' }) {
    const { props } = usePage();
    const settings = props.global_settings || {};
    const appName = settings.company_name || 'VenQore';
    const { isDarkMode, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Track scroll for sticky header and scroll progress bar
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 30);
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            if (docH > 0) {
                setScrollProgress(Math.min(100, Math.max(0, (y / docH) * 100)));
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Set marketing shell attribute so fixed viewports scroll smoothly
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute('data-vq-shell', 'marketing');
        html.setAttribute('data-vq-theme', 'venqore-v6');
        return () => {
            html.removeAttribute('data-vq-shell');
        };
    }, []);

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
                <title>{title ? `${title} | VenQore` : 'VenQore — The AI ERP Builder for POS, Stock & Accounting'}</title>
                {description && <meta name="description" content={description} />}
                <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : 'https://venqore.com'} />
                <meta property="og:title" content={title || 'VenQore — The AI ERP Builder for POS, Stock & Accounting'} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/*  Ambient background glow mesh  */}
            <div
                className="vq-amb"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            {/*  Top scroll progress bar  */}
            <div
                data-prog="1"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '3px',
                    width: `${scrollProgress}%`,
                    background: 'linear-gradient(90deg, #0BAA8F, #59DBC0)',
                    zIndex: 500,
                    boxShadow: '0 0 18px rgba(35, 196, 166, 0.6)',
                    transition: 'width 0.1s linear'
                }}
            />

            {/*  Skip to main content for accessibility  */}
            <a className="vq-skip" href="#main">
                Skip to content
            </a>

            {/*  ══════════════════════════════════════════════════════════════
                 AUTHENTIC V6 MASTER HEADER
                 ══════════════════════════════════════════════════════════════  */}
            <header
                className={`vq-header vq-header--onHero ${scrolled ? 'is-stuck' : ''}`}
                data-header
                style={{ zIndex: 300 }}
            >
                <div className="vq-header__inner">
                    <Link className="vq-brand" href="/" aria-label="VenQore home">
                        <img src="/v6/assets/logo.png" alt="VenQore" width="30" height="30" />
                        <span className="vq-brand__word">{appName}</span>
                    </Link>

                    <nav className="vq-nav" aria-label="Main">
                        <ul className="vq-nav__list">
                            {/* Product Mega Menu */}
                            <li className="vq-nav__item">
                                <Link href="/blueprint" className="vq-nav__link">
                                    Product
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </Link>
                                <div className="vq-mega" style={{ minWidth: '660px' }}>
                                    <div className="vq-mega__grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div className="vq-mega__col">
                                            <span className="vq-eyebrow vq-eyebrow--accent">Build</span>
                                            {SITE.build.map(item => (
                                                <Link key={item.href} className="vq-mega__link" href={item.href}>
                                                    <b>{item.label}</b>
                                                    <span>{item.desc}</span>
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="vq-mega__col">
                                            <span className="vq-eyebrow vq-eyebrow--accent">Run</span>
                                            {SITE.run.map(item => (
                                                <Link key={item.href} className="vq-mega__link" href={item.href}>
                                                    <b>{item.label}</b>
                                                    <span>{item.desc}</span>
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="vq-mega__col">
                                            <span className="vq-eyebrow vq-eyebrow--accent">Know</span>
                                            {SITE.know.map(item => (
                                                <Link key={item.href} className="vq-mega__link" href={item.href}>
                                                    <b>{item.label}</b>
                                                    <span>{item.desc}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="vq-mega__foot">
                                        <Link className="vq-link" href="/smartcapture">
                                            SmartCapture — a photo in, a posted transaction out
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </li>

                            {/* Solutions Mega Menu */}
                            <li className="vq-nav__item">
                                <Link href="/solutions" className="vq-nav__link">
                                    Solutions
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </Link>
                                <div className="vq-mega" style={{ minWidth: '440px' }}>
                                    <div className="vq-mega__grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="vq-mega__col">
                                            {SITE.solutions.slice(0, 3).map(item => (
                                                <Link key={item.href} className="vq-mega__link" href={item.href}>
                                                    <b>{item.label}</b>
                                                    <span>{item.desc}</span>
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="vq-mega__col">
                                            {SITE.solutions.slice(3, 6).map(item => (
                                                <Link key={item.href} className="vq-mega__link" href={item.href}>
                                                    <b>{item.label}</b>
                                                    <span>{item.desc}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="vq-mega__foot">
                                        <Link className="vq-link" href="/solutions">
                                            View all industry solutions
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </li>

                            {/* Features */}
                            <li className="vq-nav__item">
                                <Link href="/features" className="vq-nav__link">Features</Link>
                            </li>

                            {/* Pricing */}
                            <li className="vq-nav__item">
                                <Link href="/pricing" className="vq-nav__link">Pricing</Link>
                            </li>

                            {/* Resources Mega Menu */}
                            <li className="vq-nav__item">
                                <Link href="/docs" className="vq-nav__link">
                                    Resources
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </Link>
                                <div className="vq-mega" style={{ minWidth: '420px' }}>
                                    <div className="vq-mega__grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="vq-mega__col">
                                            <span className="vq-eyebrow vq-eyebrow--accent">Guides</span>
                                            <Link className="vq-mega__link" href="/tools">
                                                <b>Free tools</b>
                                                <span>Invoices, barcodes, math.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/docs">
                                                <b>Documentation</b>
                                                <span>Guides and technical references.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/help">
                                                <b>Help centre</b>
                                                <span>Step-by-step feature workflows.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/security">
                                                <b>Security</b>
                                                <span>Isolation and data integrity.</span>
                                            </Link>
                                        </div>
                                        <div className="vq-mega__col">
                                            <span className="vq-eyebrow vq-eyebrow--accent">Intelligence</span>
                                            <Link className="vq-mega__link" href="/blog">
                                                <b>Blog</b>
                                                <span>Retail & accounting playbooks.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/roadmap">
                                                <b>Roadmap</b>
                                                <span>What ships next.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/compare">
                                                <b>Comparisons</b>
                                                <span>VenQore vs legacy POS.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/demo">
                                                <b>Live demo</b>
                                                <span>Explore pre-loaded system.</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            {/* Company Mega Menu */}
                            <li className="vq-nav__item">
                                <Link href="/about" className="vq-nav__link">
                                    Company
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </Link>
                                <div className="vq-mega" style={{ minWidth: '320px' }}>
                                    <div className="vq-mega__grid" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="vq-mega__col">
                                            <Link className="vq-mega__link" href="/about">
                                                <b>About</b>
                                                <span>Our mission, architecture, and principles.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/ledger">
                                                <b>How we prove it</b>
                                                <span>The 35,255 correctness checks.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/contact">
                                                <b>Contact</b>
                                                <span>A person answers this one.</span>
                                            </Link>
                                            <Link className="vq-mega__link" href="/partners">
                                                <b>Partners</b>
                                                <span>Resell and implement.</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </nav>

                    <div className="vq-header__actions">
                        <button
                            className="vq-theme-btn"
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Switch theme"
                        >
                            <span className="vq-icon-sun">
                                <Sun size={17} />
                            </span>
                            <span className="vq-icon-moon">
                                <Moon size={17} />
                            </span>
                        </button>
                        <Link href="/login" className="vq-nav__link">Sign in</Link>
                        <Link href="/build-workspace" className="vq-btn vq-btn--primary">
                            Start building
                            <span className="vq-btn__arrow">
                                <ArrowRight size={14} />
                            </span>
                        </Link>
                    </div>

                    <button
                        className="vq-burger"
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/*  Mobile Menu Drawer  */}
            <div className="vq-mobile" data-menu hidden={!mobileOpen}>
                <button
                    className="vq-burger"
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    style={{ position: 'absolute', top: '24px', right: '20px' }}
                >
                    <X size={24} />
                </button>
                <Link href="/blueprint" onClick={() => setMobileOpen(false)}>Blueprint</Link>
                <Link href="/pos" onClick={() => setMobileOpen(false)}>The register</Link>
                <Link href="/documents" onClick={() => setMobileOpen(false)}>Documents</Link>
                <Link href="/dashboard-preview" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/smartcapture" onClick={() => setMobileOpen(false)}>SmartCapture</Link>
                <Link href="/reckoner" onClick={() => setMobileOpen(false)}>The Reckoner</Link>
                <Link href="/ledger" onClick={() => setMobileOpen(false)}>Core Ledger</Link>
                <Link href="/vensynq" onClick={() => setMobileOpen(false)}>VenSynQ</Link>
                <Link href="/solutions" onClick={() => setMobileOpen(false)}>Solutions</Link>
                <Link href="/features" onClick={() => setMobileOpen(false)}>Features</Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
                <Link href="/tools" onClick={() => setMobileOpen(false)}>Free tools</Link>
                <Link href="/docs" onClick={() => setMobileOpen(false)}>Documentation</Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)}>Blog</Link>
                <Link href="/about" onClick={() => setMobileOpen(false)}>About</Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                <Link
                    href="/build-workspace"
                    className="vq-btn vq-btn--primary"
                    style={{ marginTop: '16px' }}
                    onClick={() => setMobileOpen(false)}
                >
                    Start building
                </Link>
            </div>

            {/*  ══════════════════════════════════════════════════════════════
                 MAIN CONTENT BODY
                 ══════════════════════════════════════════════════════════════  */}
            <main id="main" className="vq-page" style={{ position: 'relative', zIndex: 10, minHeight: '80vh' }}>
                {children}
            </main>

            {/*  ══════════════════════════════════════════════════════════════
                 AUTHENTIC V6 MASTER FOOTER
                 ══════════════════════════════════════════════════════════════  */}
            <footer id="start" data-sec="start" className="vq-footer" style={{ position: 'relative', zIndex: 10 }}>
                <div className="footer-bg" />

                <div
                    className="vq-container"
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        paddingBottom: 'var(--vq-space-16)'
                    }}
                >
                    <div
                        className="mesh-gradient-card"
                        style={{
                            borderRadius: 'var(--vq-r-2xl)',
                            padding: 'clamp(32px,5vw,56px)',
                            border: '1px solid rgb(255 255 255 / .10)',
                            boxShadow: 'var(--vq-elev-3)'
                        }}
                    >
                        <div style={{ maxWidth: '36rem' }}>
                            <h2 className="vq-h2" style={{ color: '#fff' }}>
                                Describe your business. See what it becomes.
                            </h2>
                            <p className="vq-lede vq-mt-3" style={{ color: 'rgb(255 255 255 / .74)' }}>
                                14-day free trial. Full access. You'll see your whole system before you decide anything.
                            </p>
                            <form
                                className="vq-row vq-wrap vq-gap-3 vq-mt-8"
                                data-waitlist
                                style={{ maxWidth: '520px' }}
                            >
                                <input
                                    type="email"
                                    className="vq-input"
                                    required
                                    placeholder="you@company.com"
                                    aria-label="Work email"
                                    style={{
                                        flex: '1 1 240px',
                                        background: 'rgb(0 0 0 / .35)',
                                        borderColor: 'rgb(255 255 255 / .16)',
                                        color: '#fff'
                                    }}
                                />
                                <button type="submit" className="vq-btn vq-btn--lg vq-btn--light">
                                    Start building
                                </button>
                            </form>
                            <p className="vq-caption vq-mt-4" style={{ color: 'rgb(255 255 255 / .55)' }}>
                                Takes about four minutes. Nothing goes live until you approve it.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="vq-container"
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        paddingBottom: 'var(--vq-space-8)'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--vq-space-12)'
                        }}
                        className="vq-foot-cols"
                    >
                        <div
                            style={{
                                display: 'grid',
                                gap: 'var(--vq-space-8)',
                                gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
                                flex: '1'
                            }}
                        >
                            <div>
                                <h3 className="vq-footer__head">Product</h3>
                                <ul
                                    style={{
                                        marginTop: 'var(--vq-space-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--vq-space-3)'
                                    }}
                                >
                                    <li><Link href="/blueprint">Blueprint</Link></li>
                                    <li><Link href="/pos">The register</Link></li>
                                    <li><Link href="/documents">Documents</Link></li>
                                    <li><Link href="/dashboard-preview">Dashboard</Link></li>
                                    <li><Link href="/smartcapture">SmartCapture</Link></li>
                                    <li><Link href="/reckoner">The Reckoner</Link></li>
                                    <li><Link href="/ledger">Core Ledger</Link></li>
                                    <li><Link href="/vensynq">VenSynQ</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="vq-footer__head">Solutions</h3>
                                <ul
                                    style={{
                                        marginTop: 'var(--vq-space-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--vq-space-3)'
                                    }}
                                >
                                    <li><Link href="/solutions/grocery">Grocery & Supermarket</Link></li>
                                    <li><Link href="/solutions/wholesale">Wholesale & Distribution</Link></li>
                                    <li><Link href="/solutions/pharmacy">Pharmacy</Link></li>
                                    <li><Link href="/solutions/clothing">Apparel & Fashion</Link></li>
                                    <li><Link href="/solutions/electronics-store">Electronics & Hardware</Link></li>
                                    <li><Link href="/solutions/multi-store">Multi-branch Retail</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="vq-footer__head">Company</h3>
                                <ul
                                    style={{
                                        marginTop: 'var(--vq-space-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--vq-space-3)'
                                    }}
                                >
                                    <li><Link href="/about">About</Link></li>
                                    <li><Link href="/contact">Contact</Link></li>
                                    <li><Link href="/blog">Blog</Link></li>
                                    <li><Link href="/roadmap">Roadmap</Link></li>
                                    <li><Link href="/partners">Partners</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="vq-footer__head">Resources</h3>
                                <ul
                                    style={{
                                        marginTop: 'var(--vq-space-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--vq-space-3)'
                                    }}
                                >
                                    <li><Link href="/tools">Free Tools</Link></li>
                                    <li><Link href="/docs">Documentation</Link></li>
                                    <li><Link href="/help">Help centre</Link></li>
                                    <li><Link href="/security">Security</Link></li>
                                    <li><Link href="/onboarding">See a build</Link></li>
                                    <li><Link href="/login">Sign in</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="vq-footer__head">Social</h3>
                                <div
                                    style={{
                                        marginTop: 'var(--vq-space-4)',
                                        display: 'flex',
                                        gap: 'var(--vq-space-3)'
                                    }}
                                >
                                    <a
                                        className="vq-footer__social"
                                        href="https://wa.me/923091999489"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="WhatsApp"
                                        title="WhatsApp: +92 309 1999489"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: 'var(--vq-space-12)',
                            paddingTop: 'var(--vq-space-8)',
                            borderTop: '1px solid rgb(255 255 255 / .08)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'var(--vq-space-4)',
                            paddingBottom: 'var(--vq-space-6)'
                        }}
                    >
                        <p
                            className="vq-small"
                            style={{
                                color: 'var(--vq-ink-500)',
                                maxWidth: 'none'
                            }}
                        >
                            © {new Date().getFullYear()} {appName}, Inc. The AI ERP builder for ERP &amp; POS.
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--vq-space-6)',
                                flexWrap: 'wrap'
                            }}
                        >
                            <Link className="vq-small" href="/terms">Terms</Link>
                            <Link className="vq-small" href="/privacy">Privacy</Link>
                            <Link className="vq-small" href="/privacy#cookies">Cookies</Link>
                            <Link className="vq-small" href="/refund-policy">Refund Policy</Link>
                            <Link className="vq-small" href="/known-issues">Known Issues</Link>
                        </div>
                    </div>

                    <div className="watermark-wrapper">
                        <span>{appName}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
