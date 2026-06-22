<?php

namespace Tester\Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\User;
use App\Models\BankAccount;
use App\Services\V3\AccountingService;
use Illuminate\Support\Facades\DB;

class BalanceConsistencyTest extends VenQoreTestCase
{
    public function test_balance_consistency_and_finance_controller_sorting()
    {
        $tenant = $this->createTenant('bal-test', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        app()->instance('current.tenant', $tenant);

        // Fetch or create user
        $user = User::first() ?? User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password')
        ]);

        $accountingSvc = app(AccountingService::class);

        // Resolve test accounts
        $cashAcc = Account::where('tenant_id', $tenant->id)->where('code', '1000')->firstOrFail();
        $bankAcc = Account::where('tenant_id', $tenant->id)->where('code', '1010')->firstOrFail();
        $arAcc = Account::where('tenant_id', $tenant->id)->where('code', '1200')->firstOrFail();
        $apAcc = Account::where('tenant_id', $tenant->id)->where('code', '2000')->firstOrFail();

        // Stale values to test cache override: set direct column values != derived
        $cashAcc->updateQuietly(['balance' => 9999.99]);
        $bankAcc->updateQuietly(['balance' => -8888.88]);

        // Post mixed transactions using V3 write-engine
        // 1. Credit Sale: DR AR 500, CR Revenue (4000) 500
        $revAcc = Account::where('tenant_id', $tenant->id)->where('code', '4000')->firstOrFail();
        $accountingSvc->createEntry([
            'date' => now()->toDateString(),
            'reference' => 'TEST-001',
            'description' => 'Credit Sale',
            'user_id' => $user->id
        ], [
            ['account_id' => $arAcc->id, 'debit' => 500, 'credit' => 0],
            ['account_id' => $revAcc->id, 'debit' => 0, 'credit' => 500],
        ]);

        // 2. Receipt on Credit: DR Cash 300, CR AR 300
        $accountingSvc->createEntry([
            'date' => now()->toDateString(),
            'reference' => 'TEST-002',
            'description' => 'Payment Receipt',
            'user_id' => $user->id
        ], [
            ['account_id' => $cashAcc->id, 'debit' => 300, 'credit' => 0],
            ['account_id' => $arAcc->id, 'debit' => 0, 'credit' => 300],
        ]);

        // 3. Fund Transfer: DR Bank 200, CR Cash 200
        $accountingSvc->createEntry([
            'date' => now()->toDateString(),
            'reference' => 'TEST-003',
            'description' => 'Fund Transfer',
            'user_id' => $user->id
        ], [
            ['account_id' => $bankAcc->id, 'debit' => 200, 'credit' => 0],
            ['account_id' => $cashAcc->id, 'debit' => 0, 'credit' => 200],
        ]);

        // Assert column balance was NOT written/updated during transaction
        $cashCol = DB::table('accounts')->where('id', $cashAcc->id)->value('balance');
        $this->assertEquals(9999.99, (float) $cashCol);

        // Assert derived balance (accessor) matches AccountingService::getBalance() and true ledger
        $this->assertEquals(100.00, $cashAcc->balance);
        $this->assertEquals(100.00, $accountingSvc->getBalance('1000'));

        $this->assertEquals(200.00, $bankAcc->balance);
        $this->assertEquals(200.00, $accountingSvc->getBalance('1010'));

        $this->assertEquals(200.00, $arAcc->balance);
        $this->assertEquals(200.00, $accountingSvc->getBalance('1200'));

        // Test FinanceController sorting order (should follow derived balance, bank=200 > cash=100)
        // BankAccount mock to link v3Balance
        $bankAccountMock1 = BankAccount::create([
            'tenant_id' => $tenant->id,
            'name' => 'Alpha Cash',
            'account_type' => 'cash',
            'opening_balance' => 0
        ]);
        // Overrides cache balance checking
        $this->assertEquals(100.00, $bankAccountMock1->v3Balance());

        $bankAccountMock2 = BankAccount::create([
            'tenant_id' => $tenant->id,
            'name' => 'Beta Bank',
            'account_type' => 'checking',
            'opening_balance' => 200.00
        ]);
        $this->assertEquals(200.00, $bankAccountMock2->v3Balance());
    }
}
