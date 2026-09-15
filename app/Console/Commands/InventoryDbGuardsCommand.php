<?php

namespace App\Console\Commands;

use App\Support\InventoryDbGuards;
use Illuminate\Console\Command;

/**
 * Pre/post-deploy check for the inventory CHECK constraints.
 *
 *   php artisan venqore:db-guards --check     read-only; exit 1 if a guard is missing
 *   php artisan venqore:db-guards --install   add missing guards whose data is clean
 *
 * Never changes inventory data. Rows that block a guard are listed so they can
 * be reconciled against the real stock before installing.
 */
class InventoryDbGuardsCommand extends Command
{
    protected $signature = 'venqore:db-guards {--check : Report only (default)} {--install : Install missing guards when the data allows} {--connection= : Database connection (default: the app default)}';

    protected $description = 'Check (and optionally install) the inventory_batches database guards without touching data';

    public function handle(): int
    {
        $conn = $this->option('connection') ?: null;
        if (!InventoryDbGuards::supported($conn)) {
            $this->warn('Not a MySQL/MariaDB connection — CHECK guards are not managed here.');
            return self::SUCCESS;
        }

        $missing = 0;
        foreach (InventoryDbGuards::GUARDS as $name => $def) {
            if ($this->option('install')) {
                $result = InventoryDbGuards::installIfClean($name, $conn);
            } else {
                $result = InventoryDbGuards::exists($name, $conn) ? 'present' : 'missing';
            }

            $bad = $result === 'present' || $result === 'installed' ? collect() : InventoryDbGuards::violations($name, 500, $conn);
            $this->line(sprintf('%-28s %-10s %s', $name, strtoupper($result), $def['meaning']));

            if (!in_array($result, ['present', 'installed'], true)) {
                $missing++;
                if ($bad->isNotEmpty()) {
                    $this->warn("  {$bad->count()} row(s) block this guard (reconcile against real stock first):");
                    $this->table(['batch id', 'store', 'product', 'type', 'remaining', 'unit cost'],
                        $bad->take(50)->map(fn ($r) => [$r->id, $r->tenant_id ?? '', $r->product_id ?? '', $r->batch_type, $r->remaining_qty, $r->unit_cost])->all());
                } elseif ($result === 'missing') {
                    $this->line('  No blocking rows — run with --install to add it.');
                }
            }
        }

        return $missing === 0 ? self::SUCCESS : self::FAILURE;
    }
}
