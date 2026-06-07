<?php

/**
 * VenQore Store-Level Permission Map
 *
 * This is the SINGLE SOURCE OF TRUTH for all store-level permissions.
 * No more checking role strings scattered across controllers.
 *
 * Usage in middleware:
 *   $rolePerms = config('permissions')[$membership->role] ?? [];
 *   if (in_array($permission, $rolePerms)) { allow }
 *
 * Usage in routes:
 *   Route::get('/staff', [StaffController::class, 'index'])
 *       ->middleware('permission:staff.view');
 *
 * ┌─────────────────────┬────────────────────────────────────────────────────┐
 * │ Role                │ Description                                        │
 * ├─────────────────────┼────────────────────────────────────────────────────┤
 * │ owner               │ Full store access. Cannot touch platform.          │
 * │ admin               │ Everything except billing, store deletion.         │
 * │ manager             │ Ops: POS, sales, purchases, inventory, reports.    │
 * │ cashier             │ POS only. Read stock. Add customer at register.    │
 * │ accountant          │ All financial reports. Read-only on transactions.  │
 * │ purchasing_officer  │ Purchases, suppliers, inventory view.              │
 * │ viewer              │ Read-only reports and finance view.                │
 * └─────────────────────┴────────────────────────────────────────────────────┘
 *
 * NOTE: 'owner' and 'admin' are checked separately in CheckPermissions (they
 * skip this map entirely — fast path). This map is for all other roles.
 */

return [

    'owner' => [
        // POS & Register
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        // Sales & Invoices
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        // Inventory & Warehouse
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        // Purchasing & Procurement
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        // Money & Finance
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        // Insights & Reports
        'reports.summary', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        // Store Administration
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses', 'admin.data_recovery', 'admin.billing_store',
    ],

    'admin' => [
        // POS & Register
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        // Sales & Invoices
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        // Inventory & Warehouse
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        // Purchasing & Procurement
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        // Money & Finance
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        // Insights & Reports
        'reports.summary', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        // Store Administration (excluding billing / store deletion)
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses', 'admin.data_recovery',
    ],

    'manager' => [
        // POS & Register
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        // Sales & Invoices
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        // Inventory & Warehouse
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        // Purchasing & Procurement
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs', 'purchases.suppliers',
        // Money & Finance: (Managers are completely BLOCKED from balances, payouts, and collections)
        // Insights & Reports
        'reports.summary', 'reports.stock', 'reports.performance',
        // Store Administration (Read general settings and edit print formats only)
        'admin.staff_view', 'admin.settings_view', 'admin.receipt_print',
    ],

    'cashier' => [
        // POS & Register (restricted checkout operations)
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.close_session',
        // Inventory View (check product availability at checkout)
        'inventory.view',
    ],

    'accountant' => [
        // Money & Finance (full access to record adjustments and audit books)
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        // Insights & Reports (reconcile and print statements)
        'reports.summary', 'reports.financial', 'reports.audit',
        // Sales & Purchases Read-Only views for audits
        'sales.view', 'purchases.view', 'inventory.view',
    ],

    'purchasing_officer' => [
        // Purchasing & Procurement (full control)
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        // Inventory view to check current stock levels
        'inventory.view',
        // Stock Reports for low stock notifications
        'reports.stock',
    ],

    'viewer' => [
        // Read-only insight access
        'reports.summary', 'reports.financial', 'reports.stock',
        // Read-only directories
        'sales.view', 'inventory.view', 'purchases.view', 'finance.transactions',
    ],

];
