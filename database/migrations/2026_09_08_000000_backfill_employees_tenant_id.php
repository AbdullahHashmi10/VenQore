<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The cross-tenant employee leak (Employee::orderBy('name')->get() with no
 * tenant filter, surfaced in ToolController/ServiceJobController) was fixed
 * in code by adding HasTenant to App\Models\Employee. That fix only works if
 * every row already has a tenant_id — otherwise HasTenant's global scope
 * (`where tenant_id = current tenant`) just makes NULL-tenant employees
 * invisible everywhere instead of leaking, which is safer but still wrong.
 *
 * The actual data fix so far was a one-off `php -r "...->update(['tenant_id'
 * => $tenant->id])"` run by hand against one local database. That does not
 * travel: a fresh clone, staging, production, or a teammate's machine still
 * has NULL tenant_id on every pre-existing employee until this runs there
 * too. This migration makes that backfill part of the codebase instead of a
 * one-time command, so it applies everywhere this app is deployed.
 *
 * Best-effort per-row assignment via employees.party_id -> parties.tenant_id
 * (the relation Employee::party() already exposes) when available, falling
 * back to the oldest tenant for any employee with no party link — matching
 * what the manual backfill did, just for every environment instead of one.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('employees') || !Schema::hasColumn('employees', 'tenant_id')) {
            return;
        }

        if (Schema::hasTable('parties') && Schema::hasColumn('employees', 'party_id')) {
            DB::statement(
                'UPDATE employees e
                 JOIN parties p ON p.id = e.party_id
                 SET e.tenant_id = p.tenant_id
                 WHERE e.tenant_id IS NULL AND p.tenant_id IS NOT NULL'
            );
        }

        $stillNull = DB::table('employees')->whereNull('tenant_id')->exists();
        if ($stillNull) {
            $fallbackTenantId = DB::table('tenants')->orderBy('id')->value('id');
            if ($fallbackTenantId !== null) {
                DB::table('employees')->whereNull('tenant_id')->update(['tenant_id' => $fallbackTenantId]);
            }
        }
    }

    public function down(): void
    {
        // Data backfill only — intentionally not reversed. Reversing would
        // re-introduce the leak this migration exists to close.
    }
};
