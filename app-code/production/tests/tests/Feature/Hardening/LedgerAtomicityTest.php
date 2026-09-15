<?php

namespace Tests\Feature\Hardening;

use App\Engines\AccountingService;
use App\Engines\PartyService;
use App\Models\Tenant;
use App\Services\V3\SettlementService;
use Database\Seeders\TenantDefaultSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Ledger atomicity + chart-provisioning hardening.
 *
 *  1. AccountingService::createEntry() is atomic on its own and validates
 *     (accounts, balance) before writing — a failed call leaves no header.
 *  2. B27 final settlement works on a REAL new store's chart
 *     (TenantDefaultSeeder::seedFor), which lacks 6100 / 2400 / 6800 / 1350.
 *  3. The other posting paths that used codes absent from the default chart
 *     (loans 2500/6500, depreciation 6600/1510, donations 6200) provision them.
 *
 * Guard: after EVERY test, the whole database is scanned for journal_entries
 * that have no journal_items (assertPostConditions).
 */
class LedgerAtomicityTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant(null, 'ltd_3', 'active');
        $this->actingAsOwner($this->tenant);
        // The exact store-creation code path — not a hand-seeded chart.
        TenantDefaultSeeder::seedFor($this->tenant);

        $this->accounting = app(AccountingService::class);
    }

    /** Guard: no journal entry anywhere in the DB may be line-less. */
    protected function assertPostConditions(): void
    {
        $orphans = DB::table('journal_entries as je')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('journal_items as ji')
                  ->whereColumn('ji.journal_entry_id', 'je.id');
            })
            ->pluck('je.id')
            ->all();

        $this->assertSame([], $orphans, 'journal_entries without journal_items: ' . implode(', ', $orphans));
    }

    private function tenantJournalCounts(): array
    {
        return [
            DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count(),
            DB::table('journal_items')->where('tenant_id', $this->tenant->id)->count(),
        ];
    }

    private function assertLedgerUntouched(): void
    {
        $this->assertSame([0, 0], $this->tenantJournalCounts(), 'A failed createEntry() left rows behind.');
    }

    // ─── 1. createEntry atomicity ─────────────────────────────────────────

    /** @test */
    public function missing_account_code_leaves_no_journal_rows(): void
    {
        $this->assertSame(0, DB::transactionLevel() - 1, 'precondition: no caller transaction besides the test wrapper');

        try {
            $this->accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-MISSING', 'description' => 'missing code'],
                [
                    ['account_code' => '1000', 'debit' => 100, 'credit' => 0],
                    ['account_code' => '9876', 'debit' => 0, 'credit' => 100], // not in the chart
                ]
            );
            $this->fail('Expected InvalidArgumentException for a missing account code.');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('9876', $e->getMessage());
        }

        $this->assertLedgerUntouched();
    }

    /** @test */
    public function missing_account_code_on_first_line_leaves_no_journal_rows(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        try {
            $this->accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-MISSING-1'],
                [
                    ['account_code' => '9876', 'debit' => 50, 'credit' => 0],
                    ['account_code' => '1000', 'debit' => 0, 'credit' => 50],
                ]
            );
        } finally {
            $this->assertLedgerUntouched();
        }
    }

    /** @test */
    public function unknown_account_id_leaves_no_journal_rows(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        try {
            $this->accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-BADID'],
                [
                    ['account_code' => '1000', 'debit' => 10, 'credit' => 0],
                    ['account_id' => (string) Str::uuid(), 'debit' => 0, 'credit' => 10],
                ]
            );
        } finally {
            $this->assertLedgerUntouched();
        }
    }

    /** @test */
    public function unbalanced_lines_leave_no_journal_rows(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('unbalanced');
        try {
            $this->accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-UNBAL'],
                [
                    ['account_code' => '1000', 'debit' => 100, 'credit' => 0],
                    ['account_code' => '4000', 'debit' => 0, 'credit' => 99],
                ]
            );
        } finally {
            $this->assertLedgerUntouched();
        }
    }

    /** @test */
    public function empty_line_set_leaves_no_journal_rows(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        try {
            $this->accounting->createEntry(['reference_type' => 'manual', 'reference' => 'LA-EMPTY'], []);
        } finally {
            $this->assertLedgerUntouched();
        }
    }

    /** @test */
    public function failure_after_the_header_is_written_rolls_the_whole_entry_back(): void
    {
        // A failure in the write phase itself (here: the party snapshot rebuild,
        // which runs after header + lines are inserted) must not leave a
        // partial entry either — createEntry() owns its own transaction.
        app()->instance(PartyService::class, new class extends PartyService {
            public function rebuildSnapshot(string|int $partyId, ?string $accountCode = null): void
            {
                throw new \RuntimeException('snapshot boom');
            }
        });
        $accounting = app(AccountingService::class);

        try {
            $accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-WRITEFAIL'],
                [
                    ['account_code' => '1200', 'debit' => 25, 'credit' => 0, 'party_id' => (string) Str::uuid()],
                    ['account_code' => '4000', 'debit' => 0, 'credit' => 25],
                ]
            );
            $this->fail('Expected RuntimeException from the snapshot rebuild.');
        } catch (\RuntimeException $e) {
            $this->assertSame('snapshot boom', $e->getMessage());
        }

        $this->assertLedgerUntouched();
        $this->assertSame(1, DB::transactionLevel(), 'createEntry() must not leak a transaction level.');
    }

    /** @test */
    public function a_failed_nested_entry_rolls_back_only_its_own_savepoint(): void
    {
        DB::transaction(function () {
            $this->accounting->createEntry(
                ['reference_type' => 'manual', 'reference' => 'LA-OK'],
                [
                    ['account_code' => '1000', 'debit' => 70, 'credit' => 0],
                    ['account_code' => '4000', 'debit' => 0, 'credit' => 70],
                ]
            );

            try {
                $this->accounting->createEntry(
                    ['reference_type' => 'manual', 'reference' => 'LA-BAD'],
                    [
                        ['account_code' => '1000', 'debit' => 5, 'credit' => 0],
                        ['account_code' => '9876', 'debit' => 0, 'credit' => 5],
                    ]
                );
            } catch (\InvalidArgumentException) {
                // caller chose to continue
            }
        });

        $this->assertSame([1, 2], $this->tenantJournalCounts());
        $this->assertSame(0, DB::table('journal_entries')->where('reference', 'LA-BAD')->count());
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test */
    public function a_valid_entry_without_a_caller_transaction_still_posts(): void
    {
        $entry = $this->accounting->createEntry(
            ['reference_type' => 'manual', 'reference' => 'LA-HAPPY'],
            [
                ['account_code' => '1000', 'debit' => 120.005, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => 120.005],
            ]
        );

        $this->assertSame([1, 2], $this->tenantJournalCounts());
        $this->assertDatabaseHas('journal_entries', ['id' => $entry->id, 'reference' => 'LA-HAPPY']);
        $this->assertTrialBalanceZero($this->tenant);
        $this->assertSame(1, DB::transactionLevel());
    }

    // ─── 2. B27 on a real new store's chart ───────────────────────────────

    private function seedEmployee(): string
    {
        $id = (string) Str::uuid();
        DB::table('employees')->insert([
            'id'             => $id,
            'tenant_id'      => $this->tenant->id,
            'name'           => 'Hardening Employee',
            'monthly_salary' => 30000,
            'hire_date'      => now()->subYear()->toDateString(),
            'status'         => 'active',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }

    private function account(string $code): ?object
    {
        return DB::table('accounts')->where('tenant_id', $this->tenant->id)->where('code', $code)->first();
    }

    /** @test */
    public function b27_final_settlement_posts_on_a_default_seeded_store(): void
    {
        // Precondition: the default chart really lacks these accounts.
        foreach (['6100', '6800', '2400', '1350'] as $code) {
            $this->assertNull($this->account($code), "default chart unexpectedly has {$code}");
        }

        $employeeId = $this->seedEmployee();

        app(SettlementService::class)->processSettlement([
            'employee_id'          => $employeeId,
            'settlement_date'      => now()->toDateString(),
            'payment_method'       => 'bank',
            'partial_month_salary' => 15000,
            'gratuity'             => 20000,
            'notice_pay'           => 5000,
            'leave_encashment'     => 2000,
            'advance_deduction'    => 3000,
        ]);

        $expected = [
            '6100' => ['expense',   'debit'],
            '6800' => ['expense',   'debit'],
            '2400' => ['liability', 'credit'],
            '1350' => ['asset',     'debit'],
        ];
        foreach ($expected as $code => [$type, $normal]) {
            $acct = $this->account($code);
            $this->assertNotNull($acct, "{$code} was not provisioned");
            $this->assertSame($type, $acct->type, "{$code} type");
            $this->assertSame($normal, $acct->normal_balance, "{$code} normal_balance");
        }
        $this->assertSame('Gratuity & Severance', $this->account('6800')->name);
        $this->assertSame('Salary Payable', $this->account('2400')->name);

        $this->assertJournalLinesExactly((string) $employeeId, [
            // accrual
            ['account_code' => '6100', 'debit' => 15000, 'credit' => 0],
            ['account_code' => '6800', 'debit' => 27000, 'credit' => 0],
            ['account_code' => '2400', 'debit' => 0,     'credit' => 42000],
            // payment
            ['account_code' => '2400', 'debit' => 42000, 'credit' => 0],
            ['account_code' => '1010', 'debit' => 0,     'credit' => 39000],
            ['account_code' => '1350', 'debit' => 0,     'credit' => 3000],
        ], $this->tenant);

        $this->assertSame(2, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count());
        $this->assertTrialBalanceZero($this->tenant);
        $this->assertSame('terminated', DB::table('employees')->where('id', $employeeId)->value('status'));

        // Running payroll-style provisioning again must not duplicate accounts.
        $this->accounting->getAccountByCode('2400', 'Salary Payable', 'liability');
        $this->assertSame(1, DB::table('accounts')->where('tenant_id', $this->tenant->id)->where('code', '2400')->count());
    }

    // ─── 3. Other paths that used codes missing from the default chart ────

    /** @test */
    public function loan_drawdown_and_repayment_post_on_a_default_seeded_store(): void
    {
        $this->post($this->storeUrl($this->tenant, 'v3/loans/drawdown'), [
            'description'    => 'Bank loan',
            'drawdown_date'  => now()->toDateString(),
            'principal'      => 50000,
            'payment_method' => 'bank',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->post($this->storeUrl($this->tenant, 'v3/loans/repay'), [
            'description'    => 'First instalment',
            'repayment_date' => now()->toDateString(),
            'principal'      => 5000,
            'interest'       => 750,
            'payment_method' => 'cash',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame('liability', $this->account('2500')?->type);
        $this->assertSame('credit', $this->account('2500')?->normal_balance);
        $this->assertSame('expense', $this->account('6500')?->type);
        $this->assertSame(2, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count());
        $this->assertTrialBalanceZero($this->tenant);
        $this->assertSame(45000.0, $this->accounting->getBalance('2500'));
        $this->assertSame(750.0, $this->accounting->getBalance('6500'));
    }

    /** @test */
    public function depreciation_posts_on_a_default_seeded_store_with_a_credit_normal_contra_asset(): void
    {
        $this->post($this->storeUrl($this->tenant, 'v3/depreciation'), [
            'description'       => 'Monthly depreciation',
            'depreciation_date' => now()->toDateString(),
            'amount'            => 1200,
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame('expense', $this->account('6600')?->type);
        $this->assertSame('asset', $this->account('1510')?->type);
        $this->assertSame('credit', $this->account('1510')?->normal_balance, '1510 is a contra-asset');
        $this->assertTrialBalanceZero($this->tenant);
        $this->assertSame(1200.0, $this->accounting->getBalance('6600'));
        $this->assertSame(1200.0, $this->accounting->getBalance('1510'));
    }

    /** @test */
    public function cash_donation_posts_on_a_default_seeded_store(): void
    {
        $this->post($this->storeUrl($this->tenant, 'v3/donations'), [
            'description'    => 'Flood relief',
            'donation_date'  => now()->toDateString(),
            'type'           => 'cash',
            'amount'         => 800,
            'payment_method' => 'cash',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame('expense', $this->account('6200')?->type);
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count());
        $this->assertTrialBalanceZero($this->tenant);
        $this->assertSame(800.0, $this->accounting->getBalance('6200'));
    }
}
