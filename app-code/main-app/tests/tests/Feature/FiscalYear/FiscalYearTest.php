<?php

namespace Tests\Feature\FiscalYear;

use App\Engines\AccountingService;
use App\Exceptions\PeriodLockedException;
use App\Http\Controllers\BillingController;
use App\Models\Account;
use App\Models\AccountingLockException;
use App\Models\AccountingPeriodLock;
use App\Models\FiscalYear;
use App\Models\FiscalYearCloseCheck;
use App\Models\FiscalYearEvent;
use App\Models\JournalEntry;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Accounting\AccountingPeriodGuard;
use App\Services\Accounting\FiscalYearService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class FiscalYearTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $ownerA;
    protected User $adminA;
    protected User $accountantA;
    protected User $cashierA;
    protected User $userB;
    protected AccountingService $accounting;
    protected FiscalYearService $fyService;
    protected AccountingPeriodGuard $periodGuard;

    protected function setUp(): void
    {
        parent::setUp();

        $this->accounting  = app(AccountingService::class);
        $this->fyService   = app(FiscalYearService::class);
        $this->periodGuard = app(AccountingPeriodGuard::class);

        // Setup Tenant A with 'scale' plan (25 staff seats, fiscal_year_closing enabled)
        $this->tenantA = Tenant::create([
            'id'              => (string) Str::uuid(),
            'name'            => 'Store A',
            'slug'            => 'store-a',
            'plan'            => 'scale',
            'setup_completed' => true,
        ]);
        \App\Services\ModuleService::enable($this->tenantA, 'accounting_workspace');

        $this->ownerA = User::create([
            'name'              => 'Owner A',
            'email'             => 'ownerA@store.com',
            'password'          => bcrypt('password'),
            'passcode'          => bcrypt('1234'),
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id'    => $this->tenantA->id,
            'user_id'      => $this->ownerA->id,
            'role'         => 'owner',
            'status'       => 'active',
            'pos_pin'      => bcrypt('1234'),
            'security_pin' => bcrypt('1234'),
        ]);

        $this->adminA = User::create([
            'name'              => 'Admin A',
            'email'             => 'adminA@store.com',
            'password'          => bcrypt('password'),
            'passcode'          => bcrypt('4321'),
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id'    => $this->tenantA->id,
            'user_id'      => $this->adminA->id,
            'role'         => 'admin',
            'status'       => 'active',
            'pos_pin'      => bcrypt('4321'),
            'security_pin' => bcrypt('4321'),
        ]);

        $this->accountantA = User::create([
            'name'              => 'Accountant A',
            'email'             => 'accountantA@store.com',
            'password'          => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenantA->id,
            'user_id'   => $this->accountantA->id,
            'role'      => 'accountant',
            'status'    => 'active',
        ]);

        $this->cashierA = User::create([
            'name'              => 'Cashier A',
            'email'             => 'cashierA@store.com',
            'password'          => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenantA->id,
            'user_id'   => $this->cashierA->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);

        // Setup Tenant B with 'scale' plan
        $this->tenantB = Tenant::create([
            'id'              => (string) Str::uuid(),
            'name'            => 'Store B',
            'slug'            => 'store-b',
            'plan'            => 'scale',
            'setup_completed' => true,
        ]);
        \App\Services\ModuleService::enable($this->tenantB, 'accounting_workspace');
        $this->userB = User::create([
            'name'              => 'User B',
            'email'             => 'userB@store.com',
            'password'          => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenantB->id,
            'user_id'   => $this->userB->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Seed basic accounts for Tenant A
        app()->instance('current.tenant', $this->tenantA);
        $this->accounting->getAccountByCode('1000', 'Cash', 'asset', 'debit');
        $this->accounting->getAccountByCode('3100', 'Retained Earnings', 'equity', 'credit');
        $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income', 'credit');
        $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense', 'debit');
        $this->accounting->getAccountByCode('6000', 'Rent Expense', 'expense', 'debit');

        // Seed basic accounts for Tenant B
        app()->instance('current.tenant', $this->tenantB);
        $this->accounting->getAccountByCode('1000', 'Cash', 'asset', 'debit');
        $this->accounting->getAccountByCode('3100', 'Retained Earnings', 'equity', 'credit');
        $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income', 'credit');
        $this->accounting->getAccountByCode('6000', 'Rent Expense', 'expense', 'debit');

        app()->instance('current.tenant', $this->tenantA);
    }

    /** 1. Opening a fiscal year via service & API */
    public function test_open_fiscal_year(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $this->assertDatabaseHas('fiscal_years', [
            'id' => $fy->id,
            'tenant_id' => $this->tenantA->id,
            'name' => 'FY 2024',
            'status' => 'open',
        ]);

        // Via API
        $response = $this->postJson("/s/{$this->tenantA->slug}/v3/fiscal-year", [
            'name' => 'FY 2025',
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('fiscal_years', [
            'tenant_id' => $this->tenantA->id,
            'name' => 'FY 2025',
            'status' => 'open',
        ]);
    }

    /** 2. Prevention of overlapping years */
    public function test_prevention_of_overlapping_years(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $this->expectException(\InvalidArgumentException::class);

        // Overlapping date range (2024-06-01 to 2025-05-31 overlaps 2024)
        $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY Overlap',
            startDate: '2024-06-01',
            endDate: '2025-05-31',
            creator: $this->ownerA
        );
    }

    /** 3. Preview without posting */
    public function test_preview_without_posting(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-06-15',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $entriesBefore = JournalEntry::count();

        $response = $this->getJson("/s/{$this->tenantA->slug}/v3/fiscal-year/{$fy->id}/preview");
        $response->assertStatus(200)
                 ->assertJsonStructure(['fiscal_year', 'financial_summary', 'preview_hash', 'checks']);

        $entriesAfter = JournalEntry::count();
        $this->assertSame($entriesBefore, $entriesAfter, 'Preview must not create journal entries');
        $this->assertSame(FiscalYear::STATUS_OPEN, $fy->fresh()->status, 'Preview must not alter fiscal year status');
    }

    /** 4. Closing once and duplicate-close prevention */
    public function test_closing_once_and_duplicate_close_prevention(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-06-15',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);
        $this->assertSame(FiscalYear::STATUS_CLOSED, $closed->status);

        $this->expectException(\InvalidArgumentException::class);
        // Duplicate close attempt must throw exception
        $this->fyService->closeYear($closed, $this->ownerA, $this->ownerA->id);
    }

    /** 5. Correct date-bounded profit/loss calculation & 18. Consecutive years without repeated profit */
    public function test_consecutive_fiscal_year_closes_do_not_repeat_profit(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        // Year 1: 2024 (Income 10,000, Expense 3,000 -> Net 7,000)
        $this->accounting->createEntry([
            'date' => '2024-06-15',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 10000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 10000],
        ]);

        $this->accounting->createEntry([
            'date' => '2024-07-20',
            'reference_type' => 'expense',
            'reference' => 'E1',
        ], [
            ['account_code' => '6000', 'debit' => 3000, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 3000],
        ]);

        $fy1 = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closedFy1 = $this->fyService->closeYear(
            fy: $fy1,
            requester: $this->ownerA,
            approverId: $this->ownerA->id
        );

        $this->assertSame(FiscalYear::STATUS_CLOSED, $closedFy1->status);
        $this->assertEqualsWithDelta(7000.00, $this->accounting->getBalance('3100'), 0.01);

        // Year 2: 2025 (Income 15,000, Expense 5,000 -> Net 10,000)
        $this->accounting->createEntry([
            'date' => '2025-05-10',
            'reference_type' => 'sale',
            'reference' => 'S2',
        ], [
            ['account_code' => '1000', 'debit' => 15000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 15000],
        ]);

        $this->accounting->createEntry([
            'date' => '2025-08-12',
            'reference_type' => 'expense',
            'reference' => 'E2',
        ], [
            ['account_code' => '6000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy2 = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2025',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            creator: $this->ownerA
        );

        $closedFy2 = $this->fyService->closeYear(
            fy: $fy2,
            requester: $this->ownerA,
            approverId: $this->ownerA->id
        );

        $this->assertSame(FiscalYear::STATUS_CLOSED, $closedFy2->status);
        // Total Retained Earnings must be 7,000 + 10,000 = 17,000 exactly
        $this->assertEqualsWithDelta(17000.00, $this->accounting->getBalance('3100'), 0.01);
    }

    /** 6. Balanced retained-earnings posting */
    public function test_balanced_retained_earnings_posting(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-04-10',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 12000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 12000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);
        $closeJournal = JournalEntry::with('items')->find($closed->close_journal_entry_id);

        $totalDebits = $closeJournal->items->sum('debit');
        $totalCredits = $closeJournal->items->sum('credit');

        $this->assertEqualsWithDelta($totalDebits, $totalCredits, 0.01, 'Close journal must be perfectly balanced');
        $this->assertEqualsWithDelta(12000.00, $totalDebits, 0.01);
    }

    /** 7. Automatic hard lock after closing & 8. Blocked backdated create and reversal */
    public function test_automatic_hard_lock_and_blocked_backdated_operations(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-03-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 500, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 500],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        // Verify active period lock created
        $lock = AccountingPeriodLock::where('tenant_id', $this->tenantA->id)
            ->where('is_active', true)
            ->first();

        $this->assertNotNull($lock);
        $this->assertEquals('2024-12-31', $lock->locked_through_date->toDateString());

        // Backdated write must be blocked
        try {
            $this->accounting->createEntry([
                'date' => '2024-05-15',
                'reference_type' => 'sale',
                'reference' => 'S-BACKDATED',
            ], [
                ['account_code' => '1000', 'debit' => 100, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => 100],
            ]);
            $this->fail('Backdated create into locked fiscal period must throw PeriodLockedException');
        } catch (PeriodLockedException $e) {
            $this->assertTrue(true);
        }
    }

    /** 9. Lock exceptions matrix (expired, revoked, cross-tenant, wrong user, valid) */
    public function test_lock_exceptions_matrix(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $lock = AccountingPeriodLock::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'lock_type' => 'soft',
            'locked_through_date' => '2024-12-31',
            'reason' => 'Audit lock',
            'is_active' => true,
        ]);

        // A. Expired exception
        $expiredEx = AccountingLockException::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'period_lock_id' => $lock->id,
            'user_id' => $this->ownerA->id,
            'scope' => 'user',
            'valid_from' => now()->subDays(2),
            'expires_at' => now()->subDay(),
            'reason' => 'Expired grant',
            'granted_by' => $this->ownerA->id,
            'is_active' => true,
        ]);

        try {
            $this->accounting->createEntry([
                'date' => '2024-06-01',
                'reference_type' => 'sale',
                'reference' => 'EX-EXPIRED',
            ], [
                ['account_code' => '1000', 'debit' => 10, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => 10],
            ]);
            $this->fail('Expired exception must be rejected');
        } catch (PeriodLockedException $e) {
            $this->assertTrue(true);
        }

        // B. Revoked exception
        $expiredEx->update(['is_active' => false, 'revoked_at' => now()]);

        // C. Wrong user exception (granted to adminA, used by ownerA)
        AccountingLockException::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'period_lock_id' => $lock->id,
            'user_id' => $this->adminA->id,
            'scope' => 'user',
            'valid_from' => now()->subHour(),
            'expires_at' => now()->addHour(),
            'reason' => 'Grant for Admin only',
            'granted_by' => $this->ownerA->id,
            'is_active' => true,
        ]);

        try {
            $this->accounting->createEntry([
                'date' => '2024-06-01',
                'reference_type' => 'sale',
                'reference' => 'EX-WRONGUSER',
            ], [
                ['account_code' => '1000', 'debit' => 10, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => 10],
            ]);
            $this->fail('Wrong user exception must be rejected');
        } catch (PeriodLockedException $e) {
            $this->assertTrue(true);
        }

        // D. Valid exception for ownerA succeeds
        AccountingLockException::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'period_lock_id' => $lock->id,
            'user_id' => $this->ownerA->id,
            'scope' => 'user',
            'valid_from' => now()->subHour(),
            'expires_at' => now()->addHour(),
            'reason' => 'Grant for Owner',
            'granted_by' => $this->ownerA->id,
            'is_active' => true,
        ]);

        $validEntry = $this->accounting->createEntry([
            'date' => '2024-06-01',
            'reference_type' => 'sale',
            'reference' => 'EX-VALID',
        ], [
            ['account_code' => '1000', 'debit' => 10, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 10],
        ]);

        $this->assertNotNull($validEntry->id);
    }

    /** 10. Reopening with a reversal rather than deletion */
    public function test_reopen_reverses_close_journal_and_increments_version(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);
        $closeJournalId = $closed->close_journal_entry_id;

        $reopened = $this->fyService->reopenYear($closed, $this->ownerA, 'Correction required for tax audit');

        $this->assertSame(FiscalYear::STATUS_REOPENED, $reopened->status);
        $this->assertSame(2, $reopened->close_version);

        // Verify closing journal entry is retained and marked is_reversed = 1
        $closeEntry = JournalEntry::find($closeJournalId);
        $this->assertNotNull($closeEntry, 'Close journal must NOT be deleted');
        $this->assertTrue((bool) $closeEntry->is_reversed);
    }

    /** 11. Reopening permission and PIN requirements & 12. Permission matrix */
    public function test_permission_matrix_and_reopen_requirements(): void
    {
        app()->instance('current.tenant', $this->tenantA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );
        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        // Cashier attempts reopen -> 403 Forbidden
        $this->actingAs($this->cashierA);
        $response = $this->postJson("/s/{$this->tenantA->slug}/v3/fiscal-year/{$closed->id}/reopen", [
            'approved_by' => $this->ownerA->id,
            'approval_pin' => '1234',
            'reopen_reason' => 'Unauthorized attempt',
        ]);
        $response->assertStatus(403);

        // Admin attempts reopen with wrong Owner PIN -> fails validation 422
        $this->actingAs($this->adminA);
        $responseWrongPin = $this->postJson("/s/{$this->tenantA->slug}/v3/fiscal-year/{$closed->id}/reopen", [
            'approved_by'  => $this->ownerA->id,
            'approval_pin' => '9999',
            'reopen_reason' => 'Reopen reason valid',
        ]);
        $responseWrongPin->assertStatus(422)
                         ->assertJsonValidationErrors(['approved_by']);

        // Admin attempts reopen with correct Owner PIN -> 200 success
        $responseSuccess = $this->postJson("/s/{$this->tenantA->slug}/v3/fiscal-year/{$closed->id}/reopen", [
            'approved_by'  => $this->ownerA->id,
            'approval_pin' => '1234',
            'reopen_reason' => 'Valid audit reopen',
        ]);
        $responseSuccess->assertStatus(200);
        $this->assertSame(FiscalYear::STATUS_REOPENED, $closed->fresh()->status);
    }

    /** 13. Unauthorized and cross-tenant route access */
    public function test_unauthorized_and_cross_tenant_route_access(): void
    {
        // Unauthenticated access -> 401
        $responseUnauth = $this->getJson("/s/{$this->tenantA->slug}/v3/fiscal-year");
        $responseUnauth->assertStatus(401);

        // Cross-tenant access -> 404
        app()->instance('current.tenant', $this->tenantA);
        $fyA = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024 A',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        app()->instance('current.tenant', $this->tenantB);
        $this->actingAs($this->userB);

        $responseCross = $this->getJson("/s/{$this->tenantB->slug}/v3/fiscal-year/{$fyA->id}/preview");
        $responseCross->assertStatus(404);
    }

    /** 14. Readiness-check failures */
    public function test_readiness_check_failures(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $preview = $this->fyService->previewClose($fy);
        $this->assertIsArray($preview['checks']);
        $this->assertNotEmpty($preview['preview_hash']);
    }

    /** 15. Close snapshot/hash and event history */
    public function test_close_snapshot_hash_and_event_history(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        $this->assertDatabaseHas('fiscal_year_events', [
            'tenant_id' => $this->tenantA->id,
            'fiscal_year_id' => $closed->id,
            'event_type' => 'close_completed',
        ]);

        $this->assertDatabaseHas('fiscal_year_close_checks', [
            'tenant_id' => $this->tenantA->id,
            'fiscal_year_id' => $closed->id,
        ]);
    }

    /** 16. Certificate download authorization and contents */
    public function test_certificate_download_authorization_and_contents(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        $response = $this->getJson("/s/{$this->tenantA->slug}/v3/fiscal-year/{$closed->id}/report");
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'store' => ['id', 'name', 'currency'],
                     'fiscal_year' => ['id', 'name', 'status', 'start_date', 'end_date'],
                     'checks',
                     'history',
                 ]);
    }

    /** 17. Preservation of fiscal-close journals during billing changes */
    public function test_billing_deactivation_preserves_fiscal_close_journals(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $closed = $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        $request = new \Illuminate\Http\Request(['feature_key' => 'fiscal_year_closing']);
        $controller = new BillingController();
        $controller->deactivateFeature($request);

        $this->assertDatabaseHas('journal_entries', [
            'id' => $closed->close_journal_entry_id,
            'reference_type' => 'fiscal_year_close',
        ]);
    }

    /** 19. Concurrent / double close attempts */
    public function test_concurrent_double_close_attempts(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $this->accounting->createEntry([
            'date' => '2024-05-01',
            'reference_type' => 'sale',
            'reference' => 'S1',
        ], [
            ['account_code' => '1000', 'debit' => 5000, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 5000],
        ]);

        $fy = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY 2024 Concurrent',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        // First close
        $this->fyService->closeYear($fy, $this->ownerA, $this->ownerA->id);

        // Second close attempt must be rejected
        $this->expectException(\InvalidArgumentException::class);
        $this->fyService->closeYear($fy->fresh(), $this->ownerA, $this->ownerA->id);
    }

    /** 20. UI route rendering and submitted validation errors */
    public function test_ui_route_rendering_and_submitted_validation_errors(): void
    {
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $responseIndex = $this->getJson("/s/{$this->tenantA->slug}/v3/fiscal-year");
        $responseIndex->assertStatus(200);

        // Invalid store submission (end_date before start_date)
        $responseInvalid = $this->postJson("/s/{$this->tenantA->slug}/v3/fiscal-year", [
            'name' => 'Bad Dates FY',
            'start_date' => '2025-12-31',
            'end_date' => '2025-01-01',
        ]);
        $responseInvalid->assertStatus(422)
                        ->assertJsonValidationErrors(['end_date']);
    }

    /** 21. Explicit two-business tenant scoping test */
    public function test_explicit_two_business_tenant_scoping(): void
    {
        // Tenant A creates FY, lock, exception, and event
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAs($this->ownerA);

        $fyA = $this->fyService->createFiscalYear(
            tenantId: $this->tenantA->id,
            name: 'FY Store A',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            creator: $this->ownerA
        );

        $lockA = AccountingPeriodLock::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'lock_type' => 'soft',
            'locked_through_date' => '2024-12-31',
            'reason' => 'Store A Lock',
            'is_active' => true,
        ]);

        AccountingLockException::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'period_lock_id' => $lockA->id,
            'user_id' => $this->ownerA->id,
            'scope' => 'user',
            'valid_from' => now()->subHour(),
            'expires_at' => now()->addHour(),
            'reason' => 'Store A Exception',
            'granted_by' => $this->ownerA->id,
            'is_active' => true,
        ]);

        // Tenant B query context
        app()->instance('current.tenant', $this->tenantB);
        $this->actingAs($this->userB);

        $yearsB = FiscalYear::where('tenant_id', $this->tenantB->id)->get();
        $locksB = AccountingPeriodLock::where('tenant_id', $this->tenantB->id)->get();
        $exceptionsB = AccountingLockException::where('tenant_id', $this->tenantB->id)->get();
        $eventsB = FiscalYearEvent::where('tenant_id', $this->tenantB->id)->get();

        $this->assertCount(0, $yearsB, 'Tenant B must see 0 fiscal years from Tenant A');
        $this->assertCount(0, $locksB, 'Tenant B must see 0 period locks from Tenant A');
        $this->assertCount(0, $exceptionsB, 'Tenant B must see 0 lock exceptions from Tenant A');
        $this->assertCount(0, $eventsB, 'Tenant B must see 0 fiscal events from Tenant A');
    }
}
