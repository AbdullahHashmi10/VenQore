<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

/**
 * SEC-11 (2026-09-10): replace store join codes with the new high-entropy
 * "VQ-XXXX-XXXX" format. Old 4-character codes are guessable across stores.
 *
 *   php artisan venqore:rotate-join-codes            # only stores on the old format
 *   php artisan venqore:rotate-join-codes --all      # every store
 *   php artisan venqore:rotate-join-codes --tenant=my-store
 *
 * Owners see the new code on their Staff page; staff who already joined are
 * unaffected (the code is only used to join).
 */
class RotateJoinCodes extends Command
{
    protected $signature = 'venqore:rotate-join-codes {--all : Rotate every store, not just old-format codes} {--tenant= : Only this store slug}';

    protected $description = 'Rotate store staff join codes to the high-entropy format';

    public function handle(): int
    {
        $query = Tenant::withoutGlobalScopes();
        if ($slug = $this->option('tenant')) {
            $query->where('slug', $slug);
        }

        $count = 0;
        $query->orderBy('id')->chunkById(200, function ($tenants) use (&$count) {
            foreach ($tenants as $tenant) {
                $isOld = !preg_match('/^VQ-[A-Z2-9]{4}-[A-Z2-9]{4}$/', (string) $tenant->join_code);
                if ($this->option('all') || $this->option('tenant') || $isOld) {
                    $tenant->rotateJoinCode();
                    $count++;
                }
            }
        });

        $this->info("Rotated {$count} join code(s).");

        return self::SUCCESS;
    }
}
