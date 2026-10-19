// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OFFLINE_LIMIT_DAYS, OFFLINE_LIMIT_MS, offlineKind, writeAllowedOffline } from '@/lib/offlinePolicy';
import { isStation } from '@/lib/station';

describe('offline policy', () => {
    it('is 7 days everywhere', () => {
        expect(OFFLINE_LIMIT_DAYS).toBe(7);
        expect(OFFLINE_LIMIT_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('classifies pages', () => {
        expect(offlineKind('/s/shop/pos')).toBe('pos');
        expect(offlineKind('/s/shop/foh/tables')).toBe('foh');
        expect(offlineKind('/s/shop/foh-online')).toBe('foh');
        expect(offlineKind('/s/shop/reports')).toBe('other');
        expect(offlineKind('/s/shop/positions')).toBe('other');
    });

    it('lets only the till queue and check-ins write while offline', () => {
        expect(writeAllowedOffline('/s/shop/pos/queue-status')).toBe(true);
        expect(writeAllowedOffline('/s/shop/api/heartbeat')).toBe(true);
        expect(writeAllowedOffline('/s/shop/api/sync/orders/batch')).toBe(true);
        expect(writeAllowedOffline('/s/shop/sales')).toBe(false);
        expect(writeAllowedOffline('/s/shop/settings')).toBe(false);
    });
});

describe('Station detection', () => {
    beforeEach(() => { delete window.amdAPI; });
    it('is false in a normal browser', () => { expect(isStation()).toBe(false); });
    it('is true when the Station bridge exists', () => { window.amdAPI = {}; expect(isStation()).toBe(true); });
});

describe('connectivity', () => {
    beforeEach(() => { vi.resetModules(); });

    it('goes offline when the server cannot be reached, and back when a request succeeds', async () => {
        const c = await import('@/lib/connectivity');
        expect(c.isOnline()).toBe(true);
        c.reportRequest({ ok: false });
        expect(c.isOnline()).toBe(false);
        const onlineEvents = vi.fn();
        window.addEventListener('online', onlineEvents);
        c.reportRequest({ ok: true });
        expect(c.isOnline()).toBe(true);
        expect(onlineEvents).toHaveBeenCalled(); // the sale queue listens for this
    });

    it('stays online when the adapter is down but the server answers (local server, no internet)', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        const c = await import('@/lib/connectivity');
        c.startConnectivityMonitor();
        await c.probeNow();
        expect(c.isOnline()).toBe(true);
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        vi.unstubAllGlobals();
    });

    it('goes offline when the server does not answer at all', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        const c = await import('@/lib/connectivity');
        await c.probeNow();
        expect(c.isOnline()).toBe(false);
        vi.unstubAllGlobals();
    });

    it('a slow server is not an outage', async () => {
        const slow = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(slow));
        const c = await import('@/lib/connectivity');
        await c.probeNow();
        expect(c.isOnline()).toBe(true);
        vi.unstubAllGlobals();
    });

    it('ignores failures of other websites', async () => {
        const c = await import('@/lib/connectivity');
        c.reportRequest({ ok: false, sameOrigin: false });
        expect(c.isOnline()).toBe(true);
    });
});
