import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { formatCurrency } from '../Utils/format';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const settingsPage = read('resources/js/Pages/Admin/Settings.jsx');
const controller = read('app/Http/Controllers/AdminController.php');

function sectionFields(source, start, end, sectionPattern) {
    const body = source.split(start)[1]?.split(end)[0] || '';
    return Object.fromEntries([...body.matchAll(sectionPattern)].map((match) => [
        match[1], [...match[2].matchAll(/'([^']+)'/g)].map((field) => field[1]),
    ]));
}

const clientSections = sectionFields(settingsPage, 'const SECTION_FIELD_MAP = {', '\n};', /\b([a-z_]+): \[([\s\S]*?)\]/g);
const serverSections = sectionFields(controller, '$sectionKeyMap = [', '\n        ];', /'([a-z_]+)' => \[([\s\S]*?)\]/g);

describe('settings save contracts', () => {
    it('uses matching per-section keys in the page and server', () => {
        expect(serverSections).toEqual(clientSections);
    });

    it('sends each visible settings control in its own section', () => {
        const components = {
            profile: 'BusinessProfileSection',
            region_numbers: 'RegionNumbersSection',
            display: 'DisplayPreferencesSection',
            checkout_returns: 'CheckoutReturnsSection',
            documents_numbering: 'DocumentsNumberingSection',
            customers_suppliers: 'CustomersSuppliersSection',
            stock_items: 'StockItemsSection',
            document_layouts: 'DocumentLayoutsSection',
            printer_device: 'PrinterDeviceSection',
            manual_sharing: 'ManualSharingSection',
            reminders_alerts: 'RemindersAlertsSection',
            accounting: 'AccountingSection',
            features_connections: 'FeaturesConnectionsSection',
            security: 'SecuritySection',
            approvals: 'ApprovalsSection',
        };
        for (const [section, component] of Object.entries(components)) {
            const body = read(`resources/js/Components/Settings/${component}.jsx`);
            const visibleKeys = [...body.matchAll(/setData\('([^']+)'/g)].map((match) => match[1]);
            expect(visibleKeys.filter((key) => !clientSections[section]?.includes(key)), `${section} has unsaved controls`).toEqual([]);
        }
    });

    it('uses saved global decimal places when a page supplies store identity only', () => {
        const previousWindow = globalThis.window;
        try {
            globalThis.window = { amdSettings: { decimal_places: 1, currency_symbol: 'Rs.', print_amount_decimal: '0' } };
            expect(formatCurrency(1234.56, { slug: 'golden-co' })).toBe('Rs. 1,234.6');
            expect(formatCurrency(1234.56, { print_amount_decimal: '0' })).toBe('Rs. 1,235');
            globalThis.window.amdSettings.decimal_places = 0;
            expect(formatCurrency(1234.56, { slug: 'golden-co' })).toBe('Rs. 1,235');
        } finally {
            globalThis.window = previousWindow;
        }
    });
});
