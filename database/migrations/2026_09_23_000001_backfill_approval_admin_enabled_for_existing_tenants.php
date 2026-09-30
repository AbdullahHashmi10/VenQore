<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Phase 1 approval release — preserve existing behavior while fixing the
 * new-store default.
 *
 * ApprovalPolicyResolver previously treated a MISSING `approval_admin_enabled`
 * setting row as enabled=true. That was backwards for a brand-new store (doc 29:
 * "new stores/actions default to direct"), but every EXISTING tenant has been
 * relying on that implicit true default for however long the approval system
 * has been live — some may have real pending submissions in flight right now.
 *
 * The resolver's code-level default is being changed to false (a new store
 * with no row = OFF/direct). To avoid silently flipping approval off for
 * every existing store the moment that code change ships, this migration
 * writes an explicit `approval_admin_enabled = "1"` row for every tenant that
 * does not already have one — preserving their current de facto behavior
 * exactly. A tenant that already has an explicit row (having actually used
 * the settings toggle) is left untouched either way.
 *
 * After this migration, the resolver's "no row" fallback only ever applies to
 * tenants created after this point — i.e. genuinely new stores.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('settings') || !\Illuminate\Support\Facades\Schema::hasTable('tenants')) {
            return;
        }

        $tenantIds = DB::table('tenants')->pluck('id');

        $existing = DB::table('settings')
            ->where('key', 'approval_admin_enabled')
            ->whereIn('tenant_id', $tenantIds)
            ->pluck('tenant_id')
            ->all();

        $missing = $tenantIds->diff($existing);

        if ($missing->isEmpty()) {
            return;
        }

        $now = now();
        $rows = $missing->map(function ($tenantId) use ($now) {
            return [
                'id'         => (string) Str::uuid(),
                'tenant_id'  => $tenantId,
                'key'        => 'approval_admin_enabled',
                'value'      => '1',
                'group'      => 'approval',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        // Chunk the insert to stay well under any single-statement row limits
        // on large tenant counts.
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('settings')->insert($chunk);
        }
    }

    public function down(): void
    {
        // Intentionally not reversible: removing these rows would silently
        // flip existing tenants' approval behavior back to relying on an
        // implicit default that the corresponding code change (resolver
        // default false) no longer provides as "enabled". Down is a no-op;
        // roll back the resolver code change instead if this needs undoing.
    }
};
