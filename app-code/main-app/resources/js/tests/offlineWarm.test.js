import { describe, it, expect } from 'vitest';
import { selectWarmPaths } from '@/lib/offlineCache';

describe('selectWarmPaths', () => {
    const o = 'https://app.test';
    it('keeps only this store pages, without actions or duplicates', () => {
        const out = selectWarmPaths([
            '/s/shop/sales', '/s/shop/sales/', '/s/shop/stock?tab=a', '/s/other/sales', 'https://evil.com/s/shop/x',
            '/s/shop/logout', '/s/shop/reports/export', '/s/shop/invoice.pdf', '/s/shop/api/x', '/login', '#', 'mailto:a@b.c',
        ], 'shop', o);
        expect(out).toEqual(['/s/shop/sales', '/s/shop/stock?tab=a']);
    });
    it('caps the list', () => {
        const many = Array.from({ length: 200 }, (_, i) => `/s/shop/p${i}`);
        expect(selectWarmPaths(many, 'shop', o)).toHaveLength(40);
    });
});
