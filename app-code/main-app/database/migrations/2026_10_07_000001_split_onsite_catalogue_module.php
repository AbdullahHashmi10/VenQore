<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| The QR menu / offline catalogue used to live inside `online_store`. It is now
| its own module (`onsite_catalogue`) so a merchant can run either one alone.
|
| Anyone who already has the online store keeps the catalogue exactly as it was:
| we copy their `online_store` state into a new `onsite_catalogue` row. Tenants
| with no module rows at all are untouched (zero rows = "everything on").
| Idempotent; never overwrites a row that already exists.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_modules')) {
            return;
        }

        $rows = DB::table('tenant_modules')->where('module_key', 'online_store')->get();
        foreach ($rows as $r) {
            $exists = DB::table('tenant_modules')
                ->where('tenant_id', $r->tenant_id)
                ->where('module_key', 'onsite_catalogue')
                ->exists();
            if ($exists) {
                continue;
            }
            DB::table('tenant_modules')->insert([
                'tenant_id'  => $r->tenant_id,
                'module_key' => 'onsite_catalogue',
                'enabled'    => $r->enabled,
                'source'     => 'system',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Rows are harmless; leaving them keeps a rollback from losing user choices.
    }
};
