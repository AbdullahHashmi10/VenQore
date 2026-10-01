/**
 * SiteHeader — the one public header. Every marketing page, tool, blog post,
 * help article, legal page and the AI builder render this component; none of
 * them carry their own copy of the markup any more.
 *
 * Look: a transparent bar with a progressive backdrop blur underneath it (the
 * content behind is defocused, strongest at the top edge and fading out below
 * the bar), and ink that follows the page — `useHeaderTone` samples what is
 * behind the bar on every scroll frame and flips every letter, icon and
 * button between light and dark so it stays readable over the dark hero,
 * light reading bands, dark feature bands and the footer alike.
 *
 * Links are plain <a> rather than Inertia <Link>: the fifteen V6 showcase
 * pages boot legacy visual engines (venqore.js, fluid.js) on mount, and a
 * full navigation is what keeps those from double-binding.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ArrowRight, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import useHeaderTone from './useHeaderTone';
import { BUSINESS_TYPE_CLAIM } from './sectorCatalog';
import {
    HEADER_NAV, NAV_PRODUCT, NAV_PRODUCT_FOOT, SOLUTIONS, COMPARE, RESOURCES, COMPANY,
    PRIMARY_CTA, isCurrent, activeTopKey,
} from './siteMap';

function MegaLink({ link, path }) {
    const current = isCurrent(link.href, path);
    return (
        <a className="vq-btn-plain vq-sh-mega__link" href={link.href} aria-current={current ? 'page' : undefined}>
            <b>{link.label}</b>
            {link.desc && <span>{link.desc}</span>}
        </a>
    );
}

function MegaPanel({ menu, path }) {
    if (menu === 'product') {
        return (
            <div className="vq-sh-mega__inner vq-sh-mega__inner--3">
                <div className="vq-sh-mega__grid vq-sh-mega__grid--3">
                    {NAV_PRODUCT.map((group) => (
                        <div key={group.heading} className="vq-sh-mega__col">
                            <span className="vq-sh-mega__eyebrow">{group.heading}</span>
                            {group.links.map((l) => <MegaLink key={l.href} link={l} path={path} />)}
                        </div>
                    ))}
                </div>
                <div className="vq-sh-mega__foot">
                    <a className="vq-btn-plain vq-sh-mega__more" href={NAV_PRODUCT_FOOT.href}>
                        {NAV_PRODUCT_FOOT.label} <ArrowRight size={15} aria-hidden="true" />
                    </a>
                </div>
            </div>
        );
    }
    if (menu === 'solutions') {
        return (
            <div className="vq-sh-mega__inner vq-sh-mega__inner--2">
                <div className="vq-sh-mega__grid vq-sh-mega__grid--2">
                    {SOLUTIONS.map((l) => <MegaLink key={l.href} link={l} path={path} />)}
                </div>
                <div className="vq-sh-mega__foot vq-sh-mega__foot--split">
                    <a className="vq-btn-plain vq-sh-mega__more" href="/solutions#business-types">
                        All {BUSINESS_TYPE_CLAIM} business types <ArrowRight size={15} aria-hidden="true" />
                    </a>
                    <span className="vq-sh-mega__quiet">
                        {COMPARE.slice(0, 2).map((c, i) => (
                            <React.Fragment key={c.href}>
                                {i > 0 && <span aria-hidden="true"> · </span>}
                                <a className="vq-btn-plain" href={c.href}>{c.label}</a>
                            </React.Fragment>
                        ))}
                    </span>
                </div>
            </div>
        );
    }
    const list = menu === 'resources' ? RESOURCES : COMPANY;
    return (
        <div className="vq-sh-mega__inner vq-sh-mega__inner--2">
            <div className="vq-sh-mega__grid vq-sh-mega__grid--2">
                {list.map((l) => <MegaLink key={l.href} link={l} path={path} />)}
            </div>
        </div>
    );
}

function ThemeButton({ className = '' }) {
    const { isDarkMode, toggleTheme } = useTheme();
    return (
        <button
            type="button"
            className={`vq-sh-icon ${className}`}
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
            {isDarkMode ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
    );
}

export default function SiteHeader() {
    const page = usePage();
    const path = (page?.url || (typeof window !== 'undefined' ? window.location.pathname : '/')).split('?')[0];
    const user = page?.props?.auth?.user || null;

    const headerRef = useRef(null);
    const tone = useHeaderTone(headerRef);
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(null);
    const [mobile, setMobile] = useState(false);
    const [mobileGroup, setMobileGroup] = useState(null);
    const closeTimer = useRef(0);
    const baseId = useId();
    const activeKey = activeTopKey(path);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const openMenu = useCallback((key) => {
        window.clearTimeout(closeTimer.current);
        setOpen(key);
    }, []);
    const closeSoon = useCallback(() => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(null), 140);
    }, []);

    // Escape closes whichever menu is open; a click outside closes the mega panel.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            setOpen(null);
            setMobile(false);
        };
        const onDown = (e) => {
            if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(null);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, []);

    // Lock the page behind the mobile sheet, and give it back exactly as found.
    useEffect(() => {
        if (!mobile) return undefined;
        const prev = document.body.style.overflow;
        const prevHtml = document.documentElement.style.overflowY;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
        return () => {
            document.body.style.overflow = prev;
            document.documentElement.style.overflowY = prevHtml;
        };
    }, [mobile]);

    const toneAttr = tone || 'auto';
    const accountLink = user
        ? { label: 'Dashboard', href: '/dashboard' }
        : { label: 'Sign in', href: '/login' };

    return (
        <>
            <a className="vq-skip" href="#main">Skip to content</a>
            <header
                ref={headerRef}
                className={`vq-sh${scrolled ? ' is-scrolled' : ''}${open ? ' has-open' : ''}`}
                data-tone={toneAttr}
                data-site-header=""
            >
                <div className="vq-sh__glass" aria-hidden="true" />
                <div className="vq-sh__inner">
                    <a className="vq-btn-plain vq-sh__brand" href="/" aria-label="VenQore home">
                        <img src="/v6/assets/logo.png" alt="" width="30" height="30" />
                        <span>VenQore</span>
                    </a>

                    <nav className="vq-sh__nav" aria-label="Main">
                        <ul className="vq-sh__list">
                            {HEADER_NAV.map((item) => {
                                const panelId = `${baseId}-${item.key}`;
                                const isActive = activeKey === item.key;
                                if (!item.menu) {
                                    return (
                                        <li key={item.key} className="vq-sh__item">
                                            <a
                                                className="vq-btn-plain vq-sh__link"
                                                href={item.href}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    );
                                }
                                const isOpen = open === item.key;
                                return (
                                    <li
                                        key={item.key}
                                        className={`vq-sh__item${isOpen ? ' is-open' : ''}`}
                                        onMouseEnter={() => openMenu(item.key)}
                                        onMouseLeave={closeSoon}
                                        onBlur={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget)) closeSoon();
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="vq-sh__link"
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            data-active={isActive ? 'true' : undefined}
                                            onClick={() => (isOpen ? setOpen(null) : openMenu(item.key))}
                                        >
                                            {item.label}
                                            <ChevronDown size={13} aria-hidden="true" className="vq-sh__chev" />
                                        </button>
                                        <div id={panelId} className="vq-sh-mega" role="region" aria-label={item.label} aria-hidden={!isOpen}>
                                            <MegaPanel menu={item.menu} path={path} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="vq-sh__actions">
                        <ThemeButton />
                        <a className="vq-btn-plain vq-sh__link vq-sh__signin" href={accountLink.href}>{accountLink.label}</a>
                        <a className="vq-btn vq-btn--primary vq-sh__cta" href={PRIMARY_CTA.href}>
                            {PRIMARY_CTA.label}
                            <span className="vq-btn__arrow"><ArrowRight size={15} aria-hidden="true" /></span>
                        </a>
                    </div>

                    <div className="vq-sh__mobile-actions">
                        <ThemeButton />
                        <button
                            type="button"
                            className="vq-sh-icon"
                            aria-label="Open menu"
                            aria-expanded={mobile}
                            aria-controls={`${baseId}-sheet`}
                            onClick={() => setMobile(true)}
                        >
                            <Menu size={22} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            <div
                id={`${baseId}-sheet`}
                className={`vq-sh-sheet${mobile ? ' is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                aria-hidden={!mobile}
                data-tone-ignore=""
            >
                <div className="vq-sh-sheet__top">
                    <a className="vq-btn-plain vq-sh__brand" href="/" aria-label="VenQore home">
                        <img src="/v6/assets/logo.png" alt="" width="28" height="28" />
                        <span>VenQore</span>
                    </a>
                    <button type="button" className="vq-sh-icon" aria-label="Close menu" onClick={() => setMobile(false)}>
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>
                <div className="vq-sh-sheet__body">
                    {[
                        { key: 'product', label: 'Product', links: [...NAV_PRODUCT.flatMap((g) => g.links), NAV_PRODUCT_FOOT] },
                        { key: 'solutions', label: 'Solutions', links: [...SOLUTIONS, ...COMPARE] },
                        { key: 'resources', label: 'Resources', links: RESOURCES },
                        { key: 'company', label: 'Company', links: COMPANY },
                    ].map((group) => {
                        const expanded = mobileGroup === group.key;
                        return (
                            <div key={group.key} className={`vq-sh-sheet__group${expanded ? ' is-open' : ''}`}>
                                <button
                                    type="button"
                                    className="vq-sh-sheet__head"
                                    aria-expanded={expanded}
                                    onClick={() => setMobileGroup(expanded ? null : group.key)}
                                >
                                    {group.label}
                                    <ChevronDown size={18} aria-hidden="true" />
                                </button>
                                {expanded && (
                                    <div className="vq-sh-sheet__links">
                                        {group.links.map((l) => (
                                            <a className="vq-btn-plain" key={l.href} href={l.href} aria-current={isCurrent(l.href, path) ? 'page' : undefined}>
                                                {l.label.replace(/ — .*/, '')}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <a className="vq-btn-plain vq-sh-sheet__plain" href="/features">Features</a>
                    <a className="vq-btn-plain vq-sh-sheet__plain" href="/pricing">Pricing</a>
                </div>
                <div className="vq-sh-sheet__actions">
                    <a href={accountLink.href} className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">{accountLink.label}</a>
                    <a href={PRIMARY_CTA.href} className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">
                        {PRIMARY_CTA.label}
                        <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>
                    </a>
                </div>
            </div>
        </>
    );
}
