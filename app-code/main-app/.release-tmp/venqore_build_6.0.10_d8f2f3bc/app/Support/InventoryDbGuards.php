<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Database-level guards on inventory_batches (MySQL / MariaDB CHECK constraints).
 *
 *   chk_remaining_qty_positive — stock left on a batch can't go below zero,
 *                                except on a deliberate `negative_stock` batch.
 *   chk_opening_batch_cost     — opening stock must carry a real cost.
 *
 * Installing a CHECK validates every existing row. This class NEVER changes
 * business data to make that pass (an earlier version clamped negative
 * quantities to zero, which silently rewrote stock). If rows would violate a
 * guard it is left uninstalled, the rows are logged, and
 * `php artisan venqore:db-guards --check` reports it (non-zero exit) until the
 * data has been reconciled and `--install` is run.
 */
class InventoryDbGuards
{
    public const GUARDS = [
        'chk_remaining_qty_positive' => [
            'check'   => "remaining_qty >= 0 OR batch_type = 'negative_stock'",
            'meaning' => 'Batch stock cannot be negative except on a negative_stock batch.',
        ],
        'chk_opening_batch_cost' => [
            'check'   => "unit_cost > 0 OR batch_type <> 'opening'",
            'meaning' => 'Opening-stock batches must have a unit cost above zero.',
        ],
    ];

    public static function supported(?string $connection = null): bool
    {
        return in_array(DB::connection($connection)->getDriverName(), ['mysql', 'mariadb'], true);
    }

    public static function exists(string $name, ?string $connection = null): bool
    {
        return DB::connection($connection)->table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::connection($connection)->getDatabaseName())
            ->where('TABLE_NAME', 'inventory_batches')
            ->where('CONSTRAINT_NAME', $name)
            ->exists();
    }

    /** Rows that would make the guard fail to install (read-only). */
    public static function violations(string $name, int $limit = 500, ?string $connection = null): \Illuminate\Support\Collection
    {
        // Early migrations run before inventory_batches has every column.
        $schema = \Illuminate\Support\Facades\Schema::connection($connection);
        $cols = array_values(array_filter(
            ['id', 'tenant_id', 'product_id', 'batch_type', 'remaining_qty', 'unit_cost'],
            fn ($c) => $schema->hasColumn('inventory_batches', $c)
        ));
        $q = DB::connection($connection)->table('inventory_batches')->select($cols);

        match ($name) {
            'chk_remaining_qty_positive' => $q->where('remaining_qty', '<', 0)->where('batch_type', '<>', 'negative_stock'),
            'chk_opening_batch_cost'     => $q->where('batch_type', 'opening')->where(fn ($w) => $w->whereNull('unit_cost')->orWhere('unit_cost', '<=', 0)),
        };

        return $q->limit($limit)->get();
    }

    /**
     * Install the guard if it is missing and no row violates it.
     * Returns 'present' | 'installed' | 'blocked' | 'unsupported'.
     */
    public static function installIfClean(string $name, ?string $connection = null): string
    {
        if (!self::supported($connection)) {
            return 'unsupported';
        }
        if (self::exists($name, $connection)) {
            return 'present';
        }

        $bad = self::violations($name, 200, $connection);
        if ($bad->isNotEmpty()) {
            Log::critical("{$name} NOT installed: existing rows would violate it. Reconcile them, then run `php artisan venqore:db-guards --install`.", [
                'rule'     => self::GUARDS[$name]['meaning'],
                'rows'     => $bad->count(),
                'batch_ids' => $bad->pluck('id')->all(),
            ]);
            return 'blocked';
        }

        DB::connection($connection)->statement("ALTER TABLE inventory_batches ADD CONSTRAINT {$name} CHECK (" . self::GUARDS[$name]['check'] . ')');

        return 'installed';
    }
}
