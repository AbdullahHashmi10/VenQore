<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| A tenant with zero `tenant_modules` rows is treated as "everything on" (the
| safety rail for businesses created before modules existed). That is why an
| old retail shop still saw Front of House and the restaurant pages.
|
| This writes explicit rows for those tenants, from evidence rather than
| guesswork:
|   - everything is switched ON, so nobody loses a screen they use,
|   - EXCEPT the restaurant module (table_service), which stays on only if the
|     business has tables, open tabs, or runs table service, and
|   - the online store and QR menu, which stay on only if a storefront exists.
|
| Rows are marked source=system, so they are clearly not the owner's choice and
| the owner can switch any module back on from the builder at any time. Data is
| never deleted. Tenants that already have any row are untouched.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_modules') || !Schema::hasTable('tenants')) {
            return;
        }

        $keys = array_keys(config('modules', []));
        if (empty($keys)) {
            return;
        }

        $has = fn (string $t) => Schema::hasTable($t);

        DB::table('tenants')->whereNull('deleted_at')->chunkById(100, function ($tenants) use ($keys, $has) {
            foreach ($tenants as $t) {
                try {
                    if (DB::table('tenant_modules')->where('tenant_id', $t->id)->exists()) {
                        continue;
                    }

                    $restaurant = ($has('positions') && DB::table('positions')->where('tenant_id', $t->id)->exists())
                        || ($has('occupancies') && DB::table('occupancies')->where('tenant_id', $t->id)->exists())
                        || ($has('settings') && DB::table('settings')->where('tenant_id', $t->id)
                            ->where('key', 'service_mode')->whereIn('value', ['tables', 'both'])->exists());

                    $shop = $has('storefronts') && DB::table('storefronts')->where('tenant_id', $t->id)->exists();

                    $rows = [];
                    foreach ($keys as $k) {
                        $on = match ($k) {
                            'table_service' => $restaurant,
                            'online_store', 'onsite_catalogue' => $shop,
                            default => true,
                        };
                        $rows[] = [
                            'tenant_id' => $t->id, 'module_key' => $k, 'enabled' => $on ? 1 : 0,
                            'source' => 'system', 'created_at' => now(), 'updated_at' => now(),
                        ];
                    }
                    DB::table('tenant_modules')->insert($rows);
                    \Illuminate\Support\Facades\Cache::forget("tenant_modules:{$t->id}");
                } catch (\Throwable $e) {
                    // One odd tenant must never stop the deploy; it simply stays on "everything".
                    report($e);
                }
            }
        });
    }

    public function down(): void
    {
        // Rows are the owner's to change; removing them would silently re-enable everything.
    }
};
