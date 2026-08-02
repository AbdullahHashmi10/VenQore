import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

const ThemeContext = createContext();

const STORAGE_KEY = 'amd_theme';

/**
 * Public marketing routes that open in LIGHT mode for a first-time visitor.
 *
 * Rationale: the landing page ('/') hero is art-directed for dark — nebula,
 * light beams, glowing headline — so a brand-new visitor should land in it.
 * Every other public page is long-form reading (features, solutions, docs,
 * tools, pricing, blog, legal), which is cleaner and converts better in
 * light. The authenticated app keeps its existing dark default.
 *
 * This ONLY decides the first impression. The moment a visitor uses the
 * header toggle, that choice is persisted to localStorage and honoured
 * everywhere afterwards — landing page included.
 */
const LIGHT_BY_DEFAULT_PREFIXES = [
    '/features',
    '/solutions',
    '/compare',
    '/pricing',
    '/tools',
    '/blog',
    '/docs',
    '/roadmap',
    '/about',
    '/contact',
    '/partners',
    '/partner-support',
    '/vensynq',
    '/smartcapture',
    '/digital-products',
    '/subscribe',
    '/terms',
    '/privacy',
    '/refund-policy',
];

const isLightByDefaultPath = (pathname = '') =>
    LIGHT_BY_DEFAULT_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

/** Has the visitor ever explicitly picked a theme? */
const readSavedTheme = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        return null; // private mode / storage disabled — fall back to defaults
    }
};

const readTenantDefault = (settings) => {
    const defaultDark = settings?.dark_mode_default;
    if (defaultDark === undefined || defaultDark === null) return null;
    return (
        defaultDark === '1' ||
        defaultDark === 1 ||
        defaultDark === true ||
        defaultDark === 'true' ||
        defaultDark === 'on'
    );
};

/** Resolve the theme for a given path, honouring explicit choice first. */
const resolveTheme = (settings, pathname) => {
    const saved = readSavedTheme();
    if (saved) return saved === 'dark';

    const tenantDefault = readTenantDefault(settings);
    if (tenantDefault !== null) return tenantDefault;

    return !isLightByDefaultPath(pathname);
};

export const ThemeProvider = ({ children, settings = {} }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        return resolveTheme(settings, window.location.pathname);
    });

    // Re-evaluate on Inertia navigation. GlobalProviderLayout (and therefore
    // this provider) stays mounted across SPA page changes, so without this
    // the per-path default would only ever apply to the very first page load.
    useEffect(() => {
        const apply = () => {
            if (readSavedTheme()) return; // explicit choice wins — never override
            setIsDarkMode(resolveTheme(settings, window.location.pathname));
        };
        const stop = router.on('navigate', apply);
        return () => { if (typeof stop === 'function') stop(); };
    }, [settings]);

    // A tenant-level default arriving late still applies, but only if the
    // visitor has not chosen for themselves.
    useEffect(() => {
        const tenantDefault = readTenantDefault(settings);
        if (tenantDefault === null) return;
        if (readSavedTheme()) return;
        setIsDarkMode(tenantDefault);
    }, [settings.dark_mode_default]);

    // Reflect state onto <html>. Note: we deliberately do NOT write to
    // localStorage here — persisting on mere page view would turn the
    // landing page's dark default into a sticky site-wide preference.
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    /** Explicit user action — this is what gets remembered. */
    const persist = useCallback((dark) => {
        try {
            localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
        } catch (e) { /* storage unavailable — session-only theme is fine */ }
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDarkMode((prev) => {
            const next = !prev;
            persist(next);
            return next;
        });
    }, [persist]);

    const setThemeExplicitly = useCallback((dark) => {
        const next = typeof dark === 'function' ? dark(isDarkMode) : dark;
        persist(next);
        setIsDarkMode(next);
    }, [isDarkMode, persist]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode: setThemeExplicitly, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for components rendered outside the provider
        return { isDarkMode: true, setIsDarkMode: () => {}, toggleTheme: () => {} };
    }
    return context;
};
