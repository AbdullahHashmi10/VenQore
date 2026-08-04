<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill `vensync_command` overrides + make `applied_by` nullable.
 *
 * ── Why this migration exists ────────────────────────────────────────────────
 *
 * 1. FAIL-CLOSED REGRESSION.
 *    `EnsureVenSynQAccess` is now actually applied to the /vensynq routes (it
 *    existed for months but was never attached to a route group, so the gate
 *    never ran). The moment it is enforced, `PlanGate::check('vensync_command')`
 *    is consulted — and `PlanFeatureMatrixSeeder` seeds that key as '0' for
 *    EVERY plan, because VenSynQ is sold as an add-on, never bundled.
 *
 *    Net effect without this migration: every store already using VenSynQ —
 *    including anyone who connected a channel while the gate was dormant —
 *    gets a hard 403 on deploy. This grants the override to any tenant with
 *    demonstrable prior VenSynQ usage so nobody loses access they already had.
 *
 * 2. `applied_by` WAS NOT NULLABLE.
 *    The original table (2026_04_21_000005) declared `applied_by` as a non-null
 *    unsignedBigInteger with no default. Every system-generated override —
 *    ProvisionTenantJob writing `smart_capture`, `woocommerce`, `vensync_command`
 *    after a Lemon Squeezy purchase — omits that column, because there is no
 *    acting user in a queued job. On MySQL in strict mode that insert throws
 *    "Field 'applied_by' doesn't have a default value", so the FIRST add-on
 *    purchase for a tenant would fail provisioning entirely.
 *
 *    Making it nullable is the correct fix: a machine-granted entitlement
 *    genuinely has no human author, and the `reason` column already records
 *    provenance.
 */
return new class extends Migration
{
    /** Marketplace channels that justify a VenSynQ Command Center grant. */
    private const MARKETPLACES = ['amazon', 'woocommerce', 'ebay', 'tiktok'];

    public function up(): void
    {
        // ── 1. applied_by → nullable ─────────────────────────────────────────
        if (Schema::hasTable('tenant_plan_overrides') && Schema::hasColumn('tenant_plan_overrides', 'applied_by')) {
            Schema::table('tenant_plan_overrides', function (Blueprint $table) {
                $table->unsignedBigInteger('applied_by')->nullable()->change();
            });
        }

        // ── 2. Collect tenants with prior VenSynQ usage ──────────────────────
        $tenantIds = collect();

        // (a) Anyone with a marketplace channel row (soft-deleted rows excluded).
        if (Schema::hasTable('ecommerce_channels')) {
            $tenantIds = $tenantIds->merge(
                DB::table('ecommerce_channels')
                    ->whereNull('deleted_at')
                    ->distinct()
                    ->pluck('tenant_id')
            );
        }

        // (b) Anyone with a WooCommerce connection — the VenQore Sync plugin
        //     predates VenSynQ and its users reach the same Command Center.
        if (Schema::hasTable('woo_connections')) {
            $query = DB::table('woo_connections')->distinct();
            if (Schema::hasColumn('woo_connections', 'deleted_at')) {
                $query->whereNull('deleted_at');
            }
            $tenantIds = $tenantIds->merge($query->pluck('tenant_id'));
        }

        // (c) Anyone who PAID for a sync add-on — tenants.sync_channels is a
        //     JSON array written by ProvisionTenantJob on purchase. A paying
        //     customer must never be gated, even if they never connected.
        if (Schema::hasTable('tenants') && Schema::hasColumn('tenants', 'sync_channels')) {
            DB::table('tenants')
                ->select('id', 'sync_channels')
                ->whereNotNull('sync_channels')
                ->orderBy('id')
                ->chunk(200, function ($rows) use (&$tenantIds) {
                    foreach ($rows as $row) {
                        $channels = json_decode($row->sync_channels ?? '[]', true);
                        if (!is_array($channels)) {
                            continue;
                        }
                        if (array_intersect(array_map('strtolower', $channels), self::MARKETPLACES)) {
                            $tenantIds->push($row->id);
                        }
                    }
                });
        }

        $tenantIds = $tenantIds->filter()->unique()->values();

        if ($tenantIds->isEmpty()) {
            return;
        }

        // ── 3. Grant the override, never clobbering an existing row ──────────
        // A platform admin may have set this deliberately (including to '0' as
        // a deliberate revocation). updateOrInsert would overwrite that, so we
        // insert only where no row exists.
        $existing = DB::table('tenant_plan_overrides')
            ->where('override_key', 'vensync_command')
            ->whereIn('tenant_id', $tenantIds)
            ->pluck('tenant_id')
            ->all();

        $now  = now();
        $rows = $tenantIds->diff($existing)->map(fn ($id) => [
            'tenant_id'      => $id,
            'override_key'   => 'vensync_command',
            'override_value' => '1',
            'original_value' => '0',
            'reason'         => 'Backfill 2026-08-03: pre-existing VenSynQ usage grandfathered when the access gate was first enforced.',
            'applied_by'     => null,
            'expires_at'     => null,
            'created_at'     => $now,
            'updated_at'     => $now,
        ])->all();

        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('tenant_plan_overrides')->insert($chunk);
        }
    }

    public function down(): void
    {
        // Remove only the rows this migration authored — identified by the
        // reason string, so a hand-granted override is never destroyed.
        DB::table('tenant_plan_overrides')
            ->where('override_key', 'vensync_command')
            ->where('reason', 'like', 'Backfill 2026-08-03:%')
            ->delete();

        // applied_by is deliberately left nullable. Reverting it would break
        // every system-generated override written since this migration ran.
    }
};
