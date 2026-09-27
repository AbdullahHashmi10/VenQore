import { describe, it, expect } from 'vitest';
import PrintService from '../Utils/PrintService';

describe('PrintService Settings Normalization & Rules', () => {
    it('properly normalizes print_qr_code from various types', () => {
        expect(PrintService.normalizeSettings({ print_qr_code: true }).print_qr_code).toBe(true);
        expect(PrintService.normalizeSettings({ print_qr_code: 'true' }).print_qr_code).toBe(true);
        expect(PrintService.normalizeSettings({ print_qr_code: '1' }).print_qr_code).toBe(true);
        expect(PrintService.normalizeSettings({ print_qr_code: 1 }).print_qr_code).toBe(true);
        expect(PrintService.normalizeSettings({ print_qr_code: false }).print_qr_code).toBe(false);
        expect(PrintService.normalizeSettings({ print_qr_code: '0' }).print_qr_code).toBe(false);
        expect(PrintService.normalizeSettings({}).print_qr_code).toBe(true); // default is true
    });

    it('normalizes margin values with default fallbacks and numeric conversion', () => {
        const normalized = PrintService.normalizeSettings({
            margin_top: '12',
            margin_right: 0,
            margin_bottom: '0',
            margin_left: '15'
        });
        expect(normalized.margin_top).toBe(12);
        expect(normalized.margin_right).toBe(0);
        expect(normalized.margin_bottom).toBe(0);
        expect(normalized.margin_left).toBe(15);
    });

    it('calculates regular and thermal paper widths accurately', () => {
        const customSettings = PrintService.normalizeSettings({
            paper_size: 'Custom',
            custom_paper_width: 120,
            custom_paper_height: 180,
            paper_orientation: 'Portrait'
        });
        expect(PrintService._regularWidthMm(customSettings)).toBe(120);

        const thermal2inch = PrintService.normalizeSettings({ thermal_page_size: '2inch' });
        expect(PrintService._thermalWidthMm(thermal2inch)).toBe(58);

        const thermal3inch = PrintService.normalizeSettings({ thermal_page_size: '3inch' });
        expect(PrintService._thermalWidthMm(thermal3inch)).toBe(80);
    });

    it('correctly formats station data without replacing zero paid amount with total', () => {
        const sale = {
            id: 101,
            invoice_no: 'INV-101',
            final_total: 500,
            paid: 0,
            customer: { name: 'Walk-in' },
            items: [{ product: { name: 'Item 1' }, quantity: 1, unit_price: 500 }]
        };
        const formatted = PrintService._formatForStation(sale, { store_name: 'Test Store' });
        expect(formatted.paidAmount).toBe('0.00');
        expect(formatted.changeAmount).toBe('0.00');
    });
});

describe('Settings Safe Numeric & JSON Parsers', () => {
    const safeInt = (v, d = 0) => {
        const n = parseInt(v, 10);
        return isNaN(n) ? d : n;
    };

    const safeFloat = (v, d = 0) => {
        const n = parseFloat(v);
        return isNaN(n) ? d : n;
    };

    const safeParseJson = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data === 'object') return data;
        try {
            return JSON.parse(data);
        } catch {
            return fallback;
        }
    };

    it('preserves zero values without falling back to nonzero default', () => {
        expect(safeInt(0, 5)).toBe(0);
        expect(safeInt('0', 5)).toBe(0);
        expect(safeFloat(0.0, 1.5)).toBe(0);
        expect(safeFloat('0.0', 1.5)).toBe(0);
        expect(safeInt(null, 10)).toBe(10);
        expect(safeInt(undefined, 10)).toBe(10);
        expect(safeInt('', 10)).toBe(10);
        expect(safeInt('invalid', 10)).toBe(10);
    });

    it('safely parses valid and malformed JSON strings without throwing', () => {
        expect(safeParseJson('[{"id":1,"name":"GST"}]')).toEqual([{ id: 1, name: 'GST' }]);
        expect(safeParseJson({ id: 1 })).toEqual({ id: 1 });
        expect(safeParseJson('invalid-json-string', [])).toEqual([]);
        expect(safeParseJson(null, [])).toEqual([]);
    });
});
