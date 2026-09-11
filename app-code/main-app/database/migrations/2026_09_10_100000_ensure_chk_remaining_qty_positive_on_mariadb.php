<?php

use App\Support\InventoryDbGuards;
use Illuminate\Database\Migrations\Migration;

/**
 * Ensure inventory_batches.chk_remaining_qty_positive exists on MariaDB installs.
 *
 * The constraint migrations (2026_03_06_201514, 2026_07_21_000000) only ran for
 * the `mysql` driver; production uses Laravel's `mariadb` driver, so the guard
 * was never installed there. This back-fills it.
 *
 * It does NOT change stock data. If any non-negative_stock batch already has a
 * negative quantity, the guard is left uninstalled and the rows are logged;
 * `php artisan venqore:db-guards --check` then fails until they are reconciled
 * and `--install` is run. Idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        InventoryDbGuards::installIfClean('chk_remaining_qty_positive');
    }

    public function down(): void
    {
        // The constraint belongs to 2026_03_06_201514 / 2026_07_21_000000.
    }
};
