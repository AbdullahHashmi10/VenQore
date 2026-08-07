<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\BankAccount;
use Illuminate\Support\Str;

class DemoBankAccountSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoBankAccountSeeder.");
            return;
        }

        $accounts = [
            ['name' => 'Main Current Account', 'account_number' => '123456789012', 'bank_name' => 'Chase Business', 'balance' => 45000],
            ['name' => 'Business Savings', 'account_number' => '987654321098', 'bank_name' => 'Bank of America', 'balance' => 12000],
            ['name' => 'Merchant Gateway Account', 'account_number' => 'STRIPE-001', 'bank_name' => 'Stripe', 'balance' => 8000],
            ['name' => 'Petty Cash Drawer', 'account_number' => 'CASH-001', 'bank_name' => 'In Store', 'balance' => 340],
        ];

        foreach ($accounts as $acc) {
            BankAccount::updateOrCreate(
                ['tenant_id' => $tenantId, 'name' => $acc['name']],
                [
                    'id' => Str::uuid()->toString(),
                    'account_number' => $acc['account_number'],
                    'bank_name' => $acc['bank_name'],
                    'current_balance' => $acc['balance'],
                ]
            );
        }

        $this->command->info("✓ 4 Bank Accounts seeded with simulated balances.");
    }
}
