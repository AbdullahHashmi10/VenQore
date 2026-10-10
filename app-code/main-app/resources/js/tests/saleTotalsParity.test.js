/**
 * Calculation contract v2 — hand-computed fixtures shared with PHP
 * (tests/Unit/SaleTotalsParityTest.php reads the same file). Exact string
 * equality: no tolerance. Plus a seeded property run of valid carts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { calculateSale, serializeResult } from '@/Sell/core/saleTotals';
import { allocate, MoneyError } from '@/Sell/core/money';

const { cases } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures/sale-totals/cases.json'), 'utf8'));

function matches(actual, expected, where) {
    for (const [k, v] of Object.entries(expected)) {
        if (k === 'lines') v.forEach((l, i) => matches(actual.lines[i], l, `${where}.lines[${i}]`));
        else expect(actual[k], `${where}.${k}`).toBe(v);
    }
}

describe('SaleTotals shared fixtures (JS runtime)', () => {
    for (const c of cases) {
        it(c.name, () => {
            if (c.error) {
                let err = null;
                try { calculateSale(c.input); } catch (e) { err = e; }
                expect(err).toBeInstanceOf(MoneyError);
                expect(err.code).toBe(c.error);
                return;
            }
            matches(serializeResult(calculateSale(c.input)), c.expect, c.name);
        });
    }
});

/* Small deterministic PRNG so failures are reproducible from the seed. */
function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe('SaleTotals invariants over 10,000 seeded valid carts', () => {
    it('conserves every component and stays within legal bounds', () => {
        const seed = 20261008;
        const r = rng(seed);
        for (let n = 0; n < 10000; n++) {
            const lineCount = 1 + Math.floor(r() * 6);
            const lines = Array.from({ length: lineCount }, () => {
                const price = (Math.floor(r() * 500000) / 100).toFixed(2);
                const qty = r() < 0.3 ? (Math.floor(r() * 5000) / 1000 + 0.001).toFixed(3) : String(1 + Math.floor(r() * 9));
                return { unit_price: price, qty, tax_rate: r() < 0.2 ? String(Math.floor(r() * 25)) : null };
            });
            const input = {
                lines,
                bill_discount: r() < 0.5 ? { type: 'percentage', value: String(Math.floor(r() * 1000) / 10) } : { type: 'fixed', value: '0' },
                tax: { enabled: r() < 0.6, inclusive: r() < 0.4, default_rate: String([0, 5, 10, 16, 17, 18][Math.floor(r() * 6)]) },
                charges: { delivery: r() < 0.3 ? '120' : '0', tip: r() < 0.2 ? '50' : '0' },
                bill_rounding: { apply: r() < 0.5, setting: ['0', '1', '-1', 'none'][Math.floor(r() * 4)] },
            };
            const t = calculateSale(input);
            const where = `seed ${seed} cart ${n}: ${JSON.stringify(input)}`;
            const sum = (k) => t.lines.reduce((a, l) => a + l[k], 0n);
            expect(sum('bill_share'), where).toBe(t.bill_discount);
            expect(sum('tax'), where).toBe(t.tax);
            expect(sum('revenue'), where).toBe(t.revenue);
            expect(t.revenue + t.tax, where).toBe(input.tax.enabled && input.tax.inclusive ? t.taxable : t.taxable + t.tax);
            expect(t.components, where).toBe(t.revenue + t.tax + t.charges);
            expect(t.invoice - t.round_off, where).toBe(t.components);
            for (const l of t.lines) {
                expect(l.bill_share <= l.net && l.bill_share >= 0n, where).toBe(true);
                expect(l.tax >= 0n && l.tax <= l.base, where).toBe(true);
            }
            if (!input.bill_rounding.apply) expect(t.round_off, where).toBe(0n);
        }
    });

    it('allocation does not depend on anything but weights and order of ties', () => {
        expect(allocate(1n, [100n, 100n, 100n])).toEqual([1n, 0n, 0n]);
        expect(allocate(2n, [0n, 5n, 5n])).toEqual([0n, 1n, 1n]);
        expect(allocate(0n, [1n, 2n])).toEqual([0n, 0n]);
        expect(allocate(7n, [0n, 0n])).toEqual([0n, 0n]);
    });
});
