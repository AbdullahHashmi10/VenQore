<?php

use Illuminate\Database\Migrations\Migration;
use Database\Seeders\PlanFeatureMatrixSeeder;

/**
 * Session-3 fix (2026-07-04) — VNQ-010/011/003 guard tests were failing
 * because the full plan_limits matrix (~150 keys x 7 plans, defined in
 * PlanFeatureMatrixSeeder) was only ever written by a separate, manual
 * `php artisan db:seed --class=PlanFeatureMatrixSeeder` step (see
 * PRODUCTION_SERVER_ACTIONS_REQUIRED.md step 5) or by test files that
 * remembered to call $this->seed(PlanFeatureMatrixSeeder::class)
 * (Tester/tests/Feature/Money/GatingTest.php does; PlanTruthFailClosedTest
 * and RegressionFixesTest did not).
 *
 * Session-2 correctly made every plan-gated feature FAIL-CLOSED when its
 * key is missing from plan_limits (Tenant::featureOn(), D3/VNQ-003). That
 * is the right call for security — but it means a fresh install, a fresh
 * CI/test database, or any deploy where step 5 is skipped silently locks
 * every plan-gated feature (report_profit_loss, recurring_invoices,
 * fund_management, production, e_invoicing, bank_reconciliation, ...) for
 * every tenant, with no error. Fail-closed is only as good as the data it
 * is closing against.
 *
 * The fix belongs in the bootstrap, not in the tests: make the full matrix
 * part of `php artisan migrate` itself, exactly like the `plans` table's
 * own migration (2026_04_21_000002_create_plans_table.php) already seeds
 * its 7 rows directly in up(). This removes the single point of human
 * failure instead of asking every test (or every deploy) to remember a
 * separate step.
 *
 * Idempotent and production-safe: PlanFeatureMatrixSeeder::run() uses
 * updateOrInsert keyed on [plan_id, key], so re-running it (here, or via
 * the manual command in PRODUCTION_SERVER_ACTIONS_REQUIRED.md) can only
 * ever converge existing rows to the matrix's values — it cannot
 * duplicate rows or clobber unrelated data.
 */
return new class extends Migration
{
    public function up(): void
    {
        (new PlanFeatureMatrixSeeder())->run();
    }

    public function down(): void
    {
        // Intentional no-op. The matrix is the source of truth (per
        // Tenant.php's own docblock); reverting would re-open the
        // fail-closed gap this migration exists to close, for no benefit.
    }
};
