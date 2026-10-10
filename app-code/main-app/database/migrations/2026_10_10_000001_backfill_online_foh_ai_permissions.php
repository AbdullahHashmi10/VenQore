<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The online store, QR catalogue, Front-of-House setup and AI keys now have their
 * own permission keys. Staff whose permissions are stored on their membership
 * (custom / legacy) would silently lose access the moment the routes switched to
 * the new keys, so grant each of them the new key that matches what they could
 * already do. Rules live in resources/js/Data/permission_inherits.json — the same
 * file config/permissions.php reads for role defaults.
 *
 * Idempotent: only ever ADDS missing keys, never removes anything. Owners are
 * skipped (they hold every key), as are wildcard holders and POS-only staff.
 */
return new class extends Migration
{
    public function up(): void
    {
        $file = base_path('resources/js/Data/permission_inherits.json');
        $grants = json_decode((string) @file_get_contents($file), true)['grants'] ?? [];
        if ($grants === []) {
            return;
        }

        DB::table('tenant_users')
            ->whereNotNull('permissions')
            ->where('role', '!=', 'owner')
            ->orderBy('id')
            ->chunkById(200, function ($rows) use ($grants) {
                foreach ($rows as $row) {
                    $perms = json_decode((string) $row->permissions, true);
                    if (!is_array($perms) || $perms === [] || in_array('*', $perms, true)) {
                        continue;
                    }

                    $add = [];
                    foreach ($grants as $newKey => $rule) {
                        if (in_array($newKey, $perms, true)) {
                            continue;
                        }
                        $from = $rule['from'] ?? [];
                        if (in_array('*any*', $from, true) || array_intersect($from, $perms)) {
                            $add[] = $newKey;
                        }
                    }

                    if ($add !== []) {
                        DB::table('tenant_users')->where('id', $row->id)->update([
                            'permissions' => json_encode(array_values(array_merge($perms, $add))),
                        ]);
                    }
                }
            });
    }

    public function down(): void
    {
        // Additive grants are intentionally not reversed: removing them would
        // lock staff out of screens they already use.
    }
};
