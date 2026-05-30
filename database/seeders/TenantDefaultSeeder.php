<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\BankAccount;
use App\Models\Setting;
use App\Models\ExpenseCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * TenantDefaultSeeder — Unified Phase 2.2
 *
 * Seeds every new tenant with sane defaults so they land on a
 * working system, not a blank slate.
 */
class TenantDefaultSeeder
{
    public static function seedFor(Tenant $tenant): void
    {
        // Bind tenant so HasTenant global scope works if models are used
        app()->instance('current.tenant', $tenant);

        static::seedChartOfAccounts($tenant);
        static::seedDefaultSettings($tenant);
        static::seedDefaultWarehouse($tenant);
        static::seedExpenseCategories($tenant);
        static::seedInitialCashAccount($tenant);
    }

    private static function seedChartOfAccounts(Tenant $tenant): void
    {
        $accounts = [
            // Assets (1xxx) — aligned with SaleController::postSaleJournal() codes
            ['code' => '1000', 'name' => 'Cash in Hand',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '1010', 'name' => 'Bank Account',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '1100', 'name' => 'Inventory Asset',          'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '1200', 'name' => 'Accounts Receivable',      'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '1300', 'name' => 'Prepaid Expenses',         'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '1500', 'name' => 'Fixed Assets',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],

            // Liabilities (2xxx)
            ['code' => '2000', 'name' => 'Accounts Payable',         'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '2050', 'name' => 'Customer Credit Balances', 'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '2100', 'name' => 'Sales Tax Payable',        'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '2200', 'name' => 'Loans Payable',            'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '2300', 'name' => 'Input Tax Recoverable',    'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit'],

            // Equity (3xxx)
            ['code' => '3000', 'name' => "Owner's Capital",          'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '3100', 'name' => 'Retained Earnings',        'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '3999', 'name' => 'Historical Variance',      'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit'],

            // Revenue (4xxx) — credit-normal: positive balance = credit > debit
            ['code' => '4000', 'name' => 'Sales Revenue',            'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '4100', 'name' => 'Other Income',             'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit'],
            ['code' => '4900', 'name' => 'Round Off Income',         'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit'],

            // Expenses (5xxx) — debit-normal: positive balance = debit > credit
            ['code' => '5000', 'name' => 'Cost of Goods Sold',       'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '5100', 'name' => 'Salaries & Wages',         'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '5200', 'name' => 'Rent Expense',             'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '5300', 'name' => 'Utilities',                'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '5400', 'name' => 'Marketing',                'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '5900', 'name' => 'Round Off Expense',        'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
            ['code' => '6000', 'name' => 'Operating Expenses',       'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit'],
        ];

        $now = now();
        foreach ($accounts as $account) {
            DB::table('accounts')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'code' => $account['code']],
                [
                    'id'             => (string) Str::uuid(),
                    'name'           => $account['name'],
                    'type'           => $account['type'],
                    'balance'        => $account['balance'],
                    'normal_balance' => $account['normal_balance'],
                    'is_active'      => true,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]
            );
        }
    }

    private static function seedDefaultSettings(Tenant $tenant): void
    {
        $defaults = [
            'store_name'           => $tenant->name,
            'currency_symbol'      => $tenant->currency_symbol ?: 'Rs.',
            'currency_code'        => $tenant->currency_code ?: 'PKR',
            'decimal_places'       => '2',
            'tax_rate'             => '0',
            'timezone'             => $tenant->timezone ?: 'Asia/Karachi',
            'invoice_prefix'       => 'INV-',
            'receipt_footer'       => 'Thank you for your business!',
            'setup_completed'      => '0',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(
                ['tenant_id' => $tenant->id, 'key' => $key],
                ['value' => (string) $value]
            );
        }
    }

    private static function seedDefaultWarehouse(Tenant $tenant): void
    {
        Warehouse::updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse'],
            ['location' => 'Main Location', 'is_default' => true]
        );
    }

    private static function seedExpenseCategories(Tenant $tenant): void
    {
        $categories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Miscellaneous'];
        foreach ($categories as $name) {
            ExpenseCategory::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                ['is_active' => true]
            );
        }
    }

    private static function seedInitialCashAccount(Tenant $tenant): void
    {
        // ONE single Cash Account record linked to the tenant
        BankAccount::updateOrCreate(
            ['tenant_id' => $tenant->id, 'type' => 'cash'],
            [
                'name'            => 'Cash in Hand',
                'current_balance' => 0,
                'account_type'    => 'Default',
            ]
        );
    }
}
