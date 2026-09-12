<?php

namespace Tests\Feature\Production;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * POS-003 — COGS must come from consumed FIFO batches, never from cost_price.
 *
 * Rewritten 2026-09-10. The earlier version posted to /sales WITHOUT signing in,
 * so it only ever hit a login redirect and then inspected an unrelated seeded
 * sale_item. It now drives the real POS endpoint (POST /s/{slug}/sales, the one
 * Pos.jsx calls) as a cashier, with a product whose cost_price (999) differs
 * from its batch cost (40), and checks the ledger.
 *
 * SaleController@store's L006 fix removed the fabrication fallback; this test
 * proves it, so the POS-003 waiver in quarantine.yaml is closed.
 */
class LegacyPosCogsPinningTest extends VenQoreTestCase
{
    public function test_pos003_cogs_is_from_fifo_not_fabricated(): void
    {
        $tenant = $this->createTenant('pos003-store', 'ltd_3', 'active');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUserModel($cashier, $tenant);
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'cost_price' => 999.00,   // deliberately wrong "configured" cost
            'price'      => 150.00,
            'tax_rate'   => 0,
        ]);
        Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $warehouseId], ['quantity' => 5]);
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $product->id,
            'warehouse_id' => $warehouseId, 'unit_cost' => 40.00, 'original_qty' => 5,
            'initial_qty' => 5, 'remaining_qty' => 5, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $party = Party::factory()->customer()->create(['tenant_id' => $tenant->id]);

        $response = $this->postJson("/s/{$tenant->slug}/sales", [
            'customer_id'    => $party->id,
            'warehouse_id'   => $warehouseId,
            'items'          => [['product_id' => $product->id, 'quantity' => 2, 'price' => 150.00, 'discount' => 0]],
            'discount'       => 0,
            'amount_paid'    => 300.00,
            'payment_method' => 'cash',
        ]);

        // A cashier (pos.checkout) must be able to ring a sale.
        $response->assertStatus(200);

        $sale = Sale::findOrFail($response->json('sale_id'));
        $item = $sale->items()->firstOrFail();

        $batchCogs = (float) DB::table('sale_item_batches')->where('sale_item_id', $item->id)->sum('total_cogs');
        $this->assertEqualsWithDelta(80.00, $batchCogs, 0.01, 'COGS must be 2 × batch cost 40 = 80.');

        // The ledger's COGS debit for this sale must equal the batch cost, not 2 × 999.
        $cogsDebit = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $tenant->id)
            ->where('a.code', '5000')
            ->sum('ji.debit');
        $this->assertEqualsWithDelta(80.00, $cogsDebit, 0.01, 'POS-003: ledger COGS was fabricated from cost_price.');

        $this->assertTrialBalanceZero($tenant);
    }

    public function test_pos003_sale_is_blocked_rather_than_fabricated_when_stock_is_missing(): void
    {
        $tenant = $this->createTenant('pos003-block', 'ltd_3', 'active');
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUserModel($owner, $tenant);
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

        $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 999.00, 'price' => 150.00, 'tax_rate' => 0]);
        // No batches at all.

        $before = DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();
        $response = $this->postJson("/s/{$tenant->slug}/sales", [
            'warehouse_id'   => $warehouseId,
            'items'          => [['product_id' => $product->id, 'quantity' => 1, 'price' => 150.00, 'discount' => 0]],
            'amount_paid'    => 150.00,
            'payment_method' => 'cash',
        ]);

        if ($response->getStatusCode() === 200) {
            // Allowed (negative stock enabled): COGS must still not be 999-fabricated
            // without a batch trail — the engine may use a zero/unknown cost, never cost_price silently.
            $item = Sale::findOrFail($response->json('sale_id'))->items()->firstOrFail();
            $batches = DB::table('sale_item_batches')->where('sale_item_id', $item->id)->count();
            $cogsDebit = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('je.tenant_id', $tenant->id)->where('a.code', '5000')->sum('ji.debit');
            $this->assertTrue($batches > 0 || $cogsDebit < 999.0, 'POS-003: COGS fabricated from cost_price with no batch trail.');
            $this->assertTrialBalanceZero($tenant);
        } else {
            $this->assertContains($response->getStatusCode(), [409, 422], 'A stockout must be refused cleanly.');
            $this->assertSame($before, DB::table('journal_entries')->where('tenant_id', $tenant->id)->count(), 'A refused sale must post nothing.');
        }
    }
}
