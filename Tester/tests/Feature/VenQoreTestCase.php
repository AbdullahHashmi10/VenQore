<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Tests\Feature\Golden\Verification\ClaimLogger;
use Tests\Feature\Golden\Verification\VerificationClaim;
use Tests\Support\GoldenSeedManager;
use Tests\Support\RequiresGoldenCompany;
use Tests\TestCase;

/**
 * VenQoreTestCase — Production-Grade Base Test Class
 *
 * Provides all helpers needed for multi-tenant SaaS testing:
 *  - Tenant creation with proper HasTenant binding
 *  - Role-based user creation via tenant_users pivot
 *  - Tenant isolation assertions
 *  - Financial journal assertions
 *  - FIFO batch order assertions
 *
 * Architecture notes:
 *  - TenantMiddleware uses route parameter {store_slug} — NOT headers.
 *  - HasTenant global scope reads app('current.tenant') from DI container.
 *  - Tests bind tenant to DI directly, bypassing HTTP middleware,
 *    for unit-level speed. Route-level tests go through full HTTP stack.
 *  - RefreshDatabase: each test gets a fresh MySQL amd_pos_test database
 *    (migrated via RefreshDatabase; config in Tester/phpunit.xml + root .env.testing).
 */
abstract class VenQoreTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // No SQLite shims needed: tests run on MySQL amd_pos_test (Tester-Fix-0).
        // DB_CONNECTION=mysql is enforced by Tester/phpunit.xml and root .env.testing.
    }

    /**
     * Phase A seeding architecture (closes audit F-03/FC-5).
     *
     * Overrides RefreshDatabase::refreshTestDatabase() so that reference
     * datasets (Golden Company) are seeded OUTSIDE the per-test transaction:
     *
     *   migrate:fresh (once per process)
     *     → GoldenSeedManager::ensureSeeded()   ← only for RequiresGoldenCompany tests,
     *                                              committed data, checksum-guarded
     *       → beginDatabaseTransaction()        ← per-test wrapper, rolled back in teardown
     *
     * The first two lines replicate the framework trait verbatim (Laravel 12);
     * the seeding hook is the only addition. This replaces the in-test
     * DB::commit()/Artisan::call(seed)/DB::beginTransaction() surgery that the
     * forensic audit identified as the likely root cause of the error cascade.
     */
    protected function refreshTestDatabase()
    {
        if (! RefreshDatabaseState::$migrated) {
            $this->artisan('migrate:fresh', $this->migrateFreshUsing());

            $this->app[Kernel::class]->setArtisan(null);

            RefreshDatabaseState::$migrated = true;
        }

        if ($this instanceof RequiresGoldenCompany) {
            GoldenSeedManager::ensureSeeded('golden_company');
        }

        $this->beginDatabaseTransaction();
    }

    /**
     * Create a fully provisioned tenant.
     * Sets up_completed = true to bypass setup wizard redirect.
     *
     * @param  string|null  $slug   Custom slug (auto-generated if null)
     * @param  string       $plan   Plan slug: trial|starter|ltd_1|ltd_2|ltd_3|active
     * @param  string       $status Store status: trial|active|suspended
     */
    public function createTenant(
        ?string $slug = null,
        string $plan = 'trial',
        string $status = 'trial'
    ): Tenant {
        $name = fake()->company();

        return Tenant::factory()->create([
            'name'            => $name,
            'slug'            => $slug ?? \Illuminate\Support\Str::slug($name) . '-' . \Illuminate\Support\Str::random(4),
            'plan'            => $plan,
            'status'          => $status,
            'trial_ends_at'   => $status === 'trial' ? now()->addDays(14) : null,
            'setup_completed' => true,   // skip setup wizard in tests
        ]);
    }

    /**
     * Create a user with a specific role in a tenant.
     *
     * @param  Tenant  $tenant  The tenant/store to bind the user to
     * @param  string  $role    owner|admin|manager|cashier|viewer|accountant|...
     */
    public function createTenantUser(Tenant $tenant, string $role = 'owner'): User
    {
        $user = User::factory()->create([
            'last_store_id' => $tenant->id,
        ]);

        TenantUser::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'role'         => $role,
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
        ]);

        return $user;
    }

    /**
     * Log in as a user in a tenant context.
     * Binds the tenant and membership to the DI container,
     * exactly as TenantMiddleware does.
     */
    protected function actingAsTenantUser(Tenant $tenant, string $role = 'owner'): static
    {
        $user = $this->createTenantUser($tenant, $role);
        return $this->actingAsTenantUserModel($user, $tenant);
    }

    /**
     * Log in with an existing user model in a tenant context.
     */
    protected function actingAsTenantUserModel(User $user, Tenant $tenant): static
    {
        $this->actingAs($user);
        $this->bindTenantContext($tenant, $user);
        return $this;
    }

    /**
     * Bind tenant context to the DI container.
     * This simulates what TenantMiddleware does on every request.
     */
    protected function bindTenantContext(Tenant $tenant, ?User $user = null): void
    {
        $membership = null;

        if ($user) {
            $membership = TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();
        }

        app()->instance('current.tenant', $tenant);

        if ($membership) {
            app()->instance('current.membership', $membership);
        }
    }

    /**
     * Act as the owner of a given tenant.
     */
    protected function actingAsOwner(Tenant $tenant): static
    {
        return $this->actingAsTenantUser($tenant, 'owner');
    }

    /**
     * Act as a cashier in a given tenant.
     */
    protected function actingAsCashier(Tenant $tenant): static
    {
        return $this->actingAsTenantUser($tenant, 'cashier');
    }

    /**
     * Act as a manager in a given tenant.
     */
    protected function actingAsManager(Tenant $tenant): static
    {
        return $this->actingAsTenantUser($tenant, 'manager');
    }

    /**
     * Act as a platform super-admin (is_platform_admin = true).
     * Platform admins bypass tenant scoping entirely.
     */
    protected function actingAsSuperAdmin(): static
    {
        $admin = User::factory()->create([
            'email'             => 'superadmin@venqore-platform.internal',
            'is_platform_admin' => true,
            'platform_role'     => 'platform_owner',
            'last_store_id'     => null,
        ]);

        $this->actingAs($admin);
        return $this;
    }

    /**
     * Set the tenant context without logging in.
     * Use this when testing routes that handle auth themselves.
     */
    protected function withTenant(Tenant $tenant): static
    {
        app()->instance('current.tenant', $tenant);
        return $this;
    }

    /**
     * Make a request in the store context (through full HTTP middleware stack).
     * The URL is automatically prefixed with /s/{store_slug}/.
     *
     * For these to work correctly, the user must already be logged in
     * via $this->actingAs() or one of the actingAs* helpers.
     */
    protected function storeUrl(Tenant $tenant, string $path): string
    {
        return "/s/{$tenant->slug}/{$path}";
    }

    // ─── Seeder Helpers ───────────────────────────────────────────────────────

    /**
     * Seed a tenant with its default data (chart of accounts, settings,
     * warehouse, expense categories, and initial cash account).
     *
     * Uses TenantDefaultSeeder::seedFor() — the exact same code path
     * as store creation, so test counts match production.
     */
    protected function seedTenantDefaults(Tenant $tenant): void
    {
        \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);
    }

    // ─── Financial Assertions ─────────────────────────────────────────────────

    /**
     * Assert a journal_items row exists matching the given criteria.
     * Amounts are compared to 2 decimal places.
     *
     * @param array{
     *   account_id?: string,
     *   account_code?: string,
     *   debit?: float|null,
     *   credit?: float|null,
     *   tenant_id?: int,
     *   reference?: string|null,
     *   reference_type?: string|null,
     * } $expected
     */
    protected function assertJournalEntry(array $expected): void
    {
        // ClaimLogger instrumentation — merged from the dead Golden base class
        // (audit F-02: the instrumented copy was unreachable due to an FQCN
        // collision, starving the verification engines of claims).
        ClaimLogger::log(new VerificationClaim(
            expectedValue: $expected['debit'] ?? $expected['credit'] ?? 0,
            actualValue: null, // presence assertion — DB existence checked below
            metric: 'Journal Entry Presence: ' . ($expected['account_code'] ?? $expected['account_id'] ?? 'Unknown Account'),
            surface: 'VenQoreTestCase'
        ));

        $query = DB::table('journal_items');

        if (isset($expected['tenant_id'])) {
            $query->where('tenant_id', $expected['tenant_id']);
        }

        if (isset($expected['account_id'])) {
            $query->where('account_id', $expected['account_id']);
        }

        if (isset($expected['account_code'])) {
            $query->whereExists(function ($sub) use ($expected) {
                $sub->select(DB::raw(1))
                    ->from('accounts')
                    ->whereColumn('accounts.id', 'journal_items.account_id')
                    ->where('accounts.code', $expected['account_code']);
            });
        }

        if (isset($expected['reference'])) {
            $query->where('reference', $expected['reference']);
        }

        if (isset($expected['reference_type'])) {
            $query->where('reference_type', $expected['reference_type']);
        }

        if (isset($expected['debit'])) {
            $query->whereRaw('ABS(debit - ?) < 0.001', [$expected['debit']]);
        }

        if (isset($expected['credit'])) {
            $query->whereRaw('ABS(credit - ?) < 0.001', [$expected['credit']]);
        }

        $this->assertTrue(
            $query->exists(),
            'Expected journal entry not found. Criteria: ' . json_encode($expected)
        );
    }

    /**
     * Assert that SUM(debit) === SUM(credit) for a tenant's journal_items.
     * This is the double-entry accounting invariant — must ALWAYS be true.
     */
    protected function assertTrialBalanceZero(Tenant $tenant): void
    {
        $totals = DB::table('journal_items')
            ->where('tenant_id', $tenant->id)
            ->selectRaw('ROUND(SUM(debit), 2) as total_debit, ROUND(SUM(credit), 2) as total_credit')
            ->first();

        $debit  = (float) ($totals->total_debit ?? 0);
        $credit = (float) ($totals->total_credit ?? 0);

        $this->assertEquals(
            $debit,
            $credit,
            sprintf(
                'Trial balance is not zero for tenant %d. Debits: %.2f, Credits: %.2f, Discrepancy: %.2f',
                $tenant->id,
                $debit,
                $credit,
                abs($debit - $credit)
            )
        );
    }

    /**
     * Phase C (F-09 / FC-12) — FULL LINE-SET EQUALITY for a journal entry.
     * Unlike assertJournalEntry (which only checks that SOME matching line exists),
     * this asserts the entry's complete set of (account_code, debit, credit) lines
     * equals the expected set exactly — no missing lines, no extra lines, no wrong
     * amounts. This is what kills "existence-only" assertions that pass even when a
     * journal is materially wrong.
     *
     * @param  string  $reference   The transaction reference (journal_entries.reference)
     * @param  array   $expected    List of ['account_code'=>..,'debit'=>..,'credit'=>..]
     */
    protected function assertJournalLinesExactly(string $reference, array $expected, ?Tenant $tenant = null): void
    {
        $q = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.reference', $reference);
        if ($tenant !== null) {
            $q->where('je.tenant_id', $tenant->id);
        }
        $actual = $q->get(['a.code as account_code', 'ji.debit', 'ji.credit'])
            ->map(fn ($r) => [
                'account_code' => (string) $r->account_code,
                'debit'        => round((float) $r->debit, 2),
                'credit'       => round((float) $r->credit, 2),
            ])->all();

        $norm = function (array $lines) {
            $lines = array_map(fn ($l) => [
                'account_code' => (string) $l['account_code'],
                'debit'        => round((float) ($l['debit'] ?? 0), 2),
                'credit'       => round((float) ($l['credit'] ?? 0), 2),
            ], $lines);
            usort($lines, fn ($a, $b) => [$a['account_code'], $a['debit'], $a['credit']]
                                        <=> [$b['account_code'], $b['debit'], $b['credit']]);
            return $lines;
        };

        $this->assertEquals(
            $norm($expected),
            $norm($actual),
            "Journal line-set mismatch for reference '{$reference}'.\n"
            . 'Expected: ' . json_encode($norm($expected)) . "\n"
            . 'Actual:   ' . json_encode($norm($actual))
        );
    }

    /**
     * Phase C (F-12 / FC-13) — read a required key from the Golden manifest.
     * Replaces the `M(...) ?? 0` pattern that silently turned a MISSING manifest
     * key into a passing zero. A missing key now FAILS the test loudly.
     *
     * @param  array   $manifest  The decoded manifest array
     * @param  string  $dotPath   Dot path, e.g. "year_end.profit_and_loss.cogs"
     */
    protected function manifestValue(array $manifest, string $dotPath): mixed
    {
        $node = $manifest;
        foreach (explode('.', $dotPath) as $seg) {
            if (! is_array($node) || ! array_key_exists($seg, $node)) {
                $this->fail("Manifest key missing: '{$dotPath}' (stopped at '{$seg}'). "
                    . 'A missing manifest key must fail, never default to 0 (audit F-12).');
            }
            $node = $node[$seg];
        }
        return $node;
    }

    // ─── FIFO Assertions ──────────────────────────────────────────────────────

    /**
     * Assert that sale_item_batches consumed FIFO batches in the specified order.
     * Oldest batch (lowest created_at) must be consumed first.
     *
     * @param  int    $productId        The product ID to check
     * @param  string[]  $expectedBatchIds The UUIDs of batches in consumption order
     */
    protected function assertFifoConsumedInOrder(string $productId, array $expectedBatchIds): void
    {
        $actualOrder = DB::table('sale_item_batches')
            ->where('product_id', $productId)
            ->whereIn('inventory_batch_id', $expectedBatchIds)
            ->orderBy('created_at', 'asc')
            ->pluck('inventory_batch_id')
            ->toArray();

        $this->assertEquals(
            $expectedBatchIds,
            $actualOrder,
            'FIFO consumption order mismatch. Expected oldest-first consumption.'
        );
    }

    // ─── Tenant Isolation Assertions ─────────────────────────────────────────

    /**
     * Assert that no data from Tenant A is visible in Tenant B's context.
     *
     * @param  string  $model     Fully-qualified model class name
     * @param  Tenant  $tenantA   The tenant whose data should NOT be visible
     * @param  Tenant  $tenantB   The tenant whose context we're querying in
     */
    protected function assertNoCrossTenantLeak(string $model, Tenant $tenantA, Tenant $tenantB): void
    {
        // Get all IDs belonging to Tenant A (bypass global scope)
        $tenantAIds = $model::withoutTenantScope()
            ->where('tenant_id', $tenantA->id)
            ->pluck('id')
            ->toArray();

        if (empty($tenantAIds)) {
            $this->markTestSkipped("No records for tenant A ({$tenantA->id}) in model {$model}.");
            return;
        }

        // Now bind Tenant B context and query — should return nothing from Tenant A
        app()->instance('current.tenant', $tenantB);

        $leaked = $model::whereIn('id', $tenantAIds)->count();

        app()->instance('current.tenant', $tenantA); // restore

        $this->assertEquals(
            0,
            $leaked,
            "Cross-tenant data leak detected: {$leaked} records from Tenant A visible in Tenant B context. Model: {$model}"
        );
    }

    // ─── Money Helpers ────────────────────────────────────────────────────────

    /**
     * Assert two monetary values are equal to 2 decimal places.
     * Prevents floating point drift from causing false test failures.
     */
    protected function assertMoneyEquals(float $expected, float $actual, string $message = ''): void
    {
        // ClaimLogger instrumentation — merged from the dead Golden base class
        // (audit F-02). Emits an actual expected-vs-actual comparison claim so the
        // verification engines see real values, not just presence assertions.
        ClaimLogger::log(new VerificationClaim(
            expectedValue: $expected,
            actualValue: $actual,
            metric: $message ?: 'Money Equality',
            surface: 'VenQoreTestCase'
        ));

        $this->assertEquals(
            round($expected, 2),
            round($actual, 2),
            $message ?: "Expected money amount {$expected}, got {$actual}"
        );
    }

    // ─── Setup Teardown ───────────────────────────────────────────────────────

    /**
     * Reset the DI container bindings after each test.
     * Prevents tenant context from leaking between tests.
     */
    protected function tearDown(): void
    {
        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }

        if (app()->bound('current.membership')) {
            app()->forgetInstance('current.membership');
        }

        parent::tearDown();
    }
}
