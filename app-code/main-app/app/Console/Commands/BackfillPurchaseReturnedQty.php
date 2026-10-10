<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * purchases:backfill-returned-qty
 *
 * `purchase_items.returned_qty` (added with the ZeroDrift Ledger) counts how
 * many units of each purchase line have gone back to the supplier. Returns
 * made before it existed did not record it, so:
 *   - the per-line cap does not see them, and
 *   - the next return on that line values its share as if nothing had gone
 *     back yet (off by a paisa or two at most).
 *
 * There is no per-line return table. What the system did record for every
 * unit that went back is a `stock_movements` row of type `purchase_return`:
 *   - a purchase return (PurchaseService::createReturn) references the bill's
 *     invoice number;
 *   - a debit note against a bill references the note's number, and the note
 *     names the bill (`debit_notes.purchase_id`).
 * This command adds those units up per bill and product and spreads them over
 * the bill's lines of that product in order, never past a line's quantity.
 * Exact when a product sits on one line of the bill; when it sits on several,
 * the split is by line order and the row is marked "approx".
 *
 * Safe to run more than once and after new returns: it only adds what the movement
 * log proves went back and the lines do not already count; it never lowers
 * returned_qty.
 *
 * Dry run by default. Pass --apply to write.
 */
class BackfillPurchaseReturnedQty extends Command
{
    protected $signature = 'purchases:backfill-returned-qty
        {--tenant= : Only this tenant ID}
        {--apply : Write the changes (default is a dry run)}';

    protected $description = 'Fill purchase_items.returned_qty for purchase returns and debit notes made before it existed.';

    public function handle(): int
    {
        if (! Schema::hasColumn('purchase_items', 'returned_qty')) {
            $this->error('purchase_items.returned_qty does not exist yet. Run the migrations first.');
            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');
        $this->info($apply ? 'Writing returned_qty.' : 'DRY RUN: nothing will be written. Pass --apply to write.');

        $tenants = DB::table('tenants')->when($this->option('tenant'), fn ($q, $t) => $q->where('id', $t))->pluck('id');
        $rows = [];
        $skipped = [];
        $changed = 0;

        foreach ($tenants as $tenantId) {
            $res = $this->tenant($tenantId, $apply);
            $rows = array_merge($rows, $res['rows']);
            $skipped = array_merge($skipped, $res['skipped']);
            $changed += $res['changed'];
        }

        if ($rows) {
            $this->table(['tenant', 'bill', 'line', 'qty', 'was', 'now', 'note'], $rows);
        }
        foreach ($skipped as $s) {
            $this->warn($s);
        }
        $this->info(($apply ? 'Updated ' : 'Would update ') . "{$changed} purchase line(s).");

        return self::SUCCESS;
    }

    /**
     * @return array{rows: array, skipped: array, changed: int}
     */
    public function tenant($tenantId, bool $apply): array
    {
        $rows = [];
        $skipped = [];
        $changed = 0;

        // returned units per bill and product
        $returned = []; // purchase_id => product_id => qty

        // 1. Purchase returns: movements reference the bill's invoice number.
        $billsByInvoice = DB::table('purchases')->where('tenant_id', $tenantId)
            ->whereNotNull('invoice_number')
            ->get(['id', 'invoice_number'])
            ->groupBy('invoice_number');
        $withReturns = DB::table('purchase_returns')->where('tenant_id', $tenantId)
            ->distinct()->pluck('purchase_id')->flip();

        $moves = DB::table('stock_movements')->where('tenant_id', $tenantId)
            ->where('type', 'purchase_return')
            ->where(fn ($q) => $q->whereNull('description')->orWhere('description', 'not like', 'Debit Note / Return%'))
            ->selectRaw('reference_id, product_id, SUM(-quantity) as qty')
            ->groupBy('reference_id', 'product_id')
            ->get();

        foreach ($moves as $m) {
            $bills = $billsByInvoice->get($m->reference_id);
            if (! $bills) {
                continue; // not a bill reference (e.g. an older debit note format)
            }
            if ($bills->count() > 1) {
                // Several bills share this invoice number: only attribute it
                // when exactly one of them actually has purchase returns.
                $bills = $bills->filter(fn ($b) => $withReturns->has($b->id));
                if ($bills->count() !== 1) {
                    $skipped[] = "Tenant {$tenantId}: invoice {$m->reference_id} is used by several bills; its returns were not attributed. Check by hand.";
                    continue;
                }
            }
            $pid = $bills->first()->id;
            $returned[$pid][$m->product_id] = ($returned[$pid][$m->product_id] ?? 0) + (float) $m->qty;
        }

        // 2. Debit notes that name a bill: movements reference the note.
        if (Schema::hasColumn('debit_notes', 'purchase_id')) {
            $notes = DB::table('debit_notes')
                ->when(Schema::hasColumn('debit_notes', 'tenant_id'), fn ($q) => $q->where('tenant_id', $tenantId))
                ->whereNotNull('purchase_id')
                ->pluck('purchase_id', 'reference_number');
            if ($notes->isNotEmpty()) {
                $noteMoves = DB::table('stock_movements')->where('tenant_id', $tenantId)
                    ->where('type', 'purchase_return')
                    ->whereIn('reference_id', $notes->keys())
                    ->selectRaw('reference_id, product_id, SUM(-quantity) as qty')
                    ->groupBy('reference_id', 'product_id')
                    ->get();
                foreach ($noteMoves as $m) {
                    $pid = $notes[$m->reference_id];
                    $returned[$pid][$m->product_id] = ($returned[$pid][$m->product_id] ?? 0) + (float) $m->qty;
                }
            }
        }

        // 3. Spread over the bill's lines of that product, in order.
        foreach ($returned as $purchaseId => $byProduct) {
            $invoice = DB::table('purchases')->where('id', $purchaseId)->value('invoice_number');
            foreach ($byProduct as $productId => $qty) {
                if ($qty <= 0.00005) {
                    continue;
                }
                $lines = DB::table('purchase_items')
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $purchaseId)
                    ->where('product_id', $productId)
                    ->orderBy('created_at')->orderBy('id')
                    ->get(['id', 'qty', 'returned_qty']);
                if ($lines->isEmpty()) {
                    continue; // went back FIFO, not off this bill
                }
                $approx = $lines->count() > 1;
                // Only what the lines do not already account for is missing
                // (returns made after the column existed are recorded already).
                $left = $qty - $lines->sum(fn ($l) => (float) ($l->returned_qty ?? 0));
                foreach ($lines as $line) {
                    if ($left <= 0.00005) {
                        break;
                    }
                    $lineQty = (float) $line->qty;
                    $was = (float) ($line->returned_qty ?? 0);
                    $n = min($left, max(0.0, $lineQty - $was));
                    if ($n <= 0.00005) {
                        continue;
                    }
                    $left -= $n;
                    $changed++;
                    $rows[] = [$tenantId, $invoice, $line->id, $lineQty, $was, round($was + $n, 4), $approx ? 'approx (product on several lines)' : 'exact'];
                    if ($apply) {
                        DB::table('purchase_items')->where('id', $line->id)->where('tenant_id', $tenantId)
                            ->increment('returned_qty', round($n, 4));
                    }
                }
                if ($left > 0.00005) {
                    $skipped[] = "Tenant {$tenantId}: bill {$invoice} has {$left} more unit(s) of product {$productId} returned than its lines hold. Check by hand.";
                }
            }
        }

        return ['rows' => $rows, 'skipped' => $skipped, 'changed' => $changed];
    }
}
