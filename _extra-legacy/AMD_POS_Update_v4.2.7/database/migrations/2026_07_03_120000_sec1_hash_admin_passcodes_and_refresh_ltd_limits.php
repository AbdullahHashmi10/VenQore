<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * Session-2 hardening (2026-07-03)
 *
 * 1. SEC-1 — hash every stored plaintext `admin_passcode` (all tenants).
 *    SettingsController now hashes on save and SystemResetController /
 *    OwnerDailyPulseController verify via Hash::check. This backfills
 *    existing rows so no plaintext master passcode remains at rest.
 *
 * 2. Refresh `plan_limits` JSON for tenants on the 'ltd' plan from the
 *    seeded plan_limits TABLE (single source of truth). Previously the JSON
 *    snapshot came from config/plans.php, which disagreed with the seeder.
 *    Safe pre-launch: AppSumo has not opened publicly, so 'ltd' tenants are
 *    internal/test tenants. Tier is inferred from the existing JSON tx cap
 *    (500→ltd_1, 2000→ltd_2, 6000→ltd_3; default ltd_1).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. SEC-1: hash plaintext admin passcodes ─────────────────────
        if (Schema::hasTable('settings')) {
            $rows = DB::table('settings')
                ->where('key', 'admin_passcode')
                ->whereNotNull('value')
                ->where('value', '!=', '')
                ->get(['id', 'value']);

            foreach ($rows as $row) {
                $isHashed = str_starts_with($row->value, '$2y$') || str_starts_with($row->value, '$argon2');
                if (!$isHashed) {
                    DB::table('settings')->where('id', $row->id)
                        ->update(['value' => Hash::make($row->value)]);
                }
            }
        }

        // ── 2. Refresh LTD tenants' plan_limits JSON from the seeded table ──
        if (Schema::hasTable('tenants') && Schema::hasTable('plan_limits')) {
            $ltdTenants = DB::table('tenants')->where('plan', 'ltd')->get(['id', 'plan_limits']);

            foreach ($ltdTenants as $tenant) {
                $json = $tenant->plan_limits ? json_decode($tenant->plan_limits, true) : [];
                $tx   = $json['transactions_per_month'] ?? null;

                $slug = match ((int) $tx) {
                    2000    => 'ltd_2',
                    6000    => 'ltd_3',
                    default => 'ltd_1',
                };

                $limits = \App\Services\PlanRepository::getLimits($slug);
                if (!empty($limits)) {
                    DB::table('tenants')->where('id', $tenant->id)
                        ->update(['plan_limits' => json_encode($limits)]);
                }
            }
        }
    }

    public function down(): void
    {
        // Irreversible by design: hashes cannot be un-hashed, and the old
        // config-derived LTD JSON was the bug being fixed.
    }
};
