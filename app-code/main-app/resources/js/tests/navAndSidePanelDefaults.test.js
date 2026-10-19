import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Navigation and Side Panel Defaults Contract', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Navigation Dock / Sidebar Default (OneGlanceLayout)', () => {
        const resolveNavMode = (serverNav, localStorageGet) => {
            if (serverNav?.mode === 'rail' || serverNav?.mode === 'dock') return serverNav.mode;
            try {
                const local = localStorageGet('vq_nav_mode');
                if (local === 'rail' || local === 'dock') return local;
                return 'rail';
            } catch (e) {
                return 'rail';
            }
        };

        it('defaults to "rail" (side sidebar) for fresh stores and users with no saved preference', () => {
            const mode = resolveNavMode(null, () => null);
            expect(mode).toBe('rail');
        });

        it('respects explicit server preference when set to "dock"', () => {
            const mode = resolveNavMode({ mode: 'dock' }, () => 'rail');
            expect(mode).toBe('dock');
        });

        it('respects explicit server preference when set to "rail"', () => {
            const mode = resolveNavMode({ mode: 'rail' }, () => 'dock');
            expect(mode).toBe('rail');
        });

        it('respects localStorage preference "dock" when user manually changed it', () => {
            const mode = resolveNavMode(null, (k) => (k === 'vq_nav_mode' ? 'dock' : null));
            expect(mode).toBe('dock');
        });

        it('respects localStorage preference "rail" when user manually set it', () => {
            const mode = resolveNavMode(null, (k) => (k === 'vq_nav_mode' ? 'rail' : null));
            expect(mode).toBe('rail');
        });
    });

    describe('2. Dashboard V6 Cockpit Side Panel Defaults (NewDashboard)', () => {
        const resolveRailPrefs = (storeSlug, localStorageGet) => {
            const RAILS_KEY = `vq-dashboard-v6-rails:${storeSlug || 'default'}`;
            const base = { design: 'v6_cockpit', sticky: true, width: 340, collapsed: false };
            try {
                const raw = localStorageGet(RAILS_KEY);
                if (raw !== null) {
                    const v = JSON.parse(raw);
                    if (v && Object.prototype.hasOwnProperty.call(v, 'design')) return { ...base, ...v };
                    const ids = Array.isArray(v) ? v : (v && Array.isArray(v.ids) ? v.ids : null);
                    if (ids && ids.length) {
                        const design = ids.includes('balances') ? 'money'
                            : ids.includes('alerts') ? 'operations'
                            : ids.includes('targets') ? 'growth' : 'minimal';
                        return { ...base, ...(v && !Array.isArray(v) ? v : {}), ids: undefined, design };
                    }
                }
            } catch {}
            return base;
        };

        it('defaults to "v6_cockpit" and collapsed: false for all new stores', () => {
            const prefs = resolveRailPrefs('brand-new-store', () => null);
            expect(prefs.design).toBe('v6_cockpit');
            expect(prefs.collapsed).toBe(false);
            expect(prefs.width).toBe(340);
            expect(prefs.sticky).toBe(true);
        });

        it('respects user choice when user turns off side panel (design: null)', () => {
            const prefs = resolveRailPrefs('my-store', () => JSON.stringify({ design: null, collapsed: false }));
            expect(prefs.design).toBeNull();
            expect(prefs.collapsed).toBe(false);
        });

        it('respects user choice when user selects a different side panel design', () => {
            const prefs = resolveRailPrefs('my-store', () => JSON.stringify({ design: 'operations', collapsed: false }));
            expect(prefs.design).toBe('operations');
        });

        it('respects user choice when user collapses the side panel', () => {
            const prefs = resolveRailPrefs('my-store', () => JSON.stringify({ design: 'v6_cockpit', collapsed: true }));
            expect(prefs.design).toBe('v6_cockpit');
            expect(prefs.collapsed).toBe(true);
        });
    });
});
