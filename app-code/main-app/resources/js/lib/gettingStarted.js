/**
 * Getting-started steps — the ONE list the profile card and the checklist
 * popup both read. A step is "done" when the store has real data for it
 * (onboarding_metrics from TenantMiddleware), never because someone clicked.
 *
 *   tourStep  the onboarding_step that launches the guided tour (null = just go there)
 *   route     where the step happens
 */
import { router } from '@inertiajs/react';

export const GETTING_STARTED = [
    {
        key: 'inventory', metric: 'has_products', tourStep: 'inventory_tour', route: 'store.inventory.index',
        label: 'Add your first product', why: 'Everything else starts here: you can’t sell or buy what isn’t in your catalogue.',
        how: 'Open Stock → Products, tap “Add product”, then enter a name and a price.',
    },
    {
        key: 'purchase', metric: 'has_purchases', tourStep: 'purchase_tour_start', route: 'store.dashboard',
        label: 'Record a purchase', why: 'Tell VenQore what you bought from a supplier and your stock fills itself.',
        how: 'Open Purchasing → New purchase, pick the supplier and add the items.',
    },
    {
        key: 'sale', metric: 'has_sales', tourStep: 'invoice_tour_start', route: 'store.dashboard',
        label: 'Make your first sale', why: 'See a real sale go through, from the till or an invoice, with stock and money updating.',
        how: 'Open Sell → Point of sale (or New invoice), add items and take payment.',
    },
    {
        key: 'expense', metric: 'has_expenses', tourStep: 'expense_tour_start', route: 'store.dashboard',
        label: 'Record an expense', why: 'Rent, power, wages: so your profit figure is the real one.',
        how: 'Open Money → Expenses and tap “Add expense”.',
    },
    {
        key: 'customize_dashboard', metric: 'has_custom_dashboard', tourStep: 'customize_dashboard_tour', route: 'store.dashboard',
        label: 'Customize your dashboard', why: 'Tailor your workspace with charts, live metrics, and frame layouts that fit your daily routine.',
        how: 'Drag cards to reorder, resize to fit, or tap “Add a card” at the bottom to explore 40+ real-time business readings.',
    },
    {
        key: 'online_store', metric: 'has_online_store', tourStep: 'online_store_tour', route: 'store.commerce.home',
        label: 'Set up your online store', why: 'Sell products online with your dedicated storefront, digital catalog, and instant orders.',
        how: 'Open Online Store, customize your store link and delivery options, and publish products for your customers.',
    },
    {
        key: 'team', metric: 'has_team', tourStep: null, route: 'store.staff.hub',
        label: 'Invite someone to your team', why: 'Give a cashier or manager their own login, with only the access they need.',
        how: 'Open Team and send an invite. Only needed if someone else will use VenQore.',
    },
    {
        key: 'drive_sync', metric: 'has_drive_sync', tourStep: 'drive_sync_tour', route: 'store.admin.data', params: { tab: 'drive_sync' },
        label: 'Back up your data', why: 'A safe copy of your business in your own Google Drive.',
        how: 'Open Settings → Data and connect Google Drive.',
    },
];

/** Where things live. Shown as plain tips, not tracked. */
export const FIND_YOUR_WAY = [
    { title: 'The side menu', text: 'On the left. Each area (Sell, Stock, Purchasing, Money) opens to the tools inside it. On a phone, tap the menu button at the top.' },
    { title: 'Search anything', text: 'Press Ctrl + K (or tap the search bar) to jump to any product, customer, invoice or page.' },
    { title: 'Settings', text: 'At the bottom of the side menu. Business details, taxes, receipts, team access and backups are all there.' },
    { title: 'Your profile', text: 'Tap your name at the top right for your password, passcode and this checklist.' },
];

export const isStepDone = (item, metrics = {}, store = {}) => {
    if (item.key === 'drive_sync') {
        return !!metrics.has_drive_sync || !!store?.google_backup_enabled || !!store?.google_connected;
    }
    if (item.key === 'customize_dashboard') {
        return !!metrics.has_custom_dashboard || !!store?.dashboard_customized;
    }
    if (item.key === 'online_store') {
        return !!metrics.has_online_store || !!store?.storefront_published || !!store?.has_online_store;
    }
    return !!metrics[item.metric];
};

/** Launch a step: set the onboarding step if appropriate, then navigate directly to the correct workflow page. */
export function startStep(store, item) {
    const slug = store?.slug;
    if (!slug) return;

    if (item.key === 'inventory') {
        router.post(
            route('store.onboarding.step', { store_slug: slug }),
            { step: 'inventory_tour' },
            {
                preserveScroll: true,
                onSuccess: () => router.visit(route('store.inventory.index', { store_slug: slug })),
            }
        );
        return;
    }

    if (item.key === 'purchase') {
        router.post(
            route('store.onboarding.step', { store_slug: slug }),
            { step: 'purchase_tour_start' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (window.location.pathname.includes('/dashboard')) {
                        window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'purchase_tour_start' }));
                    } else {
                        router.visit(route('store.dashboard', { store_slug: slug }));
                    }
                },
            }
        );
        return;
    }

    if (item.key === 'sale') {
        router.visit(route('store.pos', { store_slug: slug }));
        return;
    }

    if (item.key === 'expense') {
        router.visit(route('store.expenses.index', { store_slug: slug }));
        return;
    }

    if (item.key === 'customize_dashboard') {
        router.post(
            route('store.onboarding.step', { store_slug: slug }),
            { step: 'customize_dashboard_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (window.location.pathname.includes('/dashboard')) {
                        window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'customize_dashboard_tour' }));
                    } else {
                        router.visit(route('store.dashboard', { store_slug: slug }));
                    }
                },
            }
        );
        return;
    }

    if (item.key === 'online_store') {
        router.post(
            route('store.onboarding.step', { store_slug: slug }),
            { step: 'online_store_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (window.location.pathname.includes('/dashboard')) {
                        window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'online_store_tour' }));
                    } else {
                        router.visit(route('store.dashboard', { store_slug: slug }), {
                            onSuccess: () => {
                                setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'online_store_tour' }));
                                }, 200);
                            }
                        });
                    }
                },
            }
        );
        return;
    }

    if (item.key === 'drive_sync') {
        router.visit(route('store.admin.data', { store_slug: slug, tab: 'drive_sync' }));
        return;
    }

    if (item.route) {
        router.visit(route(item.route, { store_slug: slug, ...(item.params || {}) }));
    }
}
