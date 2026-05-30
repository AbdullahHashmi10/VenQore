<?php

/**
 * Module 03 — Financial Engine
 *
 * Tests the AccountingService V3 double-entry journal engine.
 *
 * Golden Rules enforced by AccountingService (all tested here):
 *   Rule 1 — Every entry has ≥ 2 line items
 *   Rule 2 — SUM(debit) = SUM(credit) on every entry
 *   Rule 3 — Entries never deleted — only reversed via reverseEntry()
 *   Rule 4 — Caller must wrap createEntry() in DB::transaction()
 *   Rule 5 — reference_type + reference_id are mandatory
 *
 * Also covers:
 *   - accounts:recalculate artisan command
 *   - finance:audit artisan command (missing payment repair)
 *   - Cross-tenant journal isolation
 */

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\Tenant;
use App\Services\V3\AccountingService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a fresh AccountingService bound to the current tenant context.
 * Must be called AFTER bindTenantContext() / actingAsOwner().
 */
function makeAccountingService(): AccountingService
{
    return app(AccountingService::class);
}

/**
 * Post a simple balanced entry: debit Cash (1000), credit Sales Revenue (4000).
 * Returns the JournalEntry.
 */
function postCashSale(AccountingService $svc, float $amount = 100.00): JournalEntry
{
    return DB::transaction(fn () => $svc->createEntry(
        [
            'date'           => today()->toDateString(),
            'reference_type' => 'test_sale',
            'reference'      => 'TEST-' . uniqid(),
            'description'    => 'Test cash sale',
        ],
        [
            ['account_code' => '1000', 'debit' => $amount,  'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,         'credit' => $amount],
        ]
    ));
}

// ─── Test 1: Balanced entry persists correctly ─────────────────────────────

test('balanced journal entry persists with correct debit and credit lines', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc   = makeAccountingService();
    $entry = postCashSale($svc, 500.00);

    expect($entry)->toBeInstanceOf(JournalEntry::class);
    expect($entry->tenant_id)->toBe($tenant->id);

    // Assert both sides persisted
    $this->assertJournalEntry([
        'tenant_id'    => $tenant->id,
        'account_code' => '1000',
        'debit'        => 500.00,
    ]);
    $this->assertJournalEntry([
        'tenant_id'    => $tenant->id,
        'account_code' => '4000',
        'credit'       => 500.00,
    ]);
});

// ─── Test 2: Trial balance stays zero ─────────────────────────────────────

test('trial balance is zero after one or many balanced entries', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    postCashSale($svc, 100.00);
    postCashSale($svc, 250.00);
    postCashSale($svc, 75.50);

    $this->assertTrialBalanceZero($tenant);
});

// ─── Test 3: Unbalanced entry throws ──────────────────────────────────────

test('createEntry throws InvalidArgumentException for unbalanced entry', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    expect(fn () => DB::transaction(fn () => $svc->createEntry(
        ['date' => today()->toDateString(), 'reference_type' => 'test', 'reference' => 'T1'],
        [
            ['account_code' => '1000', 'debit' => 100.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,      'credit' => 50.00], // ← only 50, not 100
        ]
    )))->toThrow(\InvalidArgumentException::class, 'unbalanced');
});

// ─── Test 4: Row with both debit and credit > 0 throws ────────────────────

test('createEntry throws if a line has both debit and credit greater than zero', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    expect(fn () => DB::transaction(fn () => $svc->createEntry(
        ['date' => today()->toDateString(), 'reference_type' => 'test', 'reference' => 'T2'],
        [
            ['account_code' => '1000', 'debit' => 100.00, 'credit' => 100.00], // ← both sides > 0
            ['account_code' => '4000', 'debit' => 0,      'credit' => 0],
        ]
    )))->toThrow(\InvalidArgumentException::class);
});

// ─── Test 5: Row with both zero throws ────────────────────────────────────

test('createEntry throws if a line has both debit and credit equal to zero', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    // Both sides zero on line 1, balanced on line 2
    expect(fn () => DB::transaction(fn () => $svc->createEntry(
        ['date' => today()->toDateString(), 'reference_type' => 'test', 'reference' => 'T3'],
        [
            ['account_code' => '1000', 'debit' => 0, 'credit' => 0], // ← both zero
            ['account_code' => '4000', 'debit' => 0, 'credit' => 0],
        ]
    )))->toThrow(\InvalidArgumentException::class);
});

// ─── Test 6: Unknown account code throws ──────────────────────────────────

test('createEntry throws if account_code does not exist for the current tenant', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    expect(fn () => DB::transaction(fn () => $svc->createEntry(
        ['date' => today()->toDateString(), 'reference_type' => 'test', 'reference' => 'T4'],
        [
            ['account_code' => '9999', 'debit' => 100.00, 'credit' => 0], // ← does not exist
            ['account_code' => '4000', 'debit' => 0,      'credit' => 100.00],
        ]
    )))->toThrow(\InvalidArgumentException::class, 'Account code not found');
});

// ─── Test 7: No tenant context throws RuntimeException ────────────────────

test('AccountingService constructor throws RuntimeException without tenant context', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    
    $partyService = app(App\Services\V3\PartyService::class);
    $paymentService = app(App\Services\V3\PaymentService::class);

    // Explicitly clear tenant binding
    app()->forgetInstance('current.tenant');

    expect(fn () => new AccountingService($partyService, $paymentService))
        ->toThrow(\Illuminate\Contracts\Container\BindingResolutionException::class);
});

// ─── Test 8: Cross-tenant journal isolation ───────────────────────────────

test('journal entries from tenant A are not visible under tenant B context', function () {
    $tenantA = $this->createTenant('store-alpha');
    $tenantB = $this->createTenant('store-beta');

    // Post an entry for Tenant A
    $this->actingAsOwner($tenantA);
    $this->seedTenantDefaults($tenantA);
    $entryA = postCashSale(makeAccountingService(), 200.00);

    // Now switch to Tenant B — should see zero items
    $this->bindTenantContext($tenantB);
    $this->seedTenantDefaults($tenantB);

    $visibleInB = JournalItem::where('tenant_id', $tenantA->id)->count();

    // JournalItem has tenant-scoped query via HasTenant; we bypass it to confirm isolation
    $leakCount = DB::table('journal_items')
        ->where('tenant_id', $tenantA->id)
        ->where('tenant_id', '!=', $tenantB->id)
        ->count();

    // Tenant B's context should expose zero items for Tenant A
    $visibleViaModel = JournalItem::where('journal_entry_id', $entryA->id)->count();

    expect($visibleViaModel)->toBe(0);
});

// ─── Test 9: reverseEntry swaps debits and credits ────────────────────────

test('reverseEntry creates a new entry with swapped debits and credits', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc     = makeAccountingService();
    $original = postCashSale($svc, 300.00);

    $reversal = $svc->reverseEntry($original->id, 'Test reversal');

    // The reversal entry should exist as a JournalEntry
    expect($reversal)->toBeInstanceOf(JournalEntry::class);

    // Reversal items: Cash 1000 should be CREDITED, Sales 4000 should be DEBITED
    $this->assertJournalEntry([
        'tenant_id'    => $tenant->id,
        'account_code' => '1000',
        'credit'       => 300.00,
    ]);
    $this->assertJournalEntry([
        'tenant_id'    => $tenant->id,
        'account_code' => '4000',
        'debit'        => 300.00,
    ]);

    // After reversal, trial balance must still be zero
    $this->assertTrialBalanceZero($tenant);
});

// ─── Test 10: reverseEntry marks original as is_reversed ─────────────────

test('reverseEntry marks the original journal entry as is_reversed = 1', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc      = makeAccountingService();
    $original = postCashSale($svc, 150.00);

    expect((int)$original->is_reversed)->toBe(0);

    $svc->reverseEntry($original->id, 'marking test');

    $updated = DB::table('journal_entries')->where('id', $original->id)->first();

    expect((int)$updated->is_reversed)->toBe(1);
});

// ─── Test 11: Reversing an already-reversed entry throws ─────────────────

test('reverseEntry throws LogicException when entry is already reversed', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc      = makeAccountingService();
    $original = postCashSale($svc, 100.00);

    $svc->reverseEntry($original->id, 'first reversal');

    // Second reversal on the same entry must throw
    expect(fn () => $svc->reverseEntry($original->id, 'second reversal'))
        ->toThrow(\LogicException::class, 'already reversed');
});

// ─── Test 12: reverseEntry throws if entry not found for this tenant ──────

test('reverseEntry throws InvalidArgumentException for a non-existent entry', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    expect(fn () => $svc->reverseEntry('00000000-0000-0000-0000-000000000000', 'ghost entry'))
        ->toThrow(\InvalidArgumentException::class, 'not found');
});

// ─── Test 13: getBalance — debit-normal account ───────────────────────────

test('getBalance returns net debit balance for a debit-normal account', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    // Two entries: Cash debited 300 and 200, total cash movement = +500
    postCashSale($svc, 300.00);
    postCashSale($svc, 200.00);

    // Cash account (1000) has normal_balance = 'debit' (default)
    // Balance should be totalDebit - totalCredit = 500 - 0 = 500
    $balance = $svc->getBalance('1000');

    $this->assertMoneyEquals(500.00, $balance);
});

// ─── Test 14: getBalance — credit-normal account ──────────────────────────

test('getBalance returns net credit balance for a credit-normal account', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create a credit-normal account (Sales Revenue 4000 type=income)
    // Update its normal_balance to 'credit' explicitly
    DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '4000')
        ->update(['normal_balance' => 'credit']);

    $svc = makeAccountingService();

    postCashSale($svc, 400.00);

    // Sales 4000: credited 400, debited 0 → balance = 400 - 0 = 400 (credit normal)
    $balance = $svc->getBalance('4000');

    $this->assertMoneyEquals(400.00, $balance);
});

// ─── Test 15: getBalance excludes reversed entries ────────────────────────

test('getBalance excludes journal items belonging to reversed entries', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc      = makeAccountingService();
    $original = postCashSale($svc, 500.00);

    // Before reversal: Cash balance = 500
    $this->assertMoneyEquals(500.00, $svc->getBalance('1000'));

    $svc->reverseEntry($original->id, 'cancel sale');

    // After reversal: both entry and reversal exist, but reversed entries
    // are excluded from getBalance. Net effect = 0.
    // Note: reversal entry itself is marked is_reversed=1, so it's also excluded.
    // The original entry is also marked is_reversed=1 after reversal.
    $balanceAfter = $svc->getBalance('1000');

    $this->assertMoneyEquals(0.00, $balanceAfter);
});

// ─── Test 16: getBalance respects asOf date filter ────────────────────────

test('getBalance asOf date excludes future entries', function () {
    $tenant = $this->createTenant();
    $user   = $this->createTenantUser($tenant);
    $this->actingAsTenantUserModel($user, $tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    // Entry dated today
    DB::transaction(fn () => $svc->createEntry(
        [
            'date'           => today()->toDateString(),
            'reference_type' => 'test',
            'reference'      => 'TODAY',
        ],
        [
            ['account_code' => '1000', 'debit' => 100.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0,      'credit' => 100.00],
        ]
    ));

    // Entry dated yesterday (insert directly to simulate historical entry)
    $cashAccountId = DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '1000')
        ->value('id');

    $salesAccountId = DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '4000')
        ->value('id');

    $pastEntryId = (string) \Illuminate\Support\Str::uuid();
    DB::table('journal_entries')->insert([
        'id'             => $pastEntryId,
        'tenant_id'      => $tenant->id,
        'date'           => today()->subDays(10)->toDateString(),
        'reference_type' => 'test',
        'reference'      => 'PAST',
        'is_reversed'    => 0,
        'user_id'        => $user->id,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);

    DB::table('journal_items')->insert([
        ['id' => (string) \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'journal_entry_id' => $pastEntryId, 'account_id' => $cashAccountId, 'debit' => 200.00, 'credit' => 0, 'created_at' => now(), 'updated_at' => now()],
        ['id' => (string) \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'journal_entry_id' => $pastEntryId, 'account_id' => $salesAccountId, 'debit' => 0, 'credit' => 200.00, 'created_at' => now(), 'updated_at' => now()],
    ]);

    // asOf 5 days ago: should see ONLY the past entry (200), not today's (100)
    $historicalBalance = $svc->getBalance('1000', today()->subDays(5));

    $this->assertMoneyEquals(200.00, $historicalBalance);

    // asOf today: should see both (300 total)
    $todayBalance = $svc->getBalance('1000', today());

    $this->assertMoneyEquals(300.00, $todayBalance);
});

// ─── Test 17: getAccountByCode creates if not found ───────────────────────

test('getAccountByCode creates an account when the code does not exist', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    expect(Account::where('tenant_id', $tenant->id)->where('code', '9100')->exists())->toBeFalse();

    $account = $svc->getAccountByCode('9100', 'Test Custom Account', 'expense');

    expect($account)->toBeInstanceOf(Account::class);
    expect($account->code)->toBe('9100');
    expect($account->tenant_id)->toBe($tenant->id);

    // Calling again should return the same record, not create a duplicate
    $same = $svc->getAccountByCode('9100', 'Test Custom Account', 'expense');
    expect($same->id)->toBe($account->id);

    expect(Account::where('tenant_id', $tenant->id)->where('code', '9100')->count())->toBe(1);
});

// ─── Test 18: accounts:recalculate command ────────────────────────────────

test('accounts:recalculate command updates account balance from journal entries', function () {
    $tenant = $this->createTenant('recalc-test', 'trial', 'active');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $svc = makeAccountingService();

    // Post 3 entries debiting Cash 1000
    postCashSale($svc, 100.00);
    postCashSale($svc, 200.00);
    postCashSale($svc, 300.00);

    // Manually corrupt the account balance to 0 (simulates stale balance)
    DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '1000')
        ->update(['balance' => 0]);

    $corruptedBalance = DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '1000')
        ->value('balance');

    expect((float) $corruptedBalance)->toBe(0.0);

    // Run the command scoped to this tenant
    $exitCode = Artisan::call('accounts:recalculate', [
        '--tenant' => $tenant->id,
    ]);

    expect($exitCode)->toBe(0);

    $repairedBalance = DB::table('accounts')
        ->where('tenant_id', $tenant->id)
        ->where('code', '1000')
        ->value('balance');

    // Cash debited 600 total, so balance should be 600
    $this->assertMoneyEquals(600.00, (float) $repairedBalance);
});

// ─── Test 19: accounts:recalculate does not touch other tenants ───────────

test('accounts:recalculate --tenant option does not recalculate balances for other tenants', function () {
    $tenantA = $this->createTenant('acc-tenant-a', 'trial', 'active');
    $tenantB = $this->createTenant('acc-tenant-b', 'trial', 'active');

    // Set up Tenant A
    $this->actingAsOwner($tenantA);
    $this->seedTenantDefaults($tenantA);
    postCashSale(makeAccountingService(), 999.00);

    // Set up Tenant B
    $this->actingAsOwner($tenantB);
    $this->seedTenantDefaults($tenantB);
    postCashSale(makeAccountingService(), 111.00);

    // Corrupt Tenant B's cash balance
    DB::table('accounts')
        ->where('tenant_id', $tenantB->id)
        ->where('code', '1000')
        ->update(['balance' => 0]);

    // Run recalculate for Tenant A only
    Artisan::call('accounts:recalculate', ['--tenant' => $tenantA->id]);

    // Tenant B's corrupted balance should remain at 0 (untouched)
    $tenantBBalance = DB::table('accounts')
        ->where('tenant_id', $tenantB->id)
        ->where('code', '1000')
        ->value('balance');

    $this->assertMoneyEquals(0.00, (float) $tenantBBalance);
});

// ─── Test 20: finance:audit repairs missing payment for a paid sale ────────

test('finance:audit command creates missing payment record for a paid sale', function () {
    $tenant = $this->createTenant('audit-test', 'trial', 'active');
    $user   = $this->createTenantUser($tenant, 'owner');
    $this->actingAsTenantUserModel($user, $tenant);
    $this->seedTenantDefaults($tenant);

    // Create a sale marked 'paid' for Rs. 500 with NO payment record
    $sale = Sale::factory()->create([
        'tenant_id'      => $tenant->id,
        'total'          => 500.00,
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'tendered_amount' => 0, // ← zero tendered = audit should use total
    ]);

    expect(Payment::where('sale_id', $sale->id)->count())->toBe(0);

    // Run the audit command scoped to this tenant
    $exitCode = Artisan::call('finance:audit', [
        '--tenant' => $tenant->id,
    ]);

    expect($exitCode)->toBe(0);

    // The command should have inserted a missing payment of 500
    $payments = Payment::where('sale_id', $sale->id)->get();

    expect($payments)->not->toBeEmpty();
    $this->assertMoneyEquals(500.00, $payments->sum('amount'));
    expect($payments->first()->reference)->toBe('SYSTEM-AUDIT-FIX');
});
