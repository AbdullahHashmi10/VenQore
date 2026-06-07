import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Global Keyboard Shortcuts Hook
 * Handles application-wide navigation and action shortcuts.
 */
export const useGlobalShortcuts = () => {
    const { store } = usePage().props;

    useEffect(() => {
        if (!store?.slug) return;

        const handleKeyDown = (e) => {
            // Ignore if input is focused (unless it's a specific chord that should override, like Alt+Keys)
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

            // Allow Alt+Key and Shift+Key navigation even if input is focused? 
            // Usually Alt+Keys are safe. Shift+Keys might conflict (e.g. typing capital letters).
            // So for Shift+Keys, we MUST check !isInput.

            // --- NAVIGATION (SHIFT + Key) ---
            if (e.shiftKey && !e.ctrlKey && !e.altKey && !isInput) {
                switch (e.key.toLowerCase()) {
                    case 'h': // Home/Dashboard
                        e.preventDefault();
                        router.visit(route("store.dashboard", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'p': // Parties
                        e.preventDefault();
                        router.visit(route("store.parties.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'i': // Items (Inventory)
                        e.preventDefault();
                        router.visit(route("store.inventory.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'r': // Reports
                        e.preventDefault();
                        router.visit(route("store.reports.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'b': // Bank Accounts
                        e.preventDefault();
                        router.visit(route('store.bank-accounts.index', { store_slug: store.slug }));
                        break;
                    case 'c': // Cash In Hand (Funds)
                        e.preventDefault();
                        router.visit(route('store.funds.index', { store_slug: store.slug }));
                        break;
                    case 'e': // Expenses
                        e.preventDefault();
                        router.visit(route('store.expenses.index', { store_slug: store.slug }));
                        break;
                    case 'o': // Orders (Sales Orders)
                        e.preventDefault();
                        router.visit(route("store.pre-sales.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 's': // Estimates/Quotations (Proposals)
                        e.preventDefault();
                        router.visit(route("store.proposals.index", {
                            store_slug: store.slug
                        }));
                        break;
                    // case 'u': // Cheques (Not mapped yet)
                    case '1': // Settings
                        e.preventDefault();
                        router.visit(route('store.admin.settings', { store_slug: store.slug }));
                        break;
                    case '4': // Notifications
                        e.preventDefault();
                        router.visit(route('store.notifications.index', { store_slug: store.slug }));
                        break;
                    case '6': // Payment Reminder
                        e.preventDefault();
                        router.visit(route('store.invoice-reminders.index', { store_slug: store.slug }));
                        break;
                    case '2': // View Print Center (Labels)
                        e.preventDefault();
                        router.visit(route('store.labels.index', { store_slug: store.slug }));
                        break;
                    // case '3': // Calculator (Modal TODO)
                }
            }

            // --- ACTIONS (ALT + Key) ---
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 's': // Sale (POS? or Standard Sale?) Image says POS is Alt+Z. So Alt+S is Sale.
                        e.preventDefault();
                        router.visit(route("store.sales.index", {
                            store_slug: store.slug
                        })); // Or sales.create
                        break;
                    case 'p': // Purchase
                        e.preventDefault();
                        router.visit(route("store.purchases.create", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'i': // Payment-In
                        e.preventDefault();
                        router.visit(route('store.payments.in', { store_slug: store.slug }));
                        break;
                    case 'o': // Payment-Out
                        e.preventDefault();
                        router.visit(route('store.payments.out', { store_slug: store.slug }));
                        break;
                    case 'e': // Expense
                        e.preventDefault();
                        router.visit(route('store.expenses.index', { store_slug: store.slug })); // Expenses usually added from list or modal
                        break;
                    case 'n': // Add Party
                        e.preventDefault();
                        // Redirect to parties with openCreate=true param if supported, or just index
                        router.visit(route("store.parties.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'a': // Add Item
                        e.preventDefault();
                        router.visit(route("store.inventory.index", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'f': // Sale Order
                        e.preventDefault();
                        router.visit(route("store.pre-sales.create", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'g': // Purchase Order
                        e.preventDefault();
                        router.visit(route('store.purchase-orders.create', { store_slug: store.slug })); // Assuming route exists
                        break;
                    // case 'd': // Delivery Challan
                    case 'm': // Estimate
                        e.preventDefault();
                        router.visit(route("store.proposals.create", {
                            store_slug: store.slug
                        }));
                        break;
                    case 'r': // Sales Return
                        e.preventDefault();
                        router.visit(route('store.returns.create', { store_slug: store.slug }));
                        break;
                    // case 'l': // Purchase Return
                    case 'b': // Add Bank Account
                        e.preventDefault();
                        router.visit(route('store.bank-accounts.index', { store_slug: store.slug }));
                        break;
                    case 'z': // POS Billing
                        e.preventDefault();
                        router.visit(route("store.pos", {
                            store_slug: store.slug
                        }));
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
};
