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

vi.mock('@/Components/PhoneActionMenu', () => ({ default: () => null }));

// Mock route() helper
// Like Ziggy: route() with no name returns the router (has/current).
const mockRoute = (name, params = {}) => (name === undefined ? mockRoute : `/s/test-store/${name}`);
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

    const render = (extra = {}) => renderToStaticMarkup(
        <BottomNavBar store={mockStore} modules={['pos', 'products', 'customers']} currentUrl="/store/dashboard" {...extra} />
    );

    it('1. The phone dock renders Dashboard, Contacts, the + actions button, Stock and Settings', () => {
        const html = render();
        expect(html).not.toBe('');
        expect(html).toContain('aria-label="Dashboard"');
        expect(html).toContain('aria-label="Contacts"');
        expect(html).toContain('aria-label="Open quick actions"');
        expect(html).toContain('aria-label="Stock"');
        expect(html).toContain('aria-label="Settings"');
        // the old five-tab labels are gone
        expect(html).not.toContain('aria-label="Sell"');
        expect(html).not.toContain('aria-label="Open navigation menu"');
    });

    it('2. The dock is fixed: it still renders when no modules are enabled', () => {
        const html = render({ modules: [] });
        expect(html).not.toBe('');
        expect(html).toContain('aria-label="Dashboard"');
        expect(html).toContain('aria-label="Settings"');
    });

    it('3. Contacts points at suppliers when the customers module is off', () => {
        const withCustomers = render();
        expect(withCustomers).toContain('href="/s/test-store/store.customers.index"');
        const withoutCustomers = render({ modules: ['pos', 'products'] });
        expect(withoutCustomers).toContain('href="/s/test-store/store.suppliers.index"');
        expect(withoutCustomers).not.toContain('store.customers.index');
    });

    it('4. The active item carries aria-current="page"', () => {
        expect(render({ activeItem: 'home' })).toContain('aria-current="page"');
        expect(render({ currentUrl: '/s/test-store/inventory' })).toContain('aria-current="page"');
        expect(render({ currentUrl: '/s/test-store/settings' })).toContain('aria-current="page"');
        expect(render({ currentUrl: '/s/test-store/reports' })).not.toContain('aria-current="page"');
    });

    it('5. Every item has an accessible name and the nav is labelled', () => {
        const html = render();
        expect(html).toContain('aria-label="Mobile navigation"');
        const labels = html.match(/aria-label="[^"]+"/g) || [];
        // nav + 5 items
        expect(labels.length).toBeGreaterThanOrEqual(6);
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
});
