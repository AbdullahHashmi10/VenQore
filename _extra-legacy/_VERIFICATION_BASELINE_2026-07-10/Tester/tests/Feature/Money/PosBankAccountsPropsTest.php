<?php

use App\Models\BankAccount;
use Illuminate\Support\Facades\DB;

test('POS interface receives user-created bank accounts in props', function () {
    $tenant = $this->createTenant('pos-bank-props-store', 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Clear any seeded bank accounts from defaults to make test clean
    BankAccount::query()->where('tenant_id', $tenant->id)->delete();

    // Create custom tenant bank accounts
    $bank1 = BankAccount::create([
        'tenant_id' => $tenant->id,
        'name' => 'Alfalah Bank Ltd',
        'account_number' => '1234-5678',
        'type' => 'bank',
        'opening_balance' => 1000.00,
        'current_balance' => 1000.00,
    ]);

    $bank2 = BankAccount::create([
        'tenant_id' => $tenant->id,
        'name' => 'JazzCash Wallet',
        'account_number' => '03001234567',
        'type' => 'mobile_wallet',
        'opening_balance' => 500.00,
        'current_balance' => 500.00,
    ]);

    // Hit the POS route
    $response = $this->get("/s/{$tenant->slug}/pos");
    $response->assertOk();

    $props = $response->viewData('page')['props'];

    $this->assertArrayHasKey('bankAccounts', $props);
    
    $bankAccountProps = $props['bankAccounts'];
    $this->assertCount(2, $bankAccountProps);

    $propIds = collect($bankAccountProps)->pluck('id')->all();
    $this->assertContains($bank1->id, $propIds);
    $this->assertContains($bank2->id, $propIds);

    $propNames = collect($bankAccountProps)->pluck('name')->all();
    $this->assertContains('Alfalah Bank Ltd', $propNames);
    $this->assertContains('JazzCash Wallet', $propNames);
});
