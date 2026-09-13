import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

import {
    DEFAULT_APPEARANCE,
    appearanceFromPage,
    applyAppearance,
    resolveDarkMode,
} from '@/theme/appearance';

/**
 * The single place that decides how VenQore looks, for every page.
 *
 * ── Where the truth lives ───────────────────────────────────────────────────
 *
 * The server does. `appearance` arrives as an Inertia shared prop on every
 * response, resolved from the user's saved preference (falling back to the
 * store's default, then to system defaults). This provider mirrors it into the
 * document and offers an optimistic `update()` so a user dragging a colour
 * picker sees the result immediately instead of once per round trip.
 *
 * That direction matters. An earlier generation of this code kept the theme in
 * localStorage, which meant the same account looked different on the counter
 * terminal and the office laptop, and a support screenshot never matched what
 * the customer was describing. Server-owned preferences survive a new device, a
 * cleared cache and a different browser.
 *
 * ── Relationship to ThemeContext ────────────────────────────────────────────
 *
 * ThemeContext still owns the dark/light toggle for the public marketing pages,
 * where there is no account to store a preference against. Inside the app, this
 * provider is authoritative and writes the `dark` class itself. The two do not
 * fight: ThemeContext only acts when nothing has been explicitly chosen, and an
 * authenticated appearance is by definition an explicit choice.
 */

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
    const { props } = usePage();

    // Only an authenticated store session has an appearance to enforce. On the
    // marketing site, the auth screens and the installer there is no preference,
    // and writing theme attributes onto those pages would restyle screens this
    // work is explicitly not meant to touch.
    const active = Boolean(props.auth?.user && props.store);

    const serverAppearance = useMemo(() => appearanceFromPage(props), [props.appearance]);

    // Local state exists purely so the UI can preview a change before the server
    // has confirmed it. It is re-seeded from the server on every navigation.
    const [appearance, setAppearance] = useState(serverAppearance);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setAppearance(serverAppearance);
    }, [serverAppearance]);

    // Blade has already applied the server's answer to <html> before first
    // paint. This keeps it in step with local previews and with navigations that
    // did not reload the document.
    useEffect(() => {
        if (!active) return;
        applyAppearance(appearance);
    }, [appearance, active]);

    // 'system' mode has to keep following the OS after the page has loaded —
    // someone whose laptop switches to dark at sunset expects VenQore to follow
    // without a refresh.
    useEffect(() => {
        if (!active) return;
        if (appearance.mode !== 'system') return;
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => applyAppearance(appearance);

        query.addEventListener('change', apply);
        return () => query.removeEventListener('change', apply);
    }, [appearance, active]);

    /**
     * Change one or more dials.
     *
     * Applied locally first, then persisted. If the request fails the server's
     * value comes back on the next response and overwrites the preview, so a
     * failed save degrades to "it didn't stick" rather than to a UI that
     * disagrees with the database.
     */
    const update = useCallback((changes, { persist = true, scope = 'store' } = {}) => {
        const next = { ...appearance, ...changes };
        setAppearance(next);
        applyAppearance(next);

        if (!persist) return;

        const storeSlug = props.store?.slug;
        if (!storeSlug) return; // Public page — nothing to persist against.

        setSaving(true);

        router.post(
            route('store.appearance.update', { store_slug: storeSlug }),
            {
                // Only the dials this app still exposes. Font, density and
                // radius were withdrawn and dropped from the controller's
                // validation rules; continuing to send them meant this payload
                // and the server disagreed about the shape of a save.
                theme: next.theme,
                mode: next.mode,
                primary: next.primary,
                accent: next.accent,
                scope,
            },
            {
                preserveScroll: true,
                preserveState: true,
                // The response re-shares `appearance`, which re-seeds this
                // provider from the server. That is the confirmation step: the
                // optimistic value has already painted, and if the save was
                // rejected the server's answer quietly replaces it.
                onFinish: () => setSaving(false),
            },
        );
    }, [appearance, props.store?.slug]);

    const value = useMemo(() => ({
        appearance,
        update,
        saving,
        isDark: resolveDarkMode(appearance.mode),
        experience: appearance.experience || DEFAULT_APPEARANCE.experience,
    }), [appearance, update, saving]);

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
}

/**
 * Read the current appearance.
 *
 * Returns a working default outside the provider rather than throwing, because
 * shared components render on public pages too and a settings screen is not
 * worth crashing a marketing page over.
 */
export function useAppearance() {
    return useContext(AppearanceContext) ?? {
        appearance: DEFAULT_APPEARANCE,
        update: () => {},
        saving: false,
        isDark: resolveDarkMode(DEFAULT_APPEARANCE.mode),
        experience: DEFAULT_APPEARANCE.experience,
    };
}
