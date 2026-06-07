<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ASSETS (1000)
            ['code' => '1000', 'name' => 'Cash on Hand', 'type' => 'asset'],
            ['code' => '1010', 'name' => 'Bank Account', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'Inventory', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset'],

            // LIABILITIES (2000)
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'Sales Tax Payable', 'type' => 'liability'],

            // EQUITY (3000)
            ['code' => '3000', 'name' => 'Owner\'s Capital', 'type' => 'equity'],
            ['code' => '3100', 'name' => 'Owner\'s Drawings', 'type' => 'equity'],
            ['code' => '3200', 'name' => 'Retained Earnings', 'type' => 'equity'],

            // INCOME (4000)
            ['code' => '4000', 'name' => 'Sales Income', 'type' => 'income'],
            ['code' => '4100', 'name' => 'Service Income', 'type' => 'income'],

            // EXPENSES (5000)
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense'],
            ['code' => '5100', 'name' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5200', 'name' => 'Electricity Expense', 'type' => 'expense'],
            ['code' => '5300', 'name' => 'Staff Salaries', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            Account::updateOrCreate(['code' => $account['code']], $account);
        }
    }
}
