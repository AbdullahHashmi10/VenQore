import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { isReportLocked, REPORT_PLAN_FEATURES } from '../lib/reportPlanMap.js';

// Mock @inertiajs/react usePage and Link
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    Link: ({ href, children, className, ...props }) => (
        React.createElement('a', { href, className, ...props }, children)
    ),
}));

import { usePage } from '@inertiajs/react';
import ReportsNavigation from '../Components/ReportsNavigation.jsx';

// Setup a global Ziggy route mock
const mockRoute = (name, params = {}) => {
    const slug = params.store_slug || 'test-store';
    if (name === 'store.billing') return `/s/${slug}/billing`;
    return `/s/${slug}/${name.replace(/^store\./, '').replace(/\./g, '/')}`;
};
mockRoute.current = () => false;
mockRoute.has = () => true;
global.route = mockRoute;

describe('Report Plan Gating (Fix 2)', () => {
    describe('isReportLocked helper contract', () => {
        it('returns false when planFeatures is missing or empty (fails open)', () => {
            expect(isReportLocked('store.reports.profit-loss', null)).toBe(false);
            expect(isReportLocked('store.reports.profit-loss', undefined)).toBe(false);
            expect(isReportLocked('store.reports.profit-loss', {})).toBe(false);
            expect(isReportLocked('store.reports.profit-loss', { other_feature: false })).toBe(false);
        });

        it('returns false for unmapped operational reports regardless of planFeatures', () => {
            const planFeatures = { report_profit_loss: false, stock_valuation: false };
            expect(isReportLocked('store.reports.sales', planFeatures)).toBe(false);
            expect(isReportLocked('store.reports.day-book', planFeatures)).toBe(false);
            expect(isReportLocked('store.reports.index', planFeatures)).toBe(false);
            expect(isReportLocked('store.reports.transactions', planFeatures)).toBe(false);
            expect(isReportLocked('store.reports.party-statement', planFeatures)).toBe(false);
        });

        it('returns true when the required feature key is explicitly false', () => {
            expect(isReportLocked('store.reports.profit-loss', { report_profit_loss: false })).toBe(true);
            expect(isReportLocked('store.reports.trial-balance', { report_ledger: false })).toBe(true);
            expect(isReportLocked('store.reports.inventory-valuation', { report_stock_valuation: false })).toBe(true);
            expect(isReportLocked('store.reports.cash-flow', { report_cash_flow: false })).toBe(true);
            expect(isReportLocked('store.reports.discount', { report_discounts: false })).toBe(true);
        });

        it('returns false when the required feature key is true', () => {
            expect(isReportLocked('store.reports.profit-loss', { report_profit_loss: true })).toBe(false);
            expect(isReportLocked('store.reports.trial-balance', { report_ledger: true })).toBe(false);
            expect(isReportLocked('store.reports.inventory-valuation', { report_stock_valuation: true })).toBe(false);
        });

        it('correctly maps all 23 plan features to their respective routes', () => {
            const allFeatures = Object.values(REPORT_PLAN_FEATURES);
            const uniqueFeatures = [...new Set(allFeatures)];
            expect(uniqueFeatures).toHaveLength(23);

            for (const [routeName, featureKey] of Object.entries(REPORT_PLAN_FEATURES)) {
                // When false => locked
                expect(isReportLocked(routeName, { [featureKey]: false })).toBe(true);
                // When true => unlocked
                expect(isReportLocked(routeName, { [featureKey]: true })).toBe(false);
            }
        });
    });

    describe('ReportsNavigation component behavior', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('renders a plan-gated report with a lock badge and links to billing', () => {
            usePage.mockReturnValue({
                url: '/s/demo/reports',
                props: {
                    store: { slug: 'demo' },
                    modules: ['accounting_workspace'], // module is enabled
                    planFeatures: { report_profit_loss: false }, // plan is locked (Solo)
                },
            });

            const html = renderToStaticMarkup(React.createElement(ReportsNavigation));

            // Profit & Loss should render
            expect(html).toContain('Profit &amp; Loss');
            // It must link to billing
            expect(html).toContain('href="/s/demo/billing"');
            // It must show the Upgrade lock badge
            expect(html).toContain('Upgrade');
        });

        it('renders a plan-gated report unlocked and linking to report route when plan allows it', () => {
            usePage.mockReturnValue({
                url: '/s/demo/reports',
                props: {
                    store: { slug: 'demo' },
                    modules: ['accounting_workspace'],
                    planFeatures: { report_profit_loss: true }, // Scale / Starter plan
                },
            });

            const html = renderToStaticMarkup(React.createElement(ReportsNavigation));

            expect(html).toContain('Profit &amp; Loss');
            expect(html).toContain('href="/s/demo/reports/profit-loss"');
            // Should NOT have Upgrade badge for Profit & Loss
            expect(html).not.toContain('Upgrade');
        });

        it('does NOT render module-gated entries when module is disabled', () => {
            usePage.mockReturnValue({
                url: '/s/demo/reports',
                props: {
                    store: { slug: 'demo' },
                    modules: [], // Solo tenant with 0 optional modules
                    planFeatures: { report_profit_loss: false },
                },
            });

            const html = renderToStaticMarkup(React.createElement(ReportsNavigation));

            // Module-gated entries must be absent (no trace in DOM):
            expect(html).not.toContain('Profit &amp; Loss');
            expect(html).not.toContain('Purchases');
            expect(html).not.toContain('Expenses');
            expect(html).not.toContain('General Ledger');
            expect(html).not.toContain('Trial Balance');
            expect(html).not.toContain('Stock Valuation');
            expect(html).not.toContain('Balance Sheet');
            expect(html).not.toContain('Party Statements');

            // Operational / unmapped entries must remain present:
            expect(html).toContain('Overview');
            expect(html).toContain('Sales Report');
            expect(html).toContain('Day Book');
            expect(html).toContain('Transactions');
        });

        it('fails open when planFeatures is missing from props (no locked reports)', () => {
            usePage.mockReturnValue({
                url: '/s/demo/reports',
                props: {
                    store: { slug: 'demo' },
                    modules: ['accounting_workspace', 'inventory'],
                    // planFeatures omitted / undefined
                },
            });

            const html = renderToStaticMarkup(React.createElement(ReportsNavigation));

            expect(html).toContain('Profit &amp; Loss');
            expect(html).toContain('Stock Valuation');
            expect(html).not.toContain('Upgrade');
            expect(html).not.toContain('/s/demo/billing');
            expect(html).toContain('href="/s/demo/reports/profit-loss"');
        });
    });
});
