// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act, fireEvent } from '@testing-library/react';

const post = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { post, get } }));
vi.mock('@inertiajs/react', () => ({ Link: ({ children, ...p }) => <a {...p}>{children}</a>, router: { visit: vi.fn() }, usePage: () => ({ props: {} }) }));

import useFohCheckout from '@/Foh/useFohCheckout';
import { laneBadge, kitchenDone, OverviewTab } from '@/Foh/Tabs';
import CartLines from '@/Foh/CartLines';
import { computeTotals } from '@/Sell/core/cartMath';

beforeEach(() => {
    post.mockReset(); get.mockReset();
    get.mockResolvedValue({ data: { has_open_shift: false } });
    globalThis.route = (name) => name;
});

describe('FOH payment', () => {
    it('posts the sale tagged channel=foh with the order id and type, then settles the order', async () => {
        post.mockResolvedValue({ data: { success: true, sale_id: 77 } });
        const markSettled = vi.fn().mockResolvedValue({});
        const { result } = renderHook(() => useFohCheckout({ storeSlug: 's', settings: {}, warehouses: [{ id: 3, is_default: true }], isPosStaff: false, tables: { markSettled } }));
        const cart = [{ cartItemId: 'a', id: 1, name: 'Karahi', price: 1000, original_price: 1000, qty: 2, discount: 0, freeQuantity: 0 }];
        const sale = { cart, discountType: 'fixed', discountValue: 0 };
        const totals = computeTotals({ cart, sale, settings: {}, enableTax: false, enableFreeQty: false, tableMode: true, serviceChargePct: 0, tipEnabled: true, roundOff: false });
        await act(async () => {
            await result.current.complete({ payments: [{ method: 'cash', amount: 2000 }], totalPaid: 2000, change: 0 },
                { card: { occupancy_id: 5, order_type: 'takeaway' }, sale, totals, partId: null });
        });
        const [, body, cfg] = post.mock.calls[0];
        expect(body.channel).toBe('foh');
        expect(body.occupancy_id).toBe(5);
        expect(body.order_type).toBe('takeaway');
        expect(cfg.headers['Idempotency-Key']).toBeTruthy();
        expect(markSettled).toHaveBeenCalledWith(5, 77, null);
    });

    it('an unreachable server is reported, never silently queued', async () => {
        post.mockRejectedValue(new Error('offline'));
        const onToast = vi.fn();
        const { result } = renderHook(() => useFohCheckout({ storeSlug: 's', settings: {}, isPosStaff: false, tables: { markSettled: vi.fn() }, onToast }));
        let out;
        await act(async () => { out = await result.current.complete({ payments: [], totalPaid: 0, change: 0 }, { card: { occupancy_id: 1 }, sale: { cart: [] }, totals: { cartTotal: 0 }, partId: null }); });
        expect(out).toBe(false);
        // Sale-reliability plan: a lost answer is "unconfirmed", never "NOT recorded"
        // (the request may have reached the books); still never queued offline.
        expect(onToast).toHaveBeenCalledWith(expect.stringContaining('unconfirmed'), 'error');
    });
});

describe('FOH takeaway status', () => {
    it('paid and still cooking vs ready to collect', () => {
        const cooking = { paid_at: 'x', kitchen_progress: { fired: 2, ready: 1, served: 0 } };
        const ready = { paid_at: 'x', kitchen_progress: { fired: 2, ready: 1, served: 1 } };
        expect(kitchenDone(cooking)).toBe(false);
        expect(laneBadge(cooking).text).toBe('Paid · cooking');
        expect(laneBadge(ready).text).toBe('Ready to collect');
        expect(laneBadge({ lines: 0 }).text).toBe('Empty');
    });
});

describe('FOH views', () => {
    it('lists add-ons under the dish and locks a paid line', () => {
        const cart = [
            { cartItemId: 'p', name: 'Pizza', qty: 1, original_price: 1500, mods: [{ id: 1, name: 'Extra cheese', price_delta: 100 }] },
            { cartItemId: 'q', name: 'Cola', qty: 1, original_price: 100, paidSaleId: 9 },
        ];
        render(<CartLines cart={cart} money={(n) => `Rs ${n}`} canVoid onQty={() => {}} onRemove={() => {}} onPatch={() => {}} />);
        expect(screen.getByText(/Extra cheese/)).toBeTruthy();
        expect(screen.getByText('Paid')).toBeTruthy();
        expect(screen.queryByLabelText('Remove Cola')).toBeNull();
        expect(screen.getByText('Rs 1500')).toBeTruthy();
    });

    it('overview tells you what needs a person', () => {
        const goto = vi.fn();
        const tables = {
            positions: [], counts: { open: 1 },
            tickets: [{ id: 't1', code: 'TA-1', kind: 'ticket', order_type: 'takeaway', state: 'served', order_total: 0, paid_at: 'x', kitchen_progress: { fired: 1, ready: 1, served: 0 } }],
        };
        render(<OverviewTab tables={tables} money={(n) => String(n)} goto={goto} />);
        fireEvent.click(screen.getByText('TA-1').closest('button'));
        expect(goto).toHaveBeenCalled();
        expect(screen.getByText('Ready to collect')).toBeTruthy();
    });
});

describe('FOH settings that change behaviour', () => {
    it('late flag honours the grace minutes', async () => {
        const { isLate } = await import('@/Pos/Table/Delivery');
        const d = { status: 'out', eta_minutes: 30, status_at: new Date(Date.now() - 35 * 60000).toISOString() };
        expect(isLate(d)).toBe(true);
        expect(isLate(d, 10)).toBe(false);
    });

    it('new takeaway cannot continue without a name when the store requires one', async () => {
        const { NewTicketDialog } = await import('@/Pos/Table/TableBar');
        const onConfirm = vi.fn();
        render(<NewTicketDialog orderType="takeaway" nameRequired onCancel={() => {}} onConfirm={onConfirm} storeSlug="s" />);
        const create = screen.getAllByRole('button').find((b) => /open|create|start|ticket/i.test(b.textContent) && !/cancel/i.test(b.textContent));
        fireEvent.click(create);
        expect(onConfirm).not.toHaveBeenCalled();
        fireEvent.change(screen.getByPlaceholderText('Name (required)'), { target: { value: 'Sara' } });
        fireEvent.click(create);
        expect(onConfirm).toHaveBeenCalled();
    });
});
