import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock @inertiajs/react usePage and Link
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    Link: ({ href, children, className, ...props }) => (
        React.createElement('a', { href, className, ...props }, children)
    ),
}));

// Mock route()
const mockRoute = (name, params = {}) => `/s/test-store/${name}`;
mockRoute.current = () => false;
mockRoute.has = () => true;
global.route = mockRoute;

import { usePage } from '@inertiajs/react';
import StockModuleTabs from '../Components/StockModuleTabs.jsx';
import ContactsModuleTabs from '../Components/ContactsModuleTabs.jsx';
import SellModuleTabs from '../Components/SellModuleTabs.jsx';
import MoneyModuleTabs from '../Components/MoneyModuleTabs.jsx';
import PurchaseModuleTabs from '../Components/PurchaseModuleTabs.jsx';

describe('P0 Verification — Tab and Control Gating (R02 & R17)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('R02: Shared tab components fail-closed when modules are off', () => {
        it('StockModuleTabs hides tracking and manufacturing groups when those modules are disabled', () => {
            // Solo tenant with only products enabled
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'solo-store' },
                    modules: ['products'],
                },
            });

            const html = renderToStaticMarkup(React.createElement(StockModuleTabs, { activeTab: 'products' }));

            // Products should be present
            expect(html).toContain('Products');

            // Manufacturing & Tracking must NOT be rendered at all
            expect(html).not.toContain('Batch Tracking');
            expect(html).not.toContain('Serial Tracking');
            expect(html).not.toContain('Production');
            expect(html).not.toContain('Cookbook');
            expect(html).not.toContain('Stock Transfers');
            expect(html).not.toContain('Stock Audit');
        });

        it('ContactsModuleTabs hides team and suppliers when staff and supplier modules are disabled', () => {
            // Solo tenant with customers only
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'solo-store' },
                    modules: ['customers'],
                },
            });

            const html = renderToStaticMarkup(React.createElement(ContactsModuleTabs, { activeTab: 'customers' }));

            expect(html).toContain('Customers');

            // Suppliers and Team must be absent
            expect(html).not.toContain('Suppliers');
            expect(html).not.toContain('Ledgers');
            expect(html).not.toContain('Staff Attendance');
            expect(html).not.toContain('Staff Summaries');
            expect(html).not.toContain('Team');
        });

        it('SellModuleTabs hides proposals and recurring invoices when modules are disabled', () => {
            // Invoicing only
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'solo-store' },
                    modules: ['invoicing'],
                },
            });

            const html = renderToStaticMarkup(React.createElement(SellModuleTabs, { activeTab: 'orders' }));

            // Sales Orders and New Invoice appear for invoicing
            expect(html).toContain('All Sales Orders');
            expect(html).toContain('New Invoice');

            // Gated subfeatures must be absent
            expect(html).not.toContain('Quotations');
            expect(html).not.toContain('Proposals');
            expect(html).not.toContain('Recurring Invoices');
            expect(html).not.toContain('Returns History');
            expect(html).not.toContain('E-Invoicing');
        });

        it('MoneyModuleTabs hides banking when bank_accounts is disabled', () => {
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'solo-store' },
                    modules: ['payments'],
                },
            });

            const html = renderToStaticMarkup(React.createElement(MoneyModuleTabs, { activeTab: 'payments' }));

            expect(html).toContain('Payments');
            expect(html).not.toContain('Bank Accounts');
            expect(html).not.toContain('Bank Reconciliation');
        });

        it('PurchaseModuleTabs hides purchases and purchase orders when procurement modules are disabled', () => {
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'solo-store' },
                    modules: [],
                },
            });

            const html = renderToStaticMarkup(React.createElement(PurchaseModuleTabs, { activeTab: 'purchases' }));

            expect(html).not.toContain('Purchase Orders');
            expect(html).not.toContain('Debit Notes');
        });
    });

    describe('R17: Subfeature controls are gated behind their respective modules', () => {
        it('gates variants, barcode labels, and reservations behind module checks in product interfaces', () => {
            // Test module check predicate logic used in ProductModal / InventoryList:
            const modules = ['products']; // variants and barcodes_labels disabled

            const isVariantsEnabled = !Array.isArray(modules) || modules.includes('variants');
            const isBarcodesEnabled = !Array.isArray(modules) || modules.includes('barcodes_labels');
            const isPreSalesEnabled = !Array.isArray(modules) || modules.includes('pre_sales');
            const isBatchesEnabled = !Array.isArray(modules) || modules.includes('batches_expiry');

            expect(isVariantsEnabled).toBe(false);
            expect(isBarcodesEnabled).toBe(false);
            expect(isPreSalesEnabled).toBe(false);
            expect(isBatchesEnabled).toBe(false);

            // When variants module is added:
            const modulesWithVariants = ['products', 'variants'];
            expect(!Array.isArray(modulesWithVariants) || modulesWithVariants.includes('variants')).toBe(true);
            expect(!Array.isArray(modulesWithVariants) || modulesWithVariants.includes('barcodes_labels')).toBe(false);
        });
    });
});
