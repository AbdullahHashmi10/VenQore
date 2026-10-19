// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';

const post = vi.fn();
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ url: '/demo', props: { auth: { user: null }, flash: {}, errors: {} } }),
    Head: ({ children }) => <>{children}</>,
    Link: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
    router: { post: (...a) => post(...a) },
}));

import DemoLanding from '../Pages/Demo/Landing.jsx';

const props = {
    businessTypes: [
        { key: 'pharmacy', name: 'Pharmacy', sector: 'retail', note: 'Batches and expiry' },
        { key: 'restaurant', name: 'Restaurant', sector: 'food', note: 'Tables and kitchen' },
    ],
    primaryRoles: [
        { id: 'owner', name: 'Store Owner', desc: 'Everything' },
        { id: 'cashier', name: 'Cashier', desc: 'The till' },
    ],
    specializedRoles: [{ id: 'dispenser', name: 'Pharmacy Dispenser', desc: 'Rx counter' }],
    initialBusinessType: null,
    initialRole: 'owner',
};

describe('DemoLanding', () => {
    beforeEach(() => post.mockClear());
    afterEach(() => cleanup());

    it('shows one button and nothing else until it is clicked', () => {
        render(<DemoLanding {...props} />);
        expect(screen.getByRole('button', { name: /open the live demo/i })).toBeTruthy();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByText('Cashier')).toBeNull();
    });

    it('walks business → user type → posts both choices', () => {
        render(<DemoLanding {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /open the live demo/i }));
        expect(screen.getByRole('dialog')).toBeTruthy();

        const dialog = screen.getByRole('dialog');
        const next = screen.getByRole('button', { name: /continue/i });
        expect(next.disabled).toBe(true);
        fireEvent.click(dialog.querySelector('.vq-dm-opt') || screen.getAllByText('Pharmacy').find(el => el.closest('[role="dialog"]')));
        expect(next.disabled).toBe(false);
        fireEvent.click(next);

        expect(screen.getByText(/who are you in the business/i)).toBeTruthy();
        fireEvent.click(screen.getByText('Cashier'));
        fireEvent.click(screen.getByRole('button', { name: /open the demo/i }));

        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][0]).toBe('/demo/login');
        expect(post.mock.calls[0][1]).toEqual({ business_type: 'pharmacy', role: 'cashier' });
    });

    it('filters business types by search and closes on Escape', () => {
        render(<DemoLanding {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /open the live demo/i }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(screen.getByLabelText(/search business types/i), { target: { value: 'kitchen' } });
        expect(dialog.querySelector('.vq-dm-opt:not([style*="display: none"])')?.textContent).not.toContain('Pharmacy');
        expect(screen.getByText('Restaurant')).toBeTruthy();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
