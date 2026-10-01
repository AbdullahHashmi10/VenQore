// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrintService from '../Utils/PrintService';
import { AMDStation, useAMDStation } from '../Utils/AMDStation';
import { ZReportPrintService } from '../Utils/ZReportPrintService';
import { KitchenPrintService } from '../Utils/KitchenPrintService';
import { printBrowserHtml } from '../Utils/BrowserPrint';

vi.mock('../Utils/BrowserPrint', async importOriginal => ({
    ...await importOriginal(), printBrowserHtml: vi.fn().mockResolvedValue({ success: true }),
}));

afterEach(() => { vi.restoreAllMocks(); delete window.amdAPI; delete window.amdSettings; });

describe('production printing audit regressions', () => {
    it('uses persisted discounted amounts, explicit precision and unpaid balance', () => {
        const data = PrintService._formatForStation({
            invoice_total: '108.00', total: 999, paid_amount: 0, paid: 999,
            subtotal_gross: 100, total_item_discounts: 10, total_tax: 18,
            items: [{ quantity: 2, unit_price: 50, net_amount: 90, line_total: 108, tax_amount: 18 }],
        }, { decimal_places: 3, currency_symbol: 'AED' });
        expect(data).toMatchObject({ total: '108.000', paidAmount: '0.000', balanceAmount: '108.000', discount: '10.000', currencySymbol: 'AED ' });
        expect(data.items[0].total).toBe('90.000');
    });

    it('preserves explicit zero quantities and prices', () => {
        const data = PrintService._formatForStation({ total: 0, items: [{ quantity: 0, qty: 5, unit_price: 0, price: 99 }] }, {});
        expect(data.items[0]).toMatchObject({ qty: 0, price: '0.00', total: '0.00' });
    });

    it('does not open a drawer after a failed print', async () => {
        vi.spyOn(AMDStation, 'print').mockResolvedValue({ success: false });
        const drawer = vi.spyOn(AMDStation, 'openDrawer');
        await AMDStation.printAndOpenDrawer({}, { openDrawer: true });
        expect(drawer).not.toHaveBeenCalled();
    });

    it('keeps the saved printer instead of selecting the system PDF printer', async () => {
        window.amdAPI = {};
        vi.spyOn(AMDStation, 'check').mockResolvedValue({ isAMDStation: true });
        vi.spyOn(AMDStation, 'getPrinters').mockResolvedValue([{ name: 'Microsoft Print to PDF', isDefault: true }, { name: 'Receipt Printer' }]);
        vi.spyOn(AMDStation, 'getPrefs').mockResolvedValue({ defaultPrinter: 'My Saved Printer' });
        const setter = vi.spyOn(AMDStation, 'setDefaultPrinter');
        let state;
        function Probe() { state = useAMDStation(); return null; }
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        const root = createRoot(document.createElement('div'));
        await act(async () => root.render(<Probe />));
        expect(state.defaultPrinter).toBe('My Saved Printer');
        expect(setter).not.toHaveBeenCalled();
        await act(async () => root.unmount());
    });

    it('sends structured Z-report rows containing revenue and reconciliation', () => {
        const rows = ZReportPrintService.formatEscPos({ store: { name: 'Audit Shop' }, sales: { grand_total: 125 }, cash_reconciliation: { variance: -5, variance_type: 'shortage' } });
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.every(row => row.type === 'text')).toBe(true);
        expect(rows.map(row => row.value).join('\n')).toContain('TOTAL REVENUE');
        expect(JSON.stringify(rows)).not.toMatch(/\\u001[bBdD]/);
    });

    it('escapes customer-controlled kitchen text in browser printing', async () => {
        await KitchenPrintService.printViaIframe({ order_number: '<script>bad()</script>', items: [{ qty: 1, name: '<img onerror=bad()>', notes: 'A&B' }] }, { paperWidth: '80mm' });
        const html = printBrowserHtml.mock.calls.at(-1)[0];
        expect(html).not.toContain('<script>bad()');
        expect(html).not.toContain('<img onerror');
        expect(html).toContain('&lt;img onerror=bad()&gt;');
        expect(html).toContain('A&amp;B');
    });

    it('escapes the invoice title and sizes non-A4 landscape pages correctly', () => {
        const html = PrintService._buildHtml('receipt', '', 'size:A4', { reference_number: '</title><script>bad()</script>' }, false, {});
        expect(html).not.toContain('<script>');
        expect(PrintService._regularWidthMm({ paper_size: 'Legal', paper_orientation: 'Landscape' })).toBe(356);
        expect(PrintService._regularWidthMm({ paper_size: 'A5', paper_orientation: 'Landscape' })).toBe(210);
    });

    it('prints comma-formatted tax and the outstanding balance', () => {
        const rows = AMDStation.formatReceiptData({ total: '2,000.00', tax: '1,000.00', paidAmount: '0.00', balanceAmount: '2,000.00', currencySymbol: 'USD ' });
        expect(rows.map(row => row.value)).toContain('Tax: USD 1,000.00');
        expect(rows.map(row => row.value)).toContain('Balance due: USD 2,000.00');
    });
});
