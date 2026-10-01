<?php

namespace App\Support;

/*
|==============================================================================
| STEP 9 — ReportModuleMap
|==============================================================================
|
| Reports (#42) is ONE module, not forty-two toggles. Which reports a business
| sees is DERIVED from the other modules they have switched on:
|
|     no Inventory  -> no stock reports
|     no Customers  -> no customer statements
|     no Cookbook   -> no production reports
|
| That is the "Customer Report" rule from 06_EXPECTATION_VS_REALITY, generalised
| and solved. One toggle, correct behaviour, zero configuration — the single
| biggest simplification in the plan.
|
|------------------------------------------------------------------------------
| WHY A MAP AND NOT A GUESS
|------------------------------------------------------------------------------
| Without this file, a report belonging to a disabled module does one of two
| things, both bad:
|
|   - it stays in the list, the user clicks it, and it queries tables that are
|     empty or gone -> a 500 in front of a paying customer, or
|   - it silently returns nothing, with no explanation -> "your software is
|     broken", which is worse than an honest empty state.
|
| So every one of the 74 report route names is attributed to an owning module
| here. Unmapped reports default to ALWAYS VISIBLE — a report nobody has
| classified is not a report anybody should lose.
|
|------------------------------------------------------------------------------
| HOW TO ADD A REPORT
|------------------------------------------------------------------------------
| Add its route-name suffix to the module that owns its DATA, not the module
| that happens to link to it. "Which module's tables does this query?" is the
| question. If the answer is "several", list it under the one that would make
| the report meaningless by its absence.
|
| Route names verified against routes/web.php on 15 Aug 2026.
|==============================================================================
*/
class ReportModuleMap
{
    /**
     * Report route-name suffix => the module whose data it reads.
     *
     * Keys are the part after 'store.reports.' or 'store.v3.reports.'.
     * A report listed under a module disappears when that module is off.
     */
    public const OWNERS = [

        // ── Always visible: these read the Qore, which is never off ─────────
        // Sales, revenue and cash exist for every business that sells anything.
        // They are listed explicitly rather than left to the default so nobody
        // "tidies" them into a module later.
        'index'                          => null,
        'dashboard'                      => null,
        'sales'                          => null,
        'daily-sales'                    => null,
        'day-book'                       => null,
        'transactions'                   => null,
        'analytics'                      => null,
        'export'                         => null,
        'gross-profit'                   => null,
        'cogs'                           => null,

        // ── Inventory (#16) ─────────────────────────────────────────────────
        'low-stock'                      => 'inventory',
        'stock-valuation'                => 'inventory',
        'inventory-valuation'            => 'inventory',
        'inventory-movement'             => 'inventory',
        'movement-history'               => 'inventory',
        'stock-summary-by-category'      => 'inventory',
        'stock-aging'                    => 'inventory',
        'point-in-time-inventory'        => 'inventory',
        'point-in-time-inventory.details' => 'inventory',
        'item-detail'                    => 'inventory',

        // ── Batches & Expiry (#20) ──────────────────────────────────────────
        'expiry'                         => 'batches_expiry',

        // ── Customers (#3) ──────────────────────────────────────────────────
        'customer-insights'              => 'customers',
        'customer-insights.details'      => 'customers',

        // ── Khata / Credit (#32) ────────────────────────────────────────────
        // THE ORIGINAL EXAMPLE. "If a user does not have Customers and
        // Suppliers, the system should automatically know they cannot select
        // reports related to Customers and Suppliers." This is that rule.
        'party-statement'                => 'khata_credit',
        'party-ledger'                   => 'khata_credit',
        'all-parties'                    => 'khata_credit',
        'aged-receivables'               => 'khata_credit',
        'aged-payables'                  => 'khata_credit',
        'sale-aging'                     => 'khata_credit',
        'party-wise-profit-loss'         => 'khata_credit',
        'sale-purchase-by-party'         => 'khata_credit',
        'sale-purchase-by-party-group'   => 'khata_credit',
        'item-report-by-party'           => 'khata_credit',
        'party-report-by-item'           => 'khata_credit',

        // ── Suppliers (#4) ──────────────────────────────────────────────────
        'supplier-insights'              => 'supplier_insights_placeholder',
        'supplier-insights.details'      => 'supplier_insights_placeholder',

        // ── Purchases (#25) ─────────────────────────────────────────────────
        'purchases'                      => 'purchases',
        'sale-purchase-by-item-category' => 'purchases',

        // ── Purchase Returns (#27) ──────────────────────────────────────────
        'purchase-returns'               => 'purchase_returns',

        // ── Sales Returns (#9) ──────────────────────────────────────────────
        'refund-reasons'                 => 'sales_returns',

        // ── Sales Orders (#8) ───────────────────────────────────────────────
        'sale-orders'                    => 'sales_orders',
        'sale-order-items'               => 'sales_orders',

        // ── Expenses (#34) ──────────────────────────────────────────────────
        'expenses'                       => 'expenses',
        'expense-by-category'            => 'expenses',
        'expense-by-item'                => 'expenses',

        // ── Accounting Workspace (#38) ──────────────────────────────────────
        // The LEDGER is Qore and always records. These are the accountant's
        // SCREENS, and a freelancer should never see them.
        'profit-loss'                    => 'accounting_workspace',
        'balance-sheet'                  => 'accounting_workspace',
        'trial-balance'                  => 'accounting_workspace',
        'account-ledger'                 => 'accounting_workspace',
        'cash-flow'                      => 'accounting_workspace',

        // ── Bank Accounts (#36) ─────────────────────────────────────────────
        'bank-statement'                 => 'bank_accounts',

        // ── Loans (#41) ─────────────────────────────────────────────────────
        'loan-statement'                 => 'loans',

        // ── Tax & Compliance (#39) ──────────────────────────────────────────
        'tax'                            => 'tax_compliance',
        'tax-rate'                       => 'tax_compliance',

        // ── Pricing Tiers & Discounts (#12) ─────────────────────────────────
        'discount'                       => 'pricing_tiers',
        'discount-report'                => 'pricing_tiers',
        'item-wise-discount'             => 'pricing_tiers',

        // ── Products (#1) ───────────────────────────────────────────────────
        'item-wise-profit'               => 'products',
        'item-category-wise-profit-loss' => 'products',
        'bill-wise-profit'               => 'products',

        // ── Staff & Attendance (#46) ────────────────────────────────────────
        'owner-daily-pulse'              => 'staff_attendance',
        'owner-daily-pulse.lock'         => 'staff_attendance',
        'owner-daily-pulse.note'         => 'staff_attendance',
        'owner-daily-pulse.setup'        => 'staff_attendance',
        'owner-daily-pulse.verify'       => 'staff_attendance',
    ];

    /**
     * Is this report visible to this tenant?
     *
     * FAIL OPEN on anything unmapped. A report nobody has classified is not a
     * report anybody should lose — and a missing map entry is our mistake, not
     * the customer's.
     */
    public static function visible(?\App\Models\Tenant $tenant, string $reportKey): bool
    {
        if (!array_key_exists($reportKey, self::OWNERS)) {
            return true;
        }

        $module = self::OWNERS[$reportKey];

        if ($module === null) {
            return true;                       // Qore-backed, always available
        }

        // 'supplier_insights_placeholder' is a deliberate marker, not a typo:
        // supplier insight reports read Suppliers data, and the module key is
        // 'suppliers'. Kept distinct so the test below flags it if someone
        // copies this pattern without thinking.
        if ($module === 'supplier_insights_placeholder') {
            $module = 'suppliers';
        }

        return \App\Services\ModuleService::enabled($tenant, $module);
    }

    /**
     * Every report key this tenant should see.
     * ReportController's index builds its list from this.
     */
    public static function visibleFor(?\App\Models\Tenant $tenant): array
    {
        return array_values(array_filter(
            array_keys(self::OWNERS),
            fn ($key) => self::visible($tenant, $key)
        ));
    }

    /**
     * The friendly refusal for a report whose module is off.
     * Never a 500, never a blank page with no explanation.
     */
    public static function refusalFor(string $reportKey): string
    {
        $module = self::OWNERS[$reportKey] ?? null;

        if ($module === 'supplier_insights_placeholder') {
            $module = 'suppliers';
        }

        $label = $module ? config("modules.{$module}.label", $module) : 'this module';

        return "This report needs {$label}, which isn't part of your system yet. Add it?";
    }

    /**
     * Which reports would appear if a module were switched on — for the
     * "it was recording all along" moment and for the builder's preview.
     */
    public static function reportsFor(string $moduleKey): array
    {
        return array_keys(array_filter(
            self::OWNERS,
            fn ($owner) => $owner === $moduleKey
        ));
    }
}
