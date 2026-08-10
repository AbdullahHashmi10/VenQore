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
const isExceptionPath = (pathname = '') => {
    const prefixes = ['/tools', '/blog', '/docs', '/documentation'];
    return prefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
};

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
    if (!isExceptionPath(pathname)) {
        return true; // Always dark mode for non-excepted public pages
    }

    const saved = readSavedTheme();
    if (saved) return saved === 'dark';

    const tenantDefault = readTenantDefault(settings);
    if (tenantDefault !== null) return tenantDefault;

    return false; // Default to light mode for excepted public pages
};

/**
 * @param {boolean} managed
 *   True when an authenticated appearance preference is in force. In that case
 *   AppearanceContext owns the `dark` class on <html> and this provider must not
 *   write it.
 *
 *   Without this flag the two fight, and the loser is whichever effect runs
 *   first: AppearanceProvider is nested inside this one, so React flushes its
 *   effect first and this provider's would immediately overwrite it. The user
 *   would pick "Light" in Appearance settings and watch the page flick back to
 *   dark. The context still reports `isDarkMode` for the components that read
 *   it — it simply stops being the one applying it.
 */
export const ThemeProvider = ({ children, settings = {}, managed = false }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        return resolveTheme(settings, window.location.pathname);
    });

    // Re-evaluate on Inertia navigation. GlobalProviderLayout (and therefore
    // this provider) stays mounted across SPA page changes, so without this
    // the per-path default would only ever apply to the very first page load.
    useEffect(() => {
        const apply = () => {
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
        if (managed) return;
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode, managed]);

    /** Explicit user action — this is what gets remembered. */
    const persist = useCallback((dark) => {
        try {
            localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
        } catch (e) { /* storage unavailable — session-only theme is fine */ }
    }, []);

    const toggleTheme = useCallback(() => {
        if (!isExceptionPath(window.location.pathname)) return;
        setIsDarkMode((prev) => {
            const next = !prev;
            persist(next);
            return next;
        });
    }, [persist]);

    const setThemeExplicitly = useCallback((dark) => {
        if (!isExceptionPath(window.location.pathname)) return;
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
