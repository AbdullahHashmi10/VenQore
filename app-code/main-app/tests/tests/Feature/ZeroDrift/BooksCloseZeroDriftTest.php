<?php

namespace Tests\Feature\ZeroDrift;

use App\Console\Commands\RunDepreciation;
use App\Helpers\SettingsHelper;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Accounting\FiscalYearService;
use App\Services\DataImportService;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * ZeroDrift Ledger — the producers that close or bring in books:
 * the daily depreciation run, the fiscal-year close and the Vyapar import.
 */
class BooksCloseZeroDriftTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private string $tenantId;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('zdb-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();
    }

    private function cents($v): int
    {
        return (int) BigDecimal::of((string) $v)->multipliedBy(100)->toScale(0, RoundingMode::HALF_UP)->toInt();
    }

    private function asset(string $tenantId, string $balance, string $rate): string
    {
        $id = (string) Str::uuid();
        DB::table('accounts')->insert(['id' => $id, 'tenant_id' => $tenantId, 'code' => 'FA-' . Str::random(5), 'name' => 'Asset ' . Str::random(4),
            'type' => 'asset', 'normal_balance' => 'debit', 'balance' => $balance, 'depreciation_rate' => $rate, 'is_active' => 1,
            'created_at' => now(), 'updated_at' => now()]);
        return $id;
    }

    /** A raw journal row as old data has it (4 decimals, written before the gate existed). */
    private function legacyEntry(string $date, array $lines): void
    {
        $je = (string) Str::uuid();
        DB::table('journal_entries')->insert(['id' => $je, 'tenant_id' => $this->tenantId, 'date' => $date, 'reference' => 'LEGACY-' . Str::random(5),
            'reference_type' => 'manual', 'user_id' => $this->owner->id, 'is_reversed' => 0, 'is_reversal' => 0, 'created_at' => now(), 'updated_at' => now()]);
        foreach ($lines as [$code, $dr, $cr]) {
            $acc = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
            $this->assertNotNull($acc, "account {$code}");
            DB::table('journal_items')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'journal_entry_id' => $je,
                'account_id' => $acc, 'debit' => $dr, 'credit' => $cr, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    // ── Depreciation ────────────────────────────────────────────────────

    public function test_depreciation_is_exact_per_asset_runs_once_a_day_and_stays_in_its_store(): void
    {
        $assets = [
            $this->asset($this->tenantId, '1234.5678', '33.33'),
            $this->asset($this->tenantId, '99999.9999', '10.00'),
            $this->asset($this->tenantId, '10.0049', '2.50'),          // 0.07 paisa a day: nothing
            $this->asset($this->tenantId, '365.0000', '50.00'), // 0.50 a day: an exact half-paisa boundary
        ];
        $other = $this->createTenant('zdb-other-' . Str::lower(Str::random(4)), 'ltd_3', 'active');
        $otherAsset = $this->asset((string) $other->id, '5000.0000', '20.00');

        $expected = [];
        foreach ($assets as $id) {
            $a = DB::table('accounts')->where('id', $id)->first();
            $expected[$id] = BigDecimal::of($a->balance)->multipliedBy($a->depreciation_rate)->dividedBy(365, 0, RoundingMode::HALF_UP)->toInt();
            $this->assertSame($expected[$id], RunDepreciation::dailyMinor($a->balance, $a->depreciation_rate));
        }

        Artisan::call('finance:depreciate', ['--tenant' => $this->tenantId, '--date' => '2026-10-08']);
        $entries = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference', 'DEP-20261008')->pluck('id');
        $this->assertCount(1, $entries, Artisan::output());

        $items = DB::table('journal_items')->where('journal_entry_id', $entries[0])->get();
        foreach ($assets as $id) {
            $line = $items->firstWhere('account_id', $id);
            // Under half a paisa a day rounds to nothing and posts no line.
            $this->assertSame($expected[$id], $line ? $this->cents($line->credit) : 0, "asset {$id}");
        }
        $this->assertSame(array_sum($expected), $this->cents($items->sum(fn ($i) => (float) $i->debit)));
        $this->assertSame($this->cents($items->sum(fn ($i) => (float) $i->debit)), $this->cents($items->sum(fn ($i) => (float) $i->credit)));

        // A retry of the same day posts nothing more.
        Artisan::call('finance:depreciate', ['--tenant' => $this->tenantId, '--date' => '2026-10-08']);
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference', 'DEP-20261008')->count());
        $this->assertSame(1, DB::table('journal_items')->where('account_id', $assets[0])->count());

        // The other store's asset was not touched.
        $this->assertSame('5000.0000', DB::table('accounts')->where('id', $otherAsset)->value('balance'));
    }

    // ── Fiscal-year close ──────────────────────────────────────────────

    public function test_year_close_on_old_sub_paisa_data_posts_exactly_and_the_trial_balance_check_has_no_tolerance(): void
    {
        mt_srand(910202603);
        // Old 4-decimal data, each entry balanced at 4 decimals.
        for ($i = 0; $i < 30; $i++) {
            $amt = number_format(mt_rand(1, 9999999) / 10000, 4, '.', '');
            $this->legacyEntry('2025-0' . mt_rand(1, 9) . '-1' . mt_rand(0, 9), [['1000', $amt, 0], ['4000', 0, $amt]]);
            $exp = number_format(mt_rand(1, 999999) / 10000, 4, '.', '');
            $this->legacyEntry('2025-0' . mt_rand(1, 9) . '-2' . mt_rand(0, 8), [['6000', $exp, 0], ['1000', 0, $exp]]);
        }

        $svc = app(FiscalYearService::class);
        $fy = $svc->createFiscalYear(tenantId: $this->tenantId, name: 'FY 2025', startDate: '2025-01-01', endDate: '2025-12-31', creator: $this->owner);
        $preview = $svc->previewClose($fy);
        $this->assertTrue($preview['can_close'], json_encode($preview['checks']));

        $dr = $cr = 0;
        foreach ($preview['proposed_journal_lines'] as $l) {
            $dr += $this->cents($l['debit']);
            $cr += $this->cents($l['credit']);
        }
        $this->assertSame($dr, $cr, 'the proposed closing entry balances to the paisa');

        $closed = $svc->closeYear($fy, $this->owner, $this->owner->id);
        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'fiscal_year_close')->value('id');
        $this->assertNotNull($entry);
        $sum = DB::table('journal_items')->where('journal_entry_id', $entry)->selectRaw('SUM(debit) d, SUM(credit) c')->first();
        $this->assertSame($this->cents($sum->d), $this->cents($sum->c));
        $this->assertSame($this->cents($preview['financial_summary']['net_profit']),
            $this->cents(DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')->where('ji.journal_entry_id', $entry)
                ->where('a.type', 'equity')->selectRaw('SUM(ji.credit) - SUM(ji.debit) v')->value('v')));

        // After the close every income and expense account nets to under half a paisa for the year.
        foreach (DB::table('accounts')->where('tenant_id', $this->tenantId)->whereIn('type', ['income', 'expense'])->pluck('id') as $acc) {
            $net = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.account_id', $acc)->whereBetween('je.date', ['2025-01-01', '2025-12-31'])->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) v')->value('v');
            $this->assertSame(0, $this->cents($net), "account {$acc} not closed");
        }

        // A next year whose books are a paisa out cannot close: no tolerance.
        $this->legacyEntry('2026-03-01', [['1000', '100.0000', 0], ['4000', 0, '99.9900']]);
        $fy2 = $svc->createFiscalYear(tenantId: $this->tenantId, name: 'FY 2026', startDate: '2026-01-01', endDate: '2026-12-31', creator: $this->owner);
        $tb = collect($svc->previewClose($fy2)['checks'])->firstWhere('check_key', 'balanced_trial_balance');
        $this->assertSame('fail', $tb['status'], $tb['measured_value']);
        $this->assertStringContainsString('Diff: 0.01', $tb['measured_value']);
    }

    // ── Vyapar import ──────────────────────────────────────────────────

    private function vyaparFile(): string
    {
        $path = storage_path('app/zd-vyapar-' . Str::random(6) . '.vyp');
        $pdo = new \PDO('sqlite:' . $path);
        $pdo->exec('CREATE TABLE other_accounts (id INTEGER PRIMARY KEY, name TEXT, opening_balance REAL)');
        $pdo->exec('CREATE TABLE journal_entry (id INTEGER PRIMARY KEY, date TEXT, reference_number TEXT, description TEXT)');
        $pdo->exec('CREATE TABLE journal_entry_line_items (id INTEGER PRIMARY KEY, journal_entry_id INTEGER, account_id INTEGER, amount TEXT, amount_type INTEGER)');
        $pdo->exec("INSERT INTO other_accounts VALUES (11, 'ZD Rent', 0), (12, 'ZD Petty Cash', 0)");
        $d = now()->toDateString();
        $pdo->exec("INSERT INTO journal_entry VALUES (1, '{$d}', 'VJ-OK', 'balanced'), (2, '{$d}', 'VJ-UNBAL', 'unbalanced'), (3, '{$d}', 'VJ-NOACC', 'unknown account')");
        $pdo->exec("INSERT INTO journal_entry_line_items VALUES
            (1, 1, 11, '100.005', 0), (2, 1, 12, '100.005', 1),
            (3, 2, 11, '100.00', 0),  (4, 2, 12, '90.00', 1),
            (5, 3, 11, '50.00', 0),   (6, 3, 99, '50.00', 1)");
        return $path;
    }

    public function test_vyapar_journals_land_on_their_own_accounts_and_bad_ones_are_not_written(): void
    {
        $path = $this->vyaparFile();
        try {
            $result = app(DataImportService::class)->importVyaparOrExcel($path, 'vyp');
        } finally {
            @unlink($path);
        }
        $this->assertTrue($result['success'], $result['message']);
        $this->assertStringContainsString('1 journals', $result['message']);
        $this->assertStringContainsString('1 unbalanced, 1 with an account that could not be matched', $result['message']);

        $rent = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('name', 'ZD Rent')->value('id');
        $petty = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('name', 'ZD Petty Cash')->value('id');
        $this->assertNotNull($rent);

        $ok = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference', 'VJ-OK')->value('id');
        $this->assertNotNull($ok, 'the balanced journal was imported');
        $lines = DB::table('journal_items')->where('journal_entry_id', $ok)->get();
        $this->assertSame(10001, $this->cents($lines->firstWhere('account_id', $rent)->debit), 'debit on Rent, quantized once');
        $this->assertSame(10001, $this->cents($lines->firstWhere('account_id', $petty)->credit), 'credit on Petty Cash');

        $this->assertFalse(DB::table('journal_entries')->where('tenant_id', $this->tenantId)->whereIn('reference', ['VJ-UNBAL', 'VJ-NOACC'])->exists());
    }
}
