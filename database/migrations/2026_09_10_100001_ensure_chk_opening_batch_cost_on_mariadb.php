<?php

use App\Support\InventoryDbGuards;
use Illuminate\Database\Migrations\Migration;

/**
 * Ensure inventory_batches.chk_opening_batch_cost exists on MariaDB installs
 * (opening stock must carry a real cost — rulebook S-055 / B19).
 *
 * 2026_03_05_182418 only added it for the `mysql` driver. This back-fills it,
 * without changing data: zero-cost opening batches block it (logged); fix
 * their cost, then `php artisan venqore:db-guards --install`. Idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        InventoryDbGuards::installIfClean('chk_opening_batch_cost');
    }

    public function down(): void
    {
        // The constraint belongs to 2026_03_05_182418, whose down() removes it.
    }
};
