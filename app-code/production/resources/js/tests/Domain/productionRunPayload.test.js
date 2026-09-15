import { describe, it, expect } from 'vitest';
import {
    PRODUCTION_RUN_FIELDS,
    bomRequirements,
    bomsForProduct,
    buildProductionRunPayload,
    localIsoDate,
} from '../../Domain/production/runPayload';

describe('buildProductionRunPayload', () => {
    it('sends exactly the V3 ProductionRunController contract', () => {
        const body = buildProductionRunPayload({
            product_id: 'p1', bom_id: 'b1', planned_qty: '3', warehouse_id: 7, run_date: '2026-09-01', notes: 'x',
        });
        expect(Object.keys(body)).toEqual(PRODUCTION_RUN_FIELDS);
        expect(body).toEqual({ bom_id: 'b1', warehouse_id: '7', planned_qty: 3, run_date: '2026-09-01' });
    });

    it('never sends the old screen fields', () => {
        const body = buildProductionRunPayload({ product_id: 'p1', quantity: 2, recipe_id: 'r1', bom_id: 'b1' });
        ['product_id', 'quantity', 'recipe_id', 'notes', 'product_name'].forEach((k) => expect(body).not.toHaveProperty(k));
    });

    it('defaults the run date to the local today', () => {
        const today = new Date(2026, 8, 5, 23, 30);
        expect(buildProductionRunPayload({ bom_id: 'b1' }, today).run_date).toBe('2026-09-05');
        expect(localIsoDate(new Date(2026, 0, 2))).toBe('2026-01-02');
    });
});

describe('bomsForProduct / bomRequirements', () => {
    const boms = [
        { id: 'b1', product_id: 'p1', items: [{ product_id: 'r1', qty_per_unit: 2 }, { product_id: 'x', qty_per_unit: 1, is_byproduct: true }] },
        { id: 'b2', product_id: 'p2', items: [] },
    ];

    it('filters by product (ids compared as strings)', () => {
        expect(bomsForProduct(boms, 'p1').map((b) => b.id)).toEqual(['b1']);
        expect(bomsForProduct(boms, '')).toHaveLength(2);
        expect(bomsForProduct(null, 'p1')).toEqual([]);
    });

    it('scales inputs and leaves by-products out', () => {
        expect(bomRequirements(boms[0], '2.5')).toEqual([{ product_id: 'r1', qty_per_unit: 2, required: 5 }]);
        expect(bomRequirements(null, 3)).toEqual([]);
    });
});
