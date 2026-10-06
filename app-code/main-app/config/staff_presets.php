<?php

/**
 * 32 Reusable Staff Presets
 * Source of Truth: extras/VENQORE_STAFF_PRESETS_DASHBOARD_PLANNER.html
 */

return [
        [
        "id" => "checkout",
        "name" => "Checkout operator",
        "group" => "Sales floor",
        "purpose" => "Run checkout and track personal work without store finances.",
        "permissions" => [
        "pos.open_session",
            "pos.checkout",
            "foh.access",
            "pos.close_session",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "pos",
            "cash_register",
            "products",
            "inventory"
        ],
        "caution" => ""
    ],
    [
        "id" => "senior_checkout",
        "name" => "Senior checkout operator",
        "group" => "Sales floor",
        "purpose" => "Handle cart discounts and item corrections; no refund payments by default.",
        "permissions" => [
        "pos.open_session",
            "pos.checkout",
            "foh.access",
            "pos.close_session",
            "pos.discounts",
            "pos.void_item",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "pos",
            "cash_register",
            "park_recall",
            "products",
            "inventory"
        ],
        "caution" => ""
    ],
    [
        "id" => "shift_lead",
        "name" => "Shift lead",
        "group" => "Sales floor",
        "purpose" => "Coordinate counter work and inspect sales. No profit, bank balances or team permission editing.",
        "permissions" => [
        "pos.open_session",
            "pos.checkout",
            "foh.access",
            "pos.close_session",
            "pos.discounts",
            "pos.void_item",
            "sales.view",
            "reports.performance",
            "inventory.view",
            "admin.staff_view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "pos",
            "cash_register",
            "park_recall",
            "products",
            "inventory",
            "staff_attendance"
        ],
        "caution" => ""
    ],
    [
        "id" => "invoice_clerk",
        "name" => "Invoice clerk",
        "group" => "Sales floor",
        "purpose" => "Create and follow own invoices and submissions.",
        "permissions" => [
        "sales.create",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "invoicing",
            "products"
        ],
        "caution" => ""
    ],
    [
        "id" => "sales_coordinator",
        "name" => "Sales coordinator",
        "group" => "Sales floor",
        "purpose" => "Manage sales records and quotations without cash-ledger or cost access.",
        "permissions" => [
        "sales.view",
            "sales.create",
            "sales.edit",
            "sales.quotations",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "invoicing",
            "quotations",
            "sales_orders",
            "customers",
            "products"
        ],
        "caution" => ""
    ],
    [
        "id" => "returns_desk",
        "name" => "Returns desk",
        "group" => "Sales floor",
        "purpose" => "Prepare authorized customer returns. Paying refunds is a separate delegation.",
        "permissions" => [
        "sales.view",
            "sales.returns",
            "pos.refund",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "sales_returns",
            "pos",
            "invoicing",
            "products"
        ],
        "caution" => "Refund payment authority is deliberately excluded; pos.refund behavior must be reconciled so an integrated payout cannot bypass finance.customer_refund."
    ],
    [
        "id" => "stock_lookup",
        "name" => "Stock lookup assistant",
        "group" => "Stock & purchasing",
        "purpose" => "Check availability and product details without valuation or stock mutations.",
        "permissions" => [
        "inventory.view"
        ],
        "modules" => [
        "products",
            "inventory",
            "serials",
            "variants"
        ],
        "caution" => ""
    ],
    [
        "id" => "catalogue_editor",
        "name" => "Catalogue editor",
        "group" => "Stock & purchasing",
        "purpose" => "Maintain product records and labels; no deletion, cost or margin reporting.",
        "permissions" => [
        "inventory.view",
            "inventory.create",
            "inventory.edit",
            "inventory.barcodes",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "products",
            "inventory",
            "variants",
            "barcodes_labels",
            "units_of_measure"
        ],
        "caution" => ""
    ],
    [
        "id" => "warehouse_operator",
        "name" => "Warehouse operator",
        "group" => "Stock & purchasing",
        "purpose" => "Count and transfer stock within assigned locations.",
        "permissions" => [
        "inventory.view",
            "inventory.adjust",
            "inventory.transfer",
            "inventory.barcodes",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "products",
            "inventory",
            "multi_location",
            "stock_transfers",
            "stock_takes",
            "barcodes_labels"
        ],
        "caution" => ""
    ],
    [
        "id" => "inventory_planner",
        "name" => "Inventory planner",
        "group" => "Stock & purchasing",
        "purpose" => "Monitor stock health, expiry and valuation with explicit stock reporting.",
        "permissions" => [
        "inventory.view",
            "reports.stock",
            "inventory.barcodes",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "products",
            "inventory",
            "batches_expiry",
            "multi_location",
            "stock_takes"
        ],
        "caution" => "reports.stock includes monetary stock valuation in this contract; use Stock lookup assistant when that is inappropriate."
    ],
    [
        "id" => "purchasing_clerk",
        "name" => "Purchasing clerk",
        "group" => "Stock & purchasing",
        "purpose" => "Draft purchases and follow personal submissions without wholesale analytics.",
        "permissions" => [
        "purchases.create",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "suppliers",
            "purchases",
            "purchase_orders",
            "products"
        ],
        "caution" => ""
    ],
    [
        "id" => "procurement_lead",
        "name" => "Procurement lead",
        "group" => "Stock & purchasing",
        "purpose" => "Manage procurement, supplier records, cost analysis and returns.",
        "permissions" => [
        "purchases.view",
            "purchases.create",
            "purchases.edit",
            "purchases.costs",
            "purchases.suppliers",
            "purchases.returns",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "suppliers",
            "purchases",
            "purchase_orders",
            "purchase_returns",
            "landed_cost",
            "products",
            "inventory"
        ],
        "caution" => ""
    ],
    [
        "id" => "production_operator",
        "name" => "Production operator",
        "group" => "Stock & purchasing",
        "purpose" => "Track production quantities and material adjustments; no cost or profit reporting.",
        "permissions" => [
        "inventory.view",
            "inventory.adjust",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "products",
            "inventory",
            "production_runs",
            "cookbook",
            "composite_items"
        ],
        "caution" => "There is no production-specific grant in the 77-key vocabulary. These grants also allow inventory adjustments outside production. This cannot be a tightly isolated production role without additional record/workflow scoping."
    ],
    [
        "id" => "collections",
        "name" => "Collections clerk",
        "group" => "Money & accounting",
        "purpose" => "Record customer receipts and follow personal receipt submissions.",
        "permissions" => [
        "finance.receive_payment",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "payments",
            "customers"
        ],
        "caution" => "This grant does not authorize the customer balance directory. Delegate finance.balances separately only if the broader balance access is intended."
    ],
    [
        "id" => "payables",
        "name" => "Payables clerk",
        "group" => "Money & accounting",
        "purpose" => "Record supplier payments; no store-wide bank or ledger summaries.",
        "permissions" => [
        "finance.send_payment",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "payments",
            "suppliers"
        ],
        "caution" => ""
    ],
    [
        "id" => "expenses",
        "name" => "Expense submitter",
        "group" => "Money & accounting",
        "purpose" => "Submit expenses and correct returned personal entries.",
        "permissions" => [
        "finance.expenses",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "expenses"
        ],
        "caution" => ""
    ],
    [
        "id" => "journal_clerk",
        "name" => "Journal clerk",
        "group" => "Money & accounting",
        "purpose" => "Prepare journal entries and track personal posting work.",
        "permissions" => [
        "finance.journal",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "accounting_workspace"
        ],
        "caution" => "Creating journal entries is powerful accounting authority. This preset does not grant financial statements or approval rights."
    ],
    [
        "id" => "bookkeeper",
        "name" => "Bookkeeper",
        "group" => "Money & accounting",
        "purpose" => "Reconcile receipts, payments and journals with explicit ledger and balance access.",
        "permissions" => [
        "finance.balances",
            "finance.transactions",
            "finance.receive_payment",
            "finance.send_payment",
            "finance.expenses",
            "finance.journal",
            "sales.view",
            "purchases.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "bank_accounts",
            "bank_reconciliation",
            "payments",
            "expenses",
            "accounting_workspace",
            "invoicing",
            "purchases",
            "suppliers"
        ],
        "caution" => ""
    ],
    [
        "id" => "accountant",
        "name" => "Reporting accountant",
        "group" => "Money & accounting",
        "purpose" => "Review statements, costs, tax and fiscal periods without fund mutations.",
        "permissions" => [
        "reports.financial",
            "reports.summary",
            "reports.audit",
            "purchases.view",
            "purchases.costs",
            "finance.balances",
            "finance.transactions",
            "finance.fiscal_year.view",
            "data.export"
        ],
        "modules" => [
        "reports",
            "accounting_workspace",
            "tax_compliance",
            "fixed_assets",
            "loans",
            "bank_accounts",
            "purchases",
            "suppliers"
        ],
        "caution" => ""
    ],
    [
        "id" => "cheque_operator",
        "name" => "Cheque operations clerk",
        "group" => "Money & accounting",
        "purpose" => "Manage cheque books and clearing using dedicated cheque grants.",
        "permissions" => [
        "finance.cheque_books.view",
            "finance.cheque_books.manage",
            "finance.cheques.clear",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "bank_accounts"
        ],
        "caution" => "Cheque registers may contain counterparty and cheque amounts. This does not grant all bank balances or duplicate overrides."
    ],
    [
        "id" => "refund_officer",
        "name" => "Refund payment officer",
        "group" => "Money & accounting",
        "purpose" => "Issue explicit customer refunds and record supplier refunds.",
        "permissions" => [
        "finance.customer_refund",
            "finance.supplier_refund",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "payments",
            "sales_returns",
            "purchase_returns",
            "pos",
            "purchases",
            "suppliers"
        ],
        "caution" => "Sensitive delegation. Record-scoped refund sources and amount limits still apply; no general capital, drawings or balance adjustment."
    ],
    [
        "id" => "treasury",
        "name" => "Treasury operator",
        "group" => "Money & accounting",
        "purpose" => "Inspect balances and move funds between authorized store accounts.",
        "permissions" => [
        "finance.balances",
            "finance.transactions",
            "finance.internal_transfer",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "bank_accounts",
            "payments",
            "cash_register",
            "pos"
        ],
        "caution" => "Do not auto-include capital injections, drawings, balance adjustments or cheque overrides."
    ],
    [
        "id" => "fiscal_controller",
        "name" => "Fiscal period controller",
        "group" => "Money & accounting",
        "purpose" => "Manage year closing and posting-period controls with explicit grants.",
        "permissions" => [
        "finance.fiscal_year.view",
            "finance.fiscal_year.manage",
            "finance.fiscal_year.close",
            "finance.period_lock",
            "finance.period_reopen",
            "finance.period_exception",
            "reports.financial",
            "reports.audit"
        ],
        "modules" => [
        "accounting_workspace",
            "reports"
        ],
        "caution" => "Closing, reopening and exceptions are sensitive. Enforce period eligibility, audit trails and any separation-of-duties rules."
    ],
    [
        "id" => "approval_observer",
        "name" => "Approval observer",
        "group" => "Review & administration",
        "purpose" => "Read assigned approval work without making decisions.",
        "permissions" => [
        "approvals.view",
            "approvals.inbox"
        ],
        "modules" => [],
        "caution" => ""
    ],
    [
        "id" => "approval_reviewer",
        "name" => "Approval reviewer",
        "group" => "Review & administration",
        "purpose" => "Review assigned submissions and make only delegated decisions.",
        "permissions" => [
        "approvals.view",
            "approvals.inbox",
            "approvals.review",
            "approvals.approve",
            "approvals.reject",
            "approvals.return"
        ],
        "modules" => [],
        "caution" => "Decision grants are incomplete without an explicit allowed-action assignment. They must not mean approval authority over every business operation."
    ],
    [
        "id" => "external_auditor",
        "name" => "External auditor",
        "group" => "Review & administration",
        "purpose" => "Read financial and audit reports and export permitted data; no mutations.",
        "permissions" => [
        "reports.financial",
            "reports.audit",
            "reports.stock",
            "finance.fiscal_year.view",
            "data.export"
        ],
        "modules" => [
        "reports",
            "accounting_workspace",
            "inventory",
            "products"
        ],
        "caution" => "The selected financial and stock report grants expose sensitive values. Restrict tenant/branch and engagement duration."
    ],
    [
        "id" => "people_admin",
        "name" => "People administrator",
        "group" => "Review & administration",
        "purpose" => "View staff and manage authorized employee grants.",
        "permissions" => [
        "admin.staff_view",
            "admin.staff_manage",
            "users.manage"
        ],
        "modules" => [
        "staff_attendance"
        ],
        "caution" => "Prevent self-escalation, owner reassignment and grants beyond the administrator’s delegation ceiling."
    ],
    [
        "id" => "store_configurator",
        "name" => "Store configurator",
        "group" => "Review & administration",
        "purpose" => "Maintain store setup, printing, tax settings and locations.",
        "permissions" => [
        "admin.settings_view",
            "admin.settings_manage",
            "admin.receipt_print",
            "admin.taxes_methods",
            "admin.warehouses"
        ],
        "modules" => [
        "pos",
            "invoicing",
            "tax_compliance",
            "multi_location"
        ],
        "caution" => "Settings access does not authorize tax liabilities, sales revenue or financial statements."
    ],
    [
        "id" => "integration_operator",
        "name" => "Integration operator",
        "group" => "Review & administration",
        "purpose" => "Manage marketplace connections and stock sync without channel profit.",
        "permissions" => [
        "vensynq.manage",
            "inventory.view"
        ],
        "modules" => [
        "marketplace_sync",
            "products",
            "inventory"
        ],
        "caution" => ""
    ],
    [
        "id" => "operations_manager",
        "name" => "Operations manager",
        "group" => "Leadership",
        "purpose" => "Coordinate sales, inventory and purchasing without profit, bank or sensitive fund controls.",
        "permissions" => [
        "sales.view",
            "sales.create",
            "sales.edit",
            "sales.quotations",
            "purchases.view",
            "purchases.create",
            "purchases.edit",
            "inventory.view",
            "inventory.adjust",
            "inventory.transfer",
            "admin.staff_view",
            "reports.summary",
            "reports.performance",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
        "pos",
            "invoicing",
            "quotations",
            "products",
            "inventory",
            "multi_location",
            "stock_transfers",
            "suppliers",
            "purchases",
            "purchase_orders",
            "staff_attendance",
            "reports"
        ],
        "caution" => ""
    ],
    [
        "id" => "business_viewer",
        "name" => "Business performance viewer",
        "group" => "Leadership",
        "purpose" => "Read sales and staff performance without cost, profit or money balances.",
        "permissions" => [
        "reports.summary",
            "reports.performance"
        ],
        "modules" => [
        "reports",
            "pos",
            "invoicing",
            "staff_attendance"
        ],
        "caution" => ""
    ],
    [
        "id" => "waiter",
        "name" => "Waiter / floor staff",
        "group" => "Sales floor",
        "purpose" => "Take table, takeaway and delivery orders in the FOH screen and print the bill. No payments by default.",
        "permissions" => [
            "pos.open_session",
            "foh.access",
            "sales.view",
            "sales.create",
            "inventory.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.withdraw",
            "approvals.resubmit"
        ],
        "modules" => [
            "pos",
            "park_recall",
            "table_service",
            "products",
            "inventory"
        ],
        "caution" => "Cannot take payment: grant the 'Scan & Checkout' permission only to staff who handle money."
    ],
    [
        "id" => "owner",
        "name" => "Owner capability reference",
        "group" => "Leadership",
        "purpose" => "Reference showing all 78 explicit capabilities; do not assign as an ordinary staff default.",
        "permissions" => [
        "pos.open_session",
            "pos.checkout",
            "foh.access",
            "pos.discounts",
            "pos.void_item",
            "pos.refund",
            "pos.close_session",
            "sales.view",
            "sales.create",
            "sales.edit",
            "sales.void",
            "sales.quotations",
            "sales.returns",
            "inventory.view",
            "inventory.create",
            "inventory.edit",
            "inventory.delete",
            "inventory.adjust",
            "inventory.transfer",
            "inventory.barcodes",
            "purchases.view",
            "purchases.create",
            "purchases.edit",
            "purchases.void",
            "purchases.costs",
            "purchases.suppliers",
            "finance.balances",
            "finance.transactions",
            "finance.receive_payment",
            "finance.send_payment",
            "finance.expenses",
            "finance.journal",
            "reports.summary",
            "reports.financial",
            "reports.stock",
            "reports.performance",
            "reports.audit",
            "admin.staff_view",
            "admin.staff_manage",
            "admin.settings_view",
            "admin.settings_manage",
            "admin.receipt_print",
            "admin.taxes_methods",
            "admin.warehouses",
            "admin.data_recovery",
            "admin.billing_store",
            "approvals.view",
            "approvals.view_own",
            "approvals.submit",
            "approvals.inbox",
            "approvals.review",
            "approvals.approve",
            "approvals.reject",
            "approvals.return",
            "approvals.withdraw",
            "approvals.resubmit",
            "approvals.configure",
            "data.export",
            "records.force_delete",
            "users.manage",
            "vensynq.manage",
            "finance.customer_refund",
            "finance.supplier_refund",
            "purchases.returns",
            "finance.capital_add",
            "finance.owner_drawings",
            "finance.internal_transfer",
            "finance.balance_adjustment",
            "finance.cheque_books.view",
            "finance.cheque_books.manage",
            "finance.cheques.clear",
            "finance.cheques.override_duplicate",
            "finance.fiscal_year.view",
            "finance.fiscal_year.manage",
            "finance.fiscal_year.close",
            "finance.period_lock",
            "finance.period_reopen",
            "finance.period_exception"
        ],
        "modules" => [
        "products",
            "services",
            "customers",
            "suppliers",
            "pos",
            "invoicing",
            "quotations",
            "sales_orders",
            "sales_returns",
            "recurring_invoices",
            "b2b_proposals",
            "pricing_tiers",
            "park_recall",
            "table_service",
            "pre_sales",
            "inventory",
            "multi_location",
            "stock_transfers",
            "stock_takes",
            "batches_expiry",
            "serials",
            "variants",
            "barcodes_labels",
            "units_of_measure",
            "purchases",
            "purchase_orders",
            "purchase_returns",
            "landed_cost",
            "cookbook",
            "production_runs",
            "composite_items",
            "khata_credit",
            "payments",
            "expenses",
            "cash_register",
            "bank_accounts",
            "bank_reconciliation",
            "accounting_workspace",
            "tax_compliance",
            "fixed_assets",
            "loans",
            "reports",
            "ai_insights",
            "loyalty_gift",
            "marketplace_sync",
            "staff_attendance"
        ],
        "caution" => "Reference only. Existing owner semantics remain separate. Sensitive fund changes, permanent deletion, overrides and access delegation require their own execution controls."
    ]
];
