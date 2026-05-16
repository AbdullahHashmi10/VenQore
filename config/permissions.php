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
        // POS
        'pos',
        // Inventory
        'inventory', 'inventory.view', 'inventory.manage',
        // Sales
        'sales', 'sales_view', 'sales.view', 'sales.manage',
        // Purchases
        'purchases', 'purchases.view', 'purchases.manage',
        // Finance
        'finance', 'finance.view',
        // Reports
        'reports', 'reports.view', 'audit',
        // Customers & Suppliers
        'customers', 'customers.view',
        // Staff
        'users', 'staff.view', 'staff.manage',
        // Settings
        'settings', 'settings.view',
        // Billing (store-level only — never platform)
        'billing.view', 'billing.manage',
        // Discounts
        'discounts',
    ],

    'admin' => [
        // POS
        'pos',
        // Inventory
        'inventory', 'inventory.view', 'inventory.manage',
        // Sales
        'sales', 'sales_view', 'sales.view', 'sales.manage',
        // Purchases
        'purchases', 'purchases.view', 'purchases.manage',
        // Finance
        'finance', 'finance.view',
        // Reports
        'reports', 'reports.view', 'audit',
        // Customers & Suppliers
        'customers', 'customers.view',
        // Staff (no ownership transfer)
        'users', 'staff.view', 'staff.manage',
        // Settings (no store deletion)
        'settings', 'settings.view',
        // Discounts
        'discounts',
        // NOTE: 'billing.manage' deliberately omitted — admins cannot touch billing
    ],

    'manager' => [
        // POS
        'pos',
        // Inventory
        'inventory', 'inventory.view', 'inventory.manage',
        // Sales (full operational access)
        'sales', 'sales_view', 'sales.view', 'sales.manage',
        // Purchases
        'purchases', 'purchases.view', 'purchases.manage',
        // Finance (managers need to see cash flow, outstanding, net profit)
        'finance', 'finance.view', 'accounting',
        // Reports (all)
        'reports', 'reports.view',
        // Customers
        'customers', 'customers.view',
        // Discounts (within limits set by owner)
        'discounts',
        // NOTE: 'users', 'settings', 'billing.*' deliberately omitted
    ],

    'cashier' => [
        // POS only
        'pos',
        // Read stock levels (to check availability at register)
        'inventory.view',
        // Add customers at the register
        'customers.view',
        // NOTE: No reports, no finance, no staff, no settings
    ],

    'accountant' => [
        // Financial reports — full access
        'finance', 'finance.view',
        'reports', 'reports.view',
        // Read-only view of sales and purchases (for reconciliation)
        'sales_view', 'sales.view',
        'purchases.view',
        // Audit trail access
        'audit',
        // NOTE: Cannot create sales, cannot access POS, cannot manage staff
    ],

    'purchasing_officer' => [
        // Purchase orders and supplier management
        'purchases', 'purchases.view', 'purchases.manage',
        // Inventory view (to check stock before ordering)
        'inventory', 'inventory.view',
        // Customers view (for cross-reference)
        'customers.view',
        // NOTE: Cannot see sales totals, financial reports, or staff
    ],

    'viewer' => [
        // Read-only reports
        'reports', 'reports.view',
        // Read-only finance view
        'finance.view',
        // NOTE: Zero write access — cannot create or change anything
    ],

];
