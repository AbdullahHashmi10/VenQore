// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentSettings from '@/Documents/DocumentSettings';
import { documentType } from '@/Documents/documentTypes';

global.route = vi.fn((name) => `/${name}`);
global.axios = { get: vi.fn().mockResolvedValue({ data: [] }) };

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { store: { slug: 'test' }, settings: {} } }),
    router: { visit: vi.fn() },
}));

describe('DocumentSettings - Columns & Converters customization', () => {
    const doc = documentType('purchase-invoice');
    const comp = { details: 'open', summary: 'auto', pin: 'auto', split: 32, level: 'standard' };

    it('renders the Columns tab and shows line item switches and converters', () => {
        const setLineCol = vi.fn();
        const setShowAmountSolver = vi.fn();
        const setDefaultAmountSolver = vi.fn();
        const setShowDiscountType = vi.fn();
        const setDefaultDiscountType = vi.fn();

        render(
            <DocumentSettings
                doc={doc}
                comp={comp}
                setComp={vi.fn()}
                applyLayout={vi.fn()}
                textSize={1}
                setTextSize={vi.fn()}
                fields={{}}
                setField={vi.fn()}
                showRail={true}
                setShowRail={vi.fn()}
                showQuickEntry={false}
                setShowQuickEntry={vi.fn()}
                showStock={true}
                setShowStock={vi.fn()}
                canSeeMargin={false}
                lineCols={{ bizpct: true, taxpct: true }}
                setLineCol={setLineCol}
                showAmountSolver={true}
                setShowAmountSolver={setShowAmountSolver}
                defaultAmountSolver="price"
                setDefaultAmountSolver={setDefaultAmountSolver}
                showDiscountType={true}
                setShowDiscountType={setShowDiscountType}
                defaultDiscountType="fixed"
                setDefaultDiscountType={setDefaultDiscountType}
                currency="$"
                onClose={vi.fn()}
            />
        );

        // Click on the Columns navigation tab
        const columnsBtn = screen.getByRole('button', { name: /Columns/i });
        expect(columnsBtn).toBeDefined();
        fireEvent.click(columnsBtn);

        // Verify the line column switches exist
        expect(screen.getByText('Business %')).toBeDefined();
        expect(screen.getByText('Tax %')).toBeDefined();
        expect(screen.getByText('Batch selector (FIFO / manual)')).toBeDefined();
        expect(screen.getByText('Discount')).toBeDefined();

        // Verify the converters section exists
        expect(screen.getByText('Amount & Discount Converters')).toBeDefined();
        expect(screen.getByText('Amount converter button ($ / #)')).toBeDefined();
        expect(screen.getByText('Discount converter button ($ / %)')).toBeDefined();

        // Toggle a switch (e.g. Business %)
        const bizSwitch = screen.getByRole('switch', { name: 'Business %' });
        expect(bizSwitch).toBeDefined();
        fireEvent.click(bizSwitch);
        expect(setLineCol).toHaveBeenCalledWith('bizpct', false);

        // Toggle Amount solver button
        const amountSolverSwitch = screen.getByRole('switch', { name: 'Amount converter button' });
        fireEvent.click(amountSolverSwitch);
        expect(setShowAmountSolver).toHaveBeenCalledWith(false);

        // Toggle Discount converter button
        const discountTypeSwitch = screen.getByRole('switch', { name: 'Discount converter button' });
        fireEvent.click(discountTypeSwitch);
        expect(setShowDiscountType).toHaveBeenCalledWith(false);
    });

    it('hides columns and converter buttons when switched off in DocumentLines', async () => {
        const { default: DocumentLines } = await import('@/Documents/DocumentLines');
        const items = [{
            id: 'line-1',
            product: { id: 1, name: 'Garam Masala', price: 50, cost: 40 },
            quantity: 1,
            price: 50,
            discount: 0,
            discountType: 'fixed',
            business_pct: 100,
            tax_rate: 0,
        }];

        const chrome = {
            level: { cols: ['idx', 'item', 'qty', 'rate', 'disc', 'total', 'del'] },
            asCards: false,
            armedRow: null,
            setArmedRow: vi.fn(),
            showQuickEntry: false,
            lineCols: {
                bizpct: false,
                taxpct: false,
            },
        };

        const ctx = {
            locked: false,
            currency: '$',
            showStock: true,
            canDiscount: true,
            freeOn: false,
            showAmountSolver: false,
            showDiscountType: false,
            defaultDiscountType: 'fixed',
            defaultAmountSolver: 'price',
            totalMode: () => 'price',
            toggleTotalMode: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            onPickProduct: vi.fn(),
            onTotalChange: vi.fn(),
            money: (v) => `$${v}`,
        };

        render(
            <DocumentLines
                doc={doc}
                chrome={chrome}
                items={items}
                ctx={ctx}
            />
        );

        // Columns Business % and Tax % should NOT be in the table headers
        expect(screen.queryByText('Business %')).toBeNull();
        expect(screen.queryByText('Tax %')).toBeNull();

        // Amount flip button and Discount flip button should NOT be rendered
        expect(screen.queryByTitle('Editing the amount changes the price')).toBeNull();
        expect(screen.queryByTitle('Amount off')).toBeNull();
    });
});
