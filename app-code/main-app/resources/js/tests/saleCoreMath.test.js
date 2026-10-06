import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { computeTotals } from '@/Sell/core/cartMath';
import { buildSalePayload } from '@/Sell/core/salePayload';
import { CASES } from './fixtures/sale-core/cases.js';

/**
 * The pure Sale Core (cartMath + salePayload) must reproduce every recording
 * made from the original Pos.jsx — totals shown and the exact request body —
 * to the paisa and key for key. Fixtures are never re-recorded to make this pass.
 */
const FIXTURES = path.resolve(__dirname, 'fixtures/sale-core');

describe('Sale Core pure modules vs recordings of the original register', () => {
    for (const c of CASES) {
        it(c.name, () => {
            const local = { pos_enable_tax: 'true', pos_round_off: 'false', ...(c.local || {}) };
            const settings = { business_name: 'Test', currency_symbol: 'Rs', decimal_places: '2', default_tax_rate: '0', ...(c.settings || {}) };
            const sale = {
                id: 'S1', type: 'pos', cashReceived: '', searchTerm: '', customer: null,
                discountType: 'fixed', discountValue: 0, ...(c.sale || {}), cart: c.cart,
            };
            const totals = computeTotals({
                cart: sale.cart,
                sale,
                settings,
                enableTax: local.pos_enable_tax === 'true',
                enableFreeQty: local.pos_enable_free_qty === 'true',
                tableMode: c.terminal === 'table',
                serviceChargePct: parseFloat(settings.service_charge_percent || 0) || 0,
                tipEnabled: true,
                roundOff: local.pos_round_off === 'true',
            });
            const body = buildSalePayload({
                sale, totals,
                paymentData: { payments: [{ method: 'cash', amount: totals.cartTotal, account_id: null }], notes: '' },
                addToLedger: false, registerShift: null, settings, warehouseId: null,
            });

            const recorded = JSON.parse(fs.readFileSync(path.join(FIXTURES, `${c.id}.json`), 'utf8'));
            expect(JSON.parse(JSON.stringify(body))).toEqual(recorded.request_body);
        });
    }
});
