<?php

namespace Tests\Feature\ZeroDrift;

use App\Engines\PurchaseService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * purchase_items.returned_qty: debit notes against a bill now count toward
 * it, and `purchases:backfill-returned-qty` restores it for returns made
 * before the column existed — after which the per-line cap and the exact
 * return valuation work for those bills too.
 */
class PurchaseReturnedQtyBackfillTest extends ZeroDriftTestCase
{
    private function bill(array $lines): object
    {
        return app(PurchaseService::class)->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId, 'purchase_date' => now()->toDateString(),
            'payment_method' => 'credit', 'discount' => '0.07',
            'items' => $lines,
        ]);
    }

    private function line(string $purchaseId, string $productId): object
    {
        return DB::table('purchase_items')->where('purchase_id', $purchaseId)->where('product_id', $productId)->first();
    }

    private function debitNote(string $purchaseId, string $productId, float $qty, string $ref): void
    {
        DB::table('debit_notes')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'reference_number' => $ref, 'supplier_id' => $this->supplierId,
            'purchase_id' => $purchaseId, 'date' => now()->toDateString(), 'amount' => 0, 'status' => 'approved', 'tax' => 0, 'tax_rate' => 0,
            'discount' => 0, 'warehouse_id' => $this->warehouseId, 'returns_stock' => 1, 'created_by' => $this->user->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        app(PurchaseService::class)->returnStockToSupplier($productId, $this->warehouseId, $qty, $purchaseId, $ref, "Debit Note / Return ($ref)");
    }

    public function test_a_debit_note_against_a_bill_counts_toward_the_line_cap(): void
    {
        $a = $this->product();
        $p = $this->bill([['product_id' => $a, 'qty' => 5, 'unit_cost' => '33.3333', 'tax_rate' => 17]]);
        $this->debitNote($p->id, $a, 2, 'DN-CAP-1');
        $this->assertEquals(2.0, (float) $this->line($p->id, $a)->returned_qty);

        $svc = app(PurchaseService::class);
        $pi = $this->line($p->id, $a);
        $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'r', 'items' => [['purchase_item_id' => $pi->id, 'qty_returned' => 3]]]);
        $this->assertEquals(5.0, (float) $this->line($p->id, $a)->returned_qty);
    }

    public function test_backfill_restores_old_returns_and_is_safe_to_rerun(): void
    {
        $svc = app(PurchaseService::class);
        [$a, $b, $c] = [$this->product(), $this->product(), $this->product()];
        $p = $this->bill([
            ['product_id' => $a, 'qty' => 5, 'unit_cost' => '33.3333', 'tax_rate' => 17],
            ['product_id' => $b, 'qty' => 4, 'unit_cost' => '10.0049', 'tax_rate' => 0],
            ['product_id' => $c, 'qty' => 3, 'unit_cost' => '7.1234', 'tax_rate' => 5],
        ]);
        $other = $this->bill([['product_id' => $a, 'qty' => 2, 'unit_cost' => '9.99', 'tax_rate' => 0]]);

        // Returns made "before the column existed": a purchase return of 2 A,
        // a debit note of 1 B, and nothing for C ...
        $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'old', 'items' => [['purchase_item_id' => $this->line($p->id, $a)->id, 'qty_returned' => 2]]]);
        $this->debitNote($p->id, $b, 1, 'DN-OLD-1');
        // ... a return on another bill that must not leak onto this one ...
        $svc->createReturn($other->id, ['return_date' => now()->toDateString(), 'reason' => 'other', 'items' => [['purchase_item_id' => $this->line($other->id, $a)->id, 'qty_returned' => 1]]]);
        // ... and the column wiped, as it is for every return made before it existed.
        DB::table('purchase_items')->where('tenant_id', $this->tenantId)->update(['returned_qty' => 0]);

        // Dry run writes nothing.
        Artisan::call('purchases:backfill-returned-qty', ['--tenant' => $this->tenantId]);
        $this->assertStringContainsString('Would update 3 purchase line(s)', Artisan::output());
        $this->assertEquals(0.0, (float) $this->line($p->id, $a)->returned_qty);

        Artisan::call('purchases:backfill-returned-qty', ['--tenant' => $this->tenantId, '--apply' => true]);
        $this->assertStringContainsString('Updated 3 purchase line(s)', Artisan::output());
        $this->assertEquals(2.0, (float) $this->line($p->id, $a)->returned_qty);
        $this->assertEquals(1.0, (float) $this->line($p->id, $b)->returned_qty);
        $this->assertEquals(0.0, (float) $this->line($p->id, $c)->returned_qty);
        $this->assertEquals(1.0, (float) $this->line($other->id, $a)->returned_qty);

        // Re-running changes nothing.
        Artisan::call('purchases:backfill-returned-qty', ['--tenant' => $this->tenantId, '--apply' => true]);
        $this->assertStringContainsString('Updated 0 purchase line(s)', Artisan::output());

        // The rest of line A goes back; every entry still balances to the paisa.
        $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'rest', 'items' => [['purchase_item_id' => $this->line($p->id, $a)->id, 'qty_returned' => 3]]]);
        $this->assertEquals(5.0, (float) $this->line($p->id, $a)->returned_qty);
        $this->assertEveryEntryBalances();
    }
}
