import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Provide minimal document for Node SSR
if (typeof global.document === 'undefined') {
    global.document = { body: {} };
}

// Mock @inertiajs/react
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    Link: ({ href, children, className, 'aria-current': ariaCurrent, 'aria-label': ariaLabel, ...props }) => (
        React.createElement('a', { href, className, 'aria-current': ariaCurrent, 'aria-label': ariaLabel, ...props }, children)
    ),
}));

// Mock route() helper
const mockRoute = (name, params = {}) => `/s/test-store/${name}`;
mockRoute.current = () => false;
mockRoute.has = () => true;
global.route = mockRoute;

import { usePage } from '@inertiajs/react';
import BottomNavBar from '../Components/BottomNavBar.jsx';

describe('SPEC_MOBILE_BOTTOM_NAV — BottomNavBar Component', () => {
    const mockStore = {
        id: 1,
        name: 'Test Store',
        slug: 'test-store',
        plan: 'core',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.route.current = () => false;
        usePage.mockReturnValue({
            url: '/store/dashboard',
            props: {
                store: mockStore,
                modules: ['pos', 'products', 'customers'],
                terms: {},
            },
        });
    });

    it('1. With modules: [\'pos\', \'products\', \'customers\'], the bar renders Home, Sell, Stock, Contacts and More', () => {
        const html = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/store/dashboard"
            />
        );

        expect(html).not.toBe('');
        expect(html).toContain('Home');
        expect(html).toContain('Sell');
        expect(html).toContain('Stock');
        expect(html).toContain('Contacts');
        expect(html).toContain('More');
    });

    it('2. With modules: [], the bar renders nothing', () => {
        const html = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={[]}
                currentUrl="/store/dashboard"
            />
        );

        // When modules: [], only Home and More could exist (length = 2).
        // Since fewer than 3 items resolve, it renders nothing (empty string in static markup).
        expect(html).toBe('');
    });

    it('3. A module-gated item is absent from the markup, not merely hidden by a class', () => {
        // Here 'products' and 'inventory' are absent from modules
        const html = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'customers']}
                currentUrl="/store/dashboard"
            />
        );

        // The bar still renders because 4 items resolve: Home, Sell, Contacts, More (>= 3)
        expect(html).not.toBe('');
        // Stock must be completely absent from the markup
        expect(html).not.toContain('Stock');
        expect(html).not.toContain('inventory');
    });

    it('4. The active item carries aria-current="page"', () => {
        // Home active
        const htmlHome = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/store/dashboard"
                activeItem="home"
            />
        );
        expect(htmlHome).toContain('aria-current="page"');

        // Sell active
        const htmlSell = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/store/dashboard"
                activeItem="sell"
            />
        );
        expect(htmlSell).toContain('aria-current="page"');
    });

    it('5. Every item has an accessible name', () => {
        const html = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/store/dashboard"
            />
        );

        // Home, Sell, Stock, Contacts all have aria-label and visible text
        expect(html).toContain('aria-label="Home"');
        expect(html).toContain('aria-label="Sell"');
        expect(html).toContain('aria-label="Stock"');
        expect(html).toContain('aria-label="Contacts"');

        // More has an accessible name describing what it opens
        expect(html).toContain('aria-label="Open navigation menu"');
    });

    it('hides on POS, checkout, and document editor routes (/create, /edit)', () => {
        const htmlPos = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/s/test-store/pos"
            />
        );
        expect(htmlPos).toBe('');

        const htmlCheckout = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/s/test-store/checkout"
            />
        );
        expect(htmlCheckout).toBe('');

        const htmlCreate = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/s/test-store/sales/invoice/create"
            />
        );
        expect(htmlCreate).toBe('');

        const htmlEdit = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                modules={['pos', 'products', 'customers']}
                currentUrl="/s/test-store/products/123/edit"
            />
        );
        expect(htmlEdit).toBe('');
    });

    it('7. Renders dynamic server-resolved mobileNav when provided', () => {
        const dynamicNav = [
            { id: 'home', label: 'Home', route: 'store.dashboard', icon: 'Home', module: null },
            { id: 'services', label: 'Jobs', route: 'store.service-jobs.index', icon: 'Wrench', module: 'services' },
            { id: 'invoicing', label: 'Invoices', route: 'store.sales.index', icon: 'FileText', module: 'invoicing' },
            { id: 'customers', label: 'Clients', route: 'store.customers.index', icon: 'Users', module: 'customers' },
            { id: 'more', label: 'More', route: null, icon: 'Menu', module: null },
        ];

        const html = renderToStaticMarkup(
            <BottomNavBar
                store={mockStore}
                mobileNav={dynamicNav}
                currentUrl="/s/test-store/dashboard"
            />
        );

        expect(html).toContain('Home');
        expect(html).toContain('Jobs');
        expect(html).toContain('Invoices');
        expect(html).toContain('Clients');
        expect(html).toContain('More');
    });
});

