import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Provide minimal document for Node SSR
if (typeof global.document === 'undefined') {
    global.document = { body: {} };
}

// Mock react-dom createPortal so components render inline in SSR/Node tests
vi.mock('react-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createPortal: (children) => children,
    };
});

// Mock @inertiajs/react usePage, useForm, and Link
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    useForm: vi.fn((defaults = {}) => ({
        data: { ...defaults },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    })),
    router: {
        post: vi.fn(),
        get: vi.fn(),
    },
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
import ProductModal from '../Components/ProductModal.jsx';

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
        it('renders ProductModal with modules: ["products"] and asserts variants tab, barcode section, and batch fields are absent from markup', () => {
            // Tenant with ONLY products enabled (variants, barcodes_labels, batches_expiry, pre_sales disabled)
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'test-store', currency: 'USD' },
                    settings: { batch_tracking_enabled: '1' },
                    modules: ['products'],
                    terms: {},
                },
            });

            const html = renderToStaticMarkup(
                React.createElement(ProductModal, {
                    isOpen: true,
                    mode: 'create',
                    product: null,
                    warehouses: [],
                    categories: [],
                    attributes: [],
                    tools: [],
                    onClose: () => {},
                })
            );

            // Basic product form fields MUST be present
            expect(html).toContain('Add New Product');

            // Variants tab MUST be absent from markup
            expect(html).not.toContain('id="tour-tab-variants"');

            // Barcode section MUST be absent from markup
            expect(html).not.toContain('id="tour-product-barcode"');

            // Batch tracking fields MUST be absent from markup (even with batch_tracking_enabled: "1")
            expect(html).not.toContain('Batch Number');
            expect(html).not.toContain('Expiry Date');

            // Reservations tab MUST be absent from markup
            expect(html).not.toContain('id="tour-tab-reservations"');
        });

        it('renders ProductModal with optional modules enabled and asserts controls are present in markup', () => {
            // Tenant with all subfeature modules enabled
            usePage.mockReturnValue({
                props: {
                    store: { slug: 'test-store', currency: 'USD' },
                    settings: { batch_tracking_enabled: '1' },
                    modules: ['products', 'variants', 'barcodes_labels', 'batches_expiry', 'pre_sales'],
                    terms: {},
                },
            });

            const html = renderToStaticMarkup(
                React.createElement(ProductModal, {
                    isOpen: true,
                    mode: 'create',
                    product: null,
                    warehouses: [],
                    categories: [],
                    attributes: [],
                    tools: [],
                    onClose: () => {},
                })
            );

            // Gated subfeatures MUST now be present in markup
            expect(html).toContain('id="tour-tab-variants"');
            expect(html).toContain('id="tour-product-barcode"');
            expect(html).toContain('Batch Number');
            expect(html).toContain('Expiry Date');
            expect(html).toContain('id="tour-tab-reservations"');
        });
    });
});
