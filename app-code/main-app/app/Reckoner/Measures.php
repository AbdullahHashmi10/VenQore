<?php

namespace App\Reckoner;

/**
 * The ~58 base measures calculated in the Reckoner daily rollup.
 * Source of truth: Section 2.4 of VENQORE_RECKONER_AND_ONBOARDING_BUILD_SPEC.md.
 */
final class Measures
{
    public const ALL = [
        // Financial & P&L
        'revenue', 'cogs', 'gross_profit', 'expenses', 'net_profit', 'service_revenue', 'labour_cost',
        // Cash & Banking
        'tax_out', 'tax_in', 'cash_in', 'cash_out', 'bank_balance', 'cash_balance', 'liquidity',
        // Ledger & Balances
        'receivables', 'payables', 'khata_out', 'khata_in', 'khata_collected',
        // Stock & Inventory
        'stock_value', 'stock_units', 'dead_stock_value', 'expiring_value', 'transfer_in_transit',
        // Sales volume & transactions
        'sale_count', 'sale_units', 'discount_given', 'returns_value', 'returns_count',
        // Purchasing
        'purchase_value', 'purchase_count', 'purchase_returns_value', 'landed_cost_added',
        // Parties / CRM
        'new_customers', 'active_customers', 'dormant_customers', 'new_suppliers',
        // Manufacturing & Production
        'production_cost', 'production_output', 'production_waste',
        // Staff & Attendance
        'attendance_hours', 'attendance_present',
        // Documents in Flight
        'open_orders_value', 'open_orders_count', 'open_po_value', 'open_po_count',
        'unpaid_invoice_value', 'overdue_invoice_value', 'quote_value', 'quote_won_value',
        // Hospitality & Retail Ops
        'recurring_value', 'covers', 'table_turns', 'till_variance',
        // Accounting Integrity & Assets
        'journal_count', 'txn_count', 'asset_depreciation', 'loan_outstanding',
        'loan_interest', 'unreconciled_value', 'loyalty_points_issued', 'loyalty_points_redeemed',
    ];

    public static function all(): array
    {
        return self::ALL;
    }

    public static function count(): int
    {
        return count(self::ALL);
    }
}
