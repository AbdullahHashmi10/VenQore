<?php

namespace Tests\Feature;

uses(VenQoreTestCase::class);

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Payment;
use App\Models\Account;
use App\Services\V3\AccountingService;
use App\Services\LedgerService;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-ledger-test', 'ltd_3');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
    
    // Resolve accounting service
    $this->accounting = app(AccountingService::class);
    
    // Create cash bank account (1010) and cash on hand (1000)
    $this->cashAccount = Account::where('tenant_id', $this->tenant->id)->where('code', '1000')->first();
    $this->bankAccount = Account::where('tenant_id', $this->tenant->id)->where('code', '1010')->first();
    
    // Make sure we have a bank account row in bank_accounts table
    $this->bankAccountDbId = DB::table('bank_accounts')
        ->where('tenant_id', $this->tenant->id)
        ->value('id');
});

// 1. Test 1: Customer Payment In (Standard)
test('customer payment in routes to 1200', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
        'current_balance' => 10000,
    ]);

    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => $customer->id,
        'amount' => 5000.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-101',
        'description' => 'Customer paid invoice',
    ]);

    $response->assertJson(['success' => true]);

    // Verify ledger
    $netBalance = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($netBalance)->toEqual(-5000.00); // 0 (AR debits) - 5000 (credit) = -5000
});

// 2. Test 2: Customer Payment Out (Customer Refund)
test('customer payment out routes to 1200', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
        'current_balance' => 10000,
    ]);

    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'out',
        'party_id' => $customer->id,
        'amount' => 2500.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-102',
        'description' => 'Customer refund paid',
    ]);

    $response->assertJson(['success' => true]);

    // Verify ledger (should debit 1200)
    $netBalance = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($netBalance)->toEqual(2500.00); // 2500 (debit) - 0 (credits) = 2500
});

// 3. Test 3: Supplier Payment Out (Standard)
test('supplier payment out routes to 2000', function () {
    $supplier = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'opening_balance' => 0,
        'current_balance' => -10000,
    ]);

    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'out',
        'party_id' => $supplier->id,
        'amount' => 4000.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-103',
        'description' => 'Supplier paid',
    ]);

    $response->assertJson(['success' => true]);

    // Verify ledger (should debit 2000)
    $netBalance = LedgerService::partyNetBalance($supplier->id, $this->tenant->id, 'supplier');
    expect($netBalance)->toEqual(-4000.00); // AP is credit normal. Debit on AP reduces balance.
});

// 4. Test 4: Supplier Payment In (Supplier Refund)
test('supplier payment in routes to 2000', function () {
    $supplier = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'opening_balance' => 0,
        'current_balance' => -10000,
    ]);

    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => $supplier->id,
        'amount' => 1500.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-104',
        'description' => 'Supplier refunded us',
    ]);

    $response->assertJson(['success' => true]);

    // Verify ledger (should credit 2000)
    $netBalance = LedgerService::partyNetBalance($supplier->id, $this->tenant->id, 'supplier');
    expect($netBalance)->toEqual(1500.00); // Credit on AP increases what we owe or reduces credit.
});

// 5. Test 5: Validation Block for Untracked/Stranded Payments
test('payment without party fails validation', function () {
    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => '', // missing party
        'amount' => 500.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-105',
    ]);

    $response->assertSessionHasErrors(['party_id']);
});

// 6. Test 6: Multi-Tenant Ledger Isolation
test('multitenant ledger isolation', function () {
    $tenantB = $this->createTenant('store-ledger-test-2', 'ltd_3');
    $this->seedTenantDefaults($tenantB);

    $customerA = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Perform payment in Tenant A
    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => $customerA->id,
        'amount' => 3000.00,
        'payment_method' => 'cash',
        'reference' => 'TXN-A',
    ]);
    $response->assertJson(['success' => true]);

    // Check balance in Tenant A
    $balA = LedgerService::partyNetBalance($customerA->id, $this->tenant->id, 'customer');
    expect($balA)->toEqual(-3000.00);

    // Check that Tenant B ledger is empty
    $arB = Account::where('tenant_id', $tenantB->id)->where('code', '1200')->value('id');
    $itemsCountB = DB::table('journal_items')
        ->where('tenant_id', $tenantB->id)
        ->where('account_id', $arB)
        ->count();
    expect($itemsCountB)->toEqual(0);
});

// 7. Test 7: Total Receivables Widget & Ledger Reconciler
test('total receivables widget matches ledger', function () {
    $customer1 = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);
    $customer2 = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Add AR debit entries via manual journal entry to simulate sales
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'sale',
        'party_id' => $customer1->id,
    ], [
        ['account_code' => '1200', 'debit' => 8000.00, 'credit' => 0, 'party_id' => $customer1->id],
        ['account_code' => '4000', 'debit' => 0, 'credit' => 8000.00],
    ]);

    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'sale',
        'party_id' => $customer2->id,
    ], [
        ['account_code' => '1200', 'debit' => 4500.00, 'credit' => 0, 'party_id' => $customer2->id],
        ['account_code' => '4000', 'debit' => 0, 'credit' => 4500.00],
    ]);

    // Get total from widget endpoint
    $response = $this->get(route('store.parties.index', ['store_slug' => $this->tenant->slug]));
    $stats = $response->original->getData()['page']['props']['stats'];
    
    expect((float)$stats['receivables'])->toEqual(12500.00);
});

// 8. Test 8: Total Payables Widget & Ledger Reconciler
test('total payables widget matches ledger', function () {
    $supplier = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'opening_balance' => 0,
    ]);

    // Add AP credit entry via manual journal entry to simulate purchase
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'purchase',
        'party_id' => $supplier->id,
    ], [
        ['account_code' => '1100', 'debit' => 6000.00, 'credit' => 0],
        ['account_code' => '2000', 'debit' => 0, 'credit' => 6000.00, 'party_id' => $supplier->id],
    ]);

    // Get total from widget endpoint
    $response = $this->get(route('store.parties.index', ['store_slug' => $this->tenant->slug]));
    $stats = $response->original->getData()['page']['props']['stats'];
    
    expect((float)$stats['payables'])->toEqual(6000.00);
});

// 9. Test 9: Netting Prevention (No Negative Offset)
test('payables widget prevent negative netting', function () {
    $supplier1 = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'opening_balance' => 0,
    ]);
    $supplier2 = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'opening_balance' => 0,
    ]);

    // Supplier 1 we owe money (Credit on 2000)
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'purchase',
        'party_id' => $supplier1->id,
    ], [
        ['account_code' => '1100', 'debit' => 5000.00, 'credit' => 0],
        ['account_code' => '2000', 'debit' => 0, 'credit' => 5000.00, 'party_id' => $supplier1->id],
    ]);

    // Supplier 2 overpaid / refunded (Debit on 2000)
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'supplier_refund',
        'party_id' => $supplier2->id,
    ], [
        ['account_code' => '2000', 'debit' => 7000.00, 'credit' => 0, 'party_id' => $supplier2->id],
        ['account_code' => '1000', 'debit' => 0, 'credit' => 7000.00],
    ]);

    // Net sum of account 2000: Credit (5000) - Debit (7000) = -2000.
    // The payables widget should show max(0, net) which is 0.00.
    $response = $this->get(route('store.parties.index', ['store_slug' => $this->tenant->slug]));
    $stats = $response->original->getData()['page']['props']['stats'];
    
    expect((float)$stats['payables'])->toEqual(0.00);
});

// 10. Test 10: Zero-Sum Reversal Integrity
test('payment reversal restores balance to the penny', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Create payment
    $response = $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => $customer->id,
        'amount' => 1234.56,
        'payment_method' => 'cash',
        'reference' => 'TXN-REV',
    ]);
    $response->assertJson(['success' => true]);

    $net1 = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($net1)->toEqual(-1234.56);

    // Find the journal entry
    $entry = JournalEntry::where('reference_type', 'payment')
        ->where('party_id', $customer->id)
        ->first();
    
    // Reverse the entry
    $this->accounting->reverseEntry($entry->id, 'Reversing test payment');

    $net2 = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($net2)->toEqual(0.00);
});

// 11. Test 11: Cashier POS Register Payment Integration
test('cashier pos split payment updates khata', function () {
    // Act as Cashier
    $cashier = $this->createTenantUser($this->tenant, 'cashier');
    $this->actingAsTenantUserModel($cashier, $this->tenant);

    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Create a POS sale with split payment: cash and credit/khata leg
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'sale',
        'party_id' => $customer->id,
    ], [
        ['account_code' => '1000', 'debit' => 300.00, 'credit' => 0], // paid cash leg
        ['account_code' => '1200', 'debit' => 700.00, 'credit' => 0, 'party_id' => $customer->id], // credit/khata leg
        ['account_code' => '4000', 'debit' => 0, 'credit' => 1000.00], // total sales revenue
    ]);

    // Verify customer ledger balance updated correctly
    $netBalance = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($netBalance)->toEqual(700.00);
});

// 12. Test 12: Multi-Currency Decimal Precision Reconciliation
test('multi currency decimal precision reconciliation', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Post fractional amounts to the cent/paisa (e.g. 100.33)
    $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'sale',
        'party_id' => $customer->id,
    ], [
        ['account_code' => '1200', 'debit' => 100.33, 'credit' => 0, 'party_id' => $customer->id],
        ['account_code' => '4000', 'debit' => 0, 'credit' => 100.33],
    ]);

    // Pay with precise fraction (e.g. 50.11)
    $this->post(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
        'date' => now()->toDateString(),
        'type' => 'in',
        'party_id' => $customer->id,
        'amount' => 50.11,
        'payment_method' => 'cash',
        'reference' => 'TXN-FRAC',
    ])->assertJson(['success' => true]);

    // Check precision (100.33 - 50.11 = 50.22)
    $net = LedgerService::partyNetBalance($customer->id, $this->tenant->id, 'customer');
    expect($net)->toEqual(50.22);
});

// 13. Test 13: Zero-Value Ledger Lines Are Skipped Safely
test('zero value ledger lines are skipped safely', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
    ]);

    // Create entry containing a zero-value line item (representing e.g. 0% tax or rounded zero)
    $entry = $this->accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'sale',
        'party_id' => $customer->id,
    ], [
        ['account_code' => '1200', 'debit' => 500.00, 'credit' => 0, 'party_id' => $customer->id],
        ['account_code' => '4000', 'debit' => 0, 'credit' => 500.00],
        ['account_code' => '2050', 'debit' => 0.00, 'credit' => 0.00], // zero line
    ]);

    expect($entry)->toBeObject();
    
    // Verify zero line was filtered out and not inserted into database
    $itemsCount = DB::table('journal_items')
        ->where('journal_entry_id', $entry->id)
        ->count();
    expect($itemsCount)->toEqual(2); // Only 1200 and 4000 should be created
});

// 14. Test 14: Four Decimal Precision Formatting Support
test('four decimal precision formatting support', function () {
    // Override decimal places to 4 in settings
    DB::table('settings')->updateOrInsert(
        ['tenant_id' => $this->tenant->id, 'key' => 'decimal_places'],
        ['value' => '4']
    );
    \App\Helpers\SettingsHelper::clearCacheForTenant($this->tenant->id);

    // Format number using SettingsHelper
    $formattedValue = \App\Helpers\SettingsHelper::formatCurrency(1234.5678, false);
    expect($formattedValue)->toEqual('1,234.5678');
});
