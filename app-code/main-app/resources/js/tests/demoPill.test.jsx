// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';

const post = vi.fn();
let pageProps = { is_demo: true, store: { is_demo: true, demo_business_label: 'Pharmacy' } };
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: pageProps }),
    router: { post: (...a) => post(...a) },
}));
import DemoPill from '../Components/Demo/DemoPill.jsx';

const options = {
    businessTypes: [{ key: 'pharmacy', name: 'Pharmacy', sector: 'retail', note: '' }, { key: 'grocery', name: 'Grocery', sector: 'retail', note: '' }],
    primaryRoles: [{ id: 'owner', name: 'Store Owner', desc: '' }, { id: 'cashier', name: 'Cashier', desc: '' }],
    specializedRoles: [], currentBusinessType: 'pharmacy', currentRole: 'owner',
};
afterEach(() => { cleanup(); post.mockClear(); });

describe('DemoPill', () => {
    it('renders nothing outside the demo store', () => {
        pageProps = { is_demo: false, store: {} };
        const { container } = render(<DemoPill />);
        expect(container.innerHTML).toBe('');
    });
    it('opens the picker preselected and switches business + role', async () => {
        pageProps = { is_demo: true, store: { is_demo: true } };
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => options });
        render(<DemoPill />);
        fireEvent.click(screen.getByRole('button', { name: /demo/i }));
        await waitFor(() => screen.getByRole('dialog'));
        fireEvent.click(screen.getByText('Grocery'));
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        fireEvent.click(screen.getByText('Cashier'));
        fireEvent.click(screen.getByRole('button', { name: /switch demo/i }));
        expect(post.mock.calls[0][0]).toBe('/demo/switch-business');
        expect(post.mock.calls[0][1]).toEqual({ business_type: 'grocery', role: 'cashier' });
    });
});
