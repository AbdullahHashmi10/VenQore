import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';

const ThemeContext = createContext();

const STORAGE_KEY = 'vq_theme';

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
const STORAGE_KEYS = ['vq_theme', 'amd_theme', 'vq-theme'];

const readSavedTheme = () => {
    try {
        for (const key of STORAGE_KEYS) {
            const val = localStorage.getItem(key);
            if (val === 'dark' || val === 'light') return val;
        }
        return null;
    } catch (e) {
        return null; // private mode / storage disabled — fall back to defaults
    }
};

/** Resolve the theme: strictly light by default unless explicitly chosen as dark */
const resolveTheme = (_settings, _pathname) => {
    const saved = readSavedTheme();
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false;
};

export const ThemeProvider = ({ children, settings = {}, managed = false }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return resolveTheme(settings, window.location.pathname);
    });

    /** Explicit user action — this is what gets remembered. */
    const persist = useCallback((dark) => {
        try {
            const val = dark ? 'dark' : 'light';
            localStorage.setItem(STORAGE_KEY, val);
        } catch (e) { /* storage unavailable — session-only theme is fine */ }
    }, []);

    const lastToggleRef = useRef(0);

    const toggleTheme = useCallback(() => {
        const now = Date.now();
        if (now - lastToggleRef.current < 150) return;
        lastToggleRef.current = now;
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

    // Re-evaluate on Inertia navigation
    useEffect(() => {
        const apply = () => {
            setIsDarkMode(resolveTheme(settings, window.location.pathname));
        };
        const stop = router.on('navigate', apply);
        return () => { if (typeof stop === 'function') stop(); };
    }, [settings]);

    // Reflect state onto <html>. Note: we deliberately do NOT write to
    // localStorage here — persisting on mere page view would turn the
    // landing page's dark default into a sticky site-wide preference.
    useEffect(() => {
        if (managed) return;
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: isDarkMode } }));
    }, [isDarkMode, managed]);

    // Global event delegation for any [data-theme-toggle] button rendered anywhere
    useEffect(() => {
        const handleGlobalThemeToggle = (e) => {
            const toggleBtn = e.target.closest('[data-theme-toggle]');
            if (toggleBtn) {
                e.preventDefault();
                toggleTheme();
            }
        };
        document.addEventListener('click', handleGlobalThemeToggle);
        return () => document.removeEventListener('click', handleGlobalThemeToggle);
    }, [toggleTheme]);

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
        return { isDarkMode: false, setIsDarkMode: () => {}, toggleTheme: () => {} };
    }
    return context;
};
