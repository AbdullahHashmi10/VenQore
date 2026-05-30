<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
 *  - RefreshDatabase: each test gets a fresh SQLite :memory: database.
 */
abstract class VenQoreTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
            DB::connection()->getPdo()->sqliteCreateFunction('DATE_FORMAT', function ($date, $format) {
                if (!$date) return null;
                $timestamp = strtotime($date);
                if ($timestamp === false) {
                    return $date;
                }
                
                $map = [
                    '%Y' => 'Y',
                    '%m' => 'm',
                    '%d' => 'd',
                    '%H' => 'H',
                    '%i' => 'i',
                    '%s' => 's',
                ];
                
                $phpFormat = strtr($format, $map);
                return date($phpFormat, $timestamp);
            });

            DB::connection()->getPdo()->sqliteCreateFunction('FIELD', function ($value, ...$fields) {
                $idx = array_search($value, $fields);
                return $idx === false ? 0 : $idx + 1;
            });
        }
    }

    /**
     * Create a fully provisioned tenant.
     * Sets up_completed = true to bypass setup wizard redirect.
     *
     * @param  string|null  $slug   Custom slug (auto-generated if null)
     * @param  string       $plan   Plan slug: trial|starter|ltd_1|ltd_2|ltd_3|active
     * @param  string       $status Store status: trial|active|suspended
     */
    protected function createTenant(
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
    protected function createTenantUser(Tenant $tenant, string $role = 'owner'): User
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
