import { describe, it, expect } from 'vitest';
import { serverLineToCart, cartLineToServer } from '@/Pos/Table/useTableService';
import { addOnNames, withAddOns } from '@/Utils/addOnLabel';

/**
 * Add-on convention (6 Oct 2026): a cart line's `original_price` is the full
 * undiscounted unit price INCLUDING add-ons, `basePrice` is the item alone, and
 * the table service stores the base and re-adds the deltas itself.
 */
const mods = [{ id: 31, name: 'Extra cheese', price_delta: 100 }, { id: 32, name: 'Olives', price_delta: 50 }];

describe('add-on pricing convention', () => {
    it('a table line comes back to the cart with the add-ons in its full price', () => {
        const line = serverLineToCart({ line_id: 'L1', id: 5, name: 'Pizza', base_price: 1500, price: 1500, qty: 1, mods }, 0);
        expect(line.price).toBe(1650);
        expect(line.original_price).toBe(1650); // so totals and discounts see the add-ons
        expect(line.basePrice).toBe(1500);
    });

    it('sending the line back to the table service sends the BASE price, never the add-on-inclusive one', () => {
        const cart = serverLineToCart({ line_id: 'L1', id: 5, name: 'Pizza', base_price: 1500, price: 1500, qty: 1, mods }, 0);
        const sent = cartLineToServer(cart);
        expect(sent.price).toBe(1500);
        expect(sent.mods.map(m => m.price_delta)).toEqual([100, 50]);
    });

    it('a plain table line is unchanged', () => {
        const line = serverLineToCart({ line_id: 'L2', id: 2, name: 'Naan', price: 40, qty: 2 }, 0);
        expect(line.price).toBe(40);
        expect(line.original_price).toBe(40);
    });

    it('receipts carry the add-on names on the line', () => {
        expect(addOnNames({ modifiers: mods })).toEqual(['Extra cheese', 'Olives']);
        expect(addOnNames({ mods })).toEqual(['Extra cheese', 'Olives']);
        expect(withAddOns('Pizza', { mods })).toBe('Pizza (Extra cheese, Olives)');
        expect(withAddOns('Naan', {})).toBe('Naan');
    });
});
