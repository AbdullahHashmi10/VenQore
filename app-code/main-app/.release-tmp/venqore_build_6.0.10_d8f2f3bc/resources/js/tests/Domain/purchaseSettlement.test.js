import { describe, it, expect } from 'vitest';
import { purchaseStanding } from '../../Domain/purchase/settlement';

describe('purchaseStanding', () => {
    it('shows the server outstanding, which takes returns off, not total − paid', () => {
        // 1000 billed, 300 paid, 400 sent back on a debit note → 300 still owed.
        const s = purchaseStanding({
            purchase: { total: '1000.0000' },
            settlement: { total: 1000, paid: 300, returned: 400, outstanding: 300 },
            paidAmount: 300,
        });
        expect(s.outstanding).toBe(300);
        expect(s.paid).toBe(300);
        expect(s.returned).toBe(400);
        expect(s.total).toBe(1000);
    });

    it('reads a fully returned bill as settled', () => {
        const s = purchaseStanding({
            purchase: { total: 500 },
            settlement: { total: 500, paid: 0, returned: 500, outstanding: 0 },
        });
        expect(s.outstanding).toBe(0);
    });

    it('never shows a negative outstanding or more paid than billed', () => {
        const s = purchaseStanding({
            purchase: { total: 100 },
            settlement: { total: 100, paid: 120, returned: 0, outstanding: -20 },
        });
        expect(s.outstanding).toBe(0);
        expect(s.paid).toBe(100);
    });

    it('accepts decimal strings from the database', () => {
        const s = purchaseStanding({
            purchase: { total: '250.5000' },
            settlement: { total: '250.50', paid: '100.25', returned: '0', outstanding: '150.25' },
        });
        expect(s).toEqual({ total: 250.5, paid: 100.25, returned: 0, outstanding: 150.25 });
    });

    it('falls back to total − paid (floored at zero) when no summary is sent', () => {
        expect(purchaseStanding({ purchase: { total: 1000 }, paidAmount: 400 }).outstanding).toBe(600);
        expect(purchaseStanding({ purchase: { total: 1000 }, paidAmount: 1200 }).outstanding).toBe(0);
        expect(purchaseStanding({}).outstanding).toBe(0);
    });
});
