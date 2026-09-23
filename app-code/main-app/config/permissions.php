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
 *
 * Phase 1 approval release (2026-09-23) added 7 new permission keys:
 *   finance.customer_refund, finance.supplier_refund, purchases.returns,
 *   finance.capital_add, finance.owner_drawings, finance.internal_transfer,
 *   approvals.configure
 * Defaults: owner/admin get all 7. franchise_admin mirrors admin on the 3
 * refund/return keys only — NOT the 3 sensitive-funds keys or
 * approvals.configure, which stay owner/admin-only by design. manager and
 * purchasing_officer both get purchases.returns. No other role gets any of
 * the 7 by default; owners may delegate any of them per-employee via a
 * membership's custom permission override.
 * See project doc "Phase 1 — new permission keys, role defaults" for the
 * full rationale and the decisions confirmed with the store owner.
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
        // Approvals & Governance
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.inbox', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.withdraw', 'approvals.resubmit', 'approvals.configure',
        // Granular split permissions
        'data.export', 'records.force_delete', 'users.manage',
        // Marketplace / VenSynQ integrations
        'vensynq.manage',
        // Phase 1: refunds, returns, sensitive funds (owner has full access)
        'finance.customer_refund', 'finance.supplier_refund', 'purchases.returns',
        'finance.capital_add', 'finance.owner_drawings', 'finance.internal_transfer',
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
        // Approvals & Governance
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.inbox', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.withdraw', 'approvals.resubmit', 'approvals.configure',
        // Granular split permissions
        'data.export', 'records.force_delete', 'users.manage',
        // Marketplace / VenSynQ integrations
        'vensynq.manage',
        // Phase 1: refunds, returns, sensitive funds (admin has full access, matching owner)
        'finance.customer_refund', 'finance.supplier_refund', 'purchases.returns',
        'finance.capital_add', 'finance.owner_drawings', 'finance.internal_transfer',
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
        // Approvals & Governance (Managers review operational documents)
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.inbox', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.withdraw', 'approvals.resubmit',
        // Granular split permissions
        'data.export',
        // Phase 1: purchase returns (manager already holds full purchase authority)
        'purchases.returns',
    ],

    'cashier' => [
        // POS & Register (restricted checkout operations)
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.close_session',
        // Inventory View (check product availability at checkout)
        'inventory.view',
        // Approvals (Can view own submissions and resubmit/withdraw them)
        'approvals.view_own', 'approvals.submit', 'approvals.withdraw', 'approvals.resubmit',
    ],

    'accountant' => [
        // Money & Finance (full access to record adjustments and audit books)
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        // Insights & Reports (reconcile and print statements)
        'reports.summary', 'reports.financial', 'reports.audit',
        // Sales & Purchases Read-Only views for audits
        'sales.view', 'purchases.view', 'inventory.view',
        // Approvals & Governance (Accountants review vouchers and receipts)
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.inbox', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.withdraw', 'approvals.resubmit',
        // Granular split permissions
        'data.export',
    ],

    'purchasing_officer' => [
        // Purchasing & Procurement (full control)
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        // Inventory view to check current stock levels
        'inventory.view',
        // Stock Reports for low stock notifications
        'reports.stock',
        // Approvals (Submit purchasing/supplier payment approvals, view own)
        'approvals.view_own', 'approvals.submit', 'approvals.withdraw', 'approvals.resubmit',
        // Phase 1: purchase returns (explicitly authorized default per release scope)
        'purchases.returns',
    ],

    'viewer' => [
        // Read-only insight access
        'reports.summary', 'reports.financial', 'reports.stock',
        // Read-only directories
        'sales.view', 'inventory.view', 'purchases.view', 'finance.transactions',
    ],


    /*
    | Route-gap sweep (2026-09-10): these roles are offered when inviting staff
    | (StaffController / StaffInvitationController) but had NO entry here, so
    | they resolved to zero permissions. Each now gets a least-privilege set.
    | Owners can still override any member with custom checkboxes.
    */
    'franchise_admin' => [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'reports.summary', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses',
        'data.export', 'users.manage',
        // Phase 1: refunds and returns mirror admin. NOT sensitive funds (capital/drawings/
        // internal transfer) or approvals.configure — those stay owner/admin only regardless
        // of franchise_admin's usual "mirrors admin" pattern (release scope decision).
        'finance.customer_refund', 'finance.supplier_refund', 'purchases.returns',
    ],

    'shift_supervisor' => [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.returns',
        'inventory.view',
        'reports.summary',
        'admin.staff_view',
    ],

    'inventory_controller' => [
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'reports.stock', 'admin.warehouses',
    ],

    'hr_officer' => [
        'admin.staff_view', 'admin.staff_manage', 'reports.performance',
    ],

    'production_supervisor' => [
        'inventory.view', 'inventory.edit', 'inventory.adjust', 'reports.stock',
    ],

    'kitchen_manager' => [
        'pos.checkout', 'sales.view', 'sales.edit', 'inventory.view', 'reports.summary',
    ],

    'dispenser' => [
        'pos.checkout', 'inventory.view',
    ],

    'sales_executive' => [
        'pos.checkout', 'sales.view', 'sales.create', 'sales.quotations', 'inventory.view', 'reports.summary',
    ],

    'fulfillment_lead' => [
        'sales.view', 'sales.edit', 'inventory.view', 'inventory.transfer',
    ],

    'delivery_driver' => [
        'sales.view',
    ],

    // 'custom' uses only the checkboxes stored on the membership.
    'custom' => [],

];
