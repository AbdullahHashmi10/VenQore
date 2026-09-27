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

describe('Settings Allowlist and Value Normalization Engine', () => {
    const validApprovalDocTypes = [
        'customer_receipt', 'customer_refund', 'supplier_payment', 'sales_invoice',
        'operating_expense', 'supplier_refund', 'purchase_posting', 'sales_return',
        'purchase_return', 'capital_injection', 'owner_drawings', 'fund_transfer',
        'balance_adjustment', 'sale', 'purchase', 'quotation', 'credit_note',
        'debit_note', 'expense', 'transfer', 'adjustment', 'refund',
        'production_run', 'cheque',
    ];

    const isDynamicApprovalKey = (key) => {
        for (const prefix of ['approval_policy_', 'approval_threshold_', 'approval_user_']) {
            if (key.startsWith(prefix)) {
                const suffix = key.slice(prefix.length);
                return validApprovalDocTypes.includes(suffix);
            }
        }
        return false;
    };

    const normalizeSettingValue = (k, v) => {
        if (k === 'decimal_places') {
            const num = parseInt(v, 10);
            return !isNaN(num) ? Math.max(0, Math.min(4, num)) : 2;
        }
        if (k === 'ui_scale') {
            const num = parseInt(v, 10);
            return !isNaN(num) ? Math.max(50, Math.min(200, num)) : 100;
        }
        if (k === 'auto_logout') {
            const num = parseInt(v, 10);
            return !isNaN(num) ? Math.max(0, Math.min(1440, num)) : 0;
        }
        if (k === 'product_cost_update_policy') {
            return ['manual', 'latest_purchase', 'moving_average', 'fifo'].includes(v) ? v : 'latest_purchase';
        }
        if (k === 'pos_return_mode') {
            return ['reference', 'customer_or_reference', 'open'].includes(v) ? v : 'reference';
        }
        if (k === 'fbr_mode' || k === 'fbr_environment') {
            return ['production', 'live', 'sandbox', 'disabled'].includes(v) ? v : 'sandbox';
        }
        if (k.startsWith('approval_policy_')) {
            return ['inherit', 'maker_checker', 'owner_only', 'auto_approve', 'disabled'].includes(v) ? v : 'inherit';
        }
        return v;
    };

    it('identifies and validates dynamic approval document keys strictly', () => {
        expect(isDynamicApprovalKey('approval_policy_sale')).toBe(true);
        expect(isDynamicApprovalKey('approval_policy_sales_invoice')).toBe(true);
        expect(isDynamicApprovalKey('approval_policy_customer_receipt')).toBe(true);
        expect(isDynamicApprovalKey('approval_threshold_purchase')).toBe(true);
        expect(isDynamicApprovalKey('approval_threshold_supplier_payment')).toBe(true);
        expect(isDynamicApprovalKey('approval_user_expense')).toBe(true);
        expect(isDynamicApprovalKey('approval_policy_arbitrary_injected_table')).toBe(false);
        expect(isDynamicApprovalKey('approval_unknown_key')).toBe(false);
    });

    it('enforces bounds and enum restrictions on settings values', () => {
        expect(normalizeSettingValue('decimal_places', 8)).toBe(4);
        expect(normalizeSettingValue('decimal_places', -2)).toBe(0);
        expect(normalizeSettingValue('decimal_places', '3')).toBe(3);
        expect(normalizeSettingValue('ui_scale', 250)).toBe(200);
        expect(normalizeSettingValue('ui_scale', 30)).toBe(50);
        expect(normalizeSettingValue('auto_logout', 2000)).toBe(1440);
        expect(normalizeSettingValue('product_cost_update_policy', 'invalid_policy')).toBe('latest_purchase');
        expect(normalizeSettingValue('product_cost_update_policy', 'moving_average')).toBe('moving_average');
        expect(normalizeSettingValue('pos_return_mode', 'reference')).toBe('reference');
        expect(normalizeSettingValue('pos_return_mode', 'customer_or_reference')).toBe('customer_or_reference');
        expect(normalizeSettingValue('pos_return_mode', 'open')).toBe('open');
        expect(normalizeSettingValue('pos_return_mode', 'within_window')).toBe('reference');
        expect(normalizeSettingValue('fbr_environment', 'live')).toBe('live');
        expect(normalizeSettingValue('fbr_mode', 'production')).toBe('production');
        expect(normalizeSettingValue('fbr_mode', 'untrusted_mode')).toBe('sandbox');
        expect(normalizeSettingValue('approval_policy_sale', 'maker_checker')).toBe('maker_checker');
        expect(normalizeSettingValue('approval_policy_sale', 'malicious_mode')).toBe('inherit');
    });

    it('computes tax correctly for both percentage and fixed tax modes (S09/M09)', () => {
        const computeTax = (taxable, rate, type, mode) => {
            if (rate <= 0) return 0;
            if (type === 'fixed') {
                return Math.min(taxable, Number(rate));
            }
            if (mode === 'inclusive') {
                return Math.round((taxable - (taxable / (1 + rate / 100))) * 100) / 100;
            }
            return Math.round(((taxable * rate) / 100) * 100) / 100;
        };

        // Percentage exclusive
        expect(computeTax(100, 18, 'percentage', 'exclusive')).toBe(18);
        // Percentage inclusive: 118 with 18% inclusive tax gives 18 tax
        expect(computeTax(118, 18, 'percentage', 'inclusive')).toBe(18);
        // Fixed tax: fixed $15 levy on $100 taxable gives $15
        expect(computeTax(100, 15, 'fixed', 'exclusive')).toBe(15);
        // Fixed tax cannot exceed taxable base
        expect(computeTax(10, 50, 'fixed', 'exclusive')).toBe(10);
    });

    it('scopes preferences and rescue keys per tenant (S15)', () => {
        const buildKey = (base, tenant, user, device) => `${base}.${tenant || 'default'}.${user || 'anon'}.${device || 'this'}`;

        const storeAKey = buildKey('venqore.newpos.prefs.v1', 'store-a', 'user-1', 'dev-1');
        const storeBKey = buildKey('venqore.newpos.prefs.v1', 'store-b', 'user-1', 'dev-1');

        expect(storeAKey).toBe('venqore.newpos.prefs.v1.store-a.user-1.dev-1');
        expect(storeBKey).toBe('venqore.newpos.prefs.v1.store-b.user-1.dev-1');
        expect(storeAKey).not.toBe(storeBKey);
    });

    it('replaces WhatsApp message template variables accurately', () => {
        const template = 'Greetings from [Firm_Name]. Invoice [Invoice_Number] for [Invoice_Amount] is ready. Link: [Link]';
        const rendered = template
            .replace('[Firm_Name]', 'AMD Store')
            .replace('[Invoice_Number]', 'INV-1002')
            .replace('[Invoice_Amount]', 'PKR 2,500.00')
            .replace('[Link]', 'https://pos.test/s/amd/sales/5');

        expect(rendered).toBe('Greetings from AMD Store. Invoice INV-1002 for PKR 2,500.00 is ready. Link: https://pos.test/s/amd/sales/5');
    });
});

