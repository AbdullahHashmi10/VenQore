// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const get = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { get } }));

import useShift from '@/Sell/core/useShift';

beforeEach(() => {
    get.mockReset();
    globalThis.route = (name) => name;
});

describe('useShift (moved out of Pos.jsx unchanged)', () => {
    it('restricted POS staff load their open shift and its metrics', async () => {
        get.mockResolvedValue({ data: { has_open_shift: true, shift: { id: 9, opening_float: 500 }, metrics: { expected_cash: 800 } } });
        const { result } = renderHook(() => useShift({ storeSlug: 'shop', isPosStaff: true }));
        expect(result.current.isShiftLoading).toBe(true);
        await waitFor(() => expect(result.current.isShiftLoading).toBe(false));
        expect(get).toHaveBeenCalledWith('store.shifts.current');
        expect(result.current.registerShift).toEqual({ id: 9, opening_float: 500 });
        expect(result.current.shiftMetrics).toEqual({ expected_cash: 800 });
    });

    it('no open shift leaves both empty', async () => {
        get.mockResolvedValue({ data: { has_open_shift: false } });
        const { result } = renderHook(() => useShift({ storeSlug: 'shop', isPosStaff: true }));
        await waitFor(() => expect(result.current.isShiftLoading).toBe(false));
        expect(result.current.registerShift).toBeNull();
        expect(result.current.shiftMetrics).toBeNull();
    });

    it('owners and admins never load a shift at all', async () => {
        const { result } = renderHook(() => useShift({ storeSlug: 'shop', isPosStaff: false }));
        await waitFor(() => expect(result.current.isShiftLoading).toBe(false));
        expect(get).not.toHaveBeenCalled();
        expect(result.current.registerShift).toBeNull();
    });

    it('a failed load keeps the screen usable (no shift, loading cleared)', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        get.mockRejectedValue(new Error('offline'));
        const { result } = renderHook(() => useShift({ storeSlug: 'shop', isPosStaff: true }));
        await waitFor(() => expect(result.current.isShiftLoading).toBe(false));
        expect(result.current.registerShift).toBeNull();
        spy.mockRestore();
    });

    it('the dialogs open and close through the same hook', async () => {
        const { result } = renderHook(() => useShift({ storeSlug: 'shop', isPosStaff: false }));
        await waitFor(() => expect(result.current.isShiftLoading).toBe(false));
        act(() => result.current.setShowCloseShiftModal(true));
        expect(result.current.showCloseShiftModal).toBe(true);
    });
});
