<?php

namespace Tester\Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Account;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;

class FifoDeterminismTest extends VenQoreTestCase
{
    public function test_fifo_cogs_determinism_under_same_timestamps()
    {
        date_default_timezone_set('UTC');
        \Carbon\Carbon::setTestNow('2025-05-15 12:00:00');

        // Run a loop 3 times to ensure the FIFO/COGS output is stable and deterministic
        for ($run = 1; $run <= 3; $run++) {
            date_default_timezone_set('UTC');
            $tenant = $this->createTenant("fifo-det-store-{$run}", 'ltd_3');
            $tenant->update(['timezone' => 'UTC']);
            $this->actingAsOwner($tenant);
            $this->seedTenantDefaults($tenant);
            DB::table('settings')->where('tenant_id', $tenant->id)->where('key', 'timezone')->update(['value' => 'UTC']);
            app()->instance('current.tenant', $tenant);

            $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

            $customer = Party::factory()->create([
                'tenant_id' => $tenant->id,
                'type' => 'customer',
                'credit_limit' => 100000.00
            ]);

            $supplier = Party::factory()->create([
                'tenant_id' => $tenant->id,
                'type' => 'supplier',
            ]);

            $product = Product::factory()->create([
                'tenant_id' => $tenant->id,
                'price' => 200.00,
                'cost_price' => 50.00,
                'tax_rate' => 0.0,
            ]);

            Stock::updateOrCreate(
                ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
                ['quantity' => 0]
            );

            // Purchase 10 @ 50 (12:00:00)
            \Carbon\Carbon::setTestNow('2025-05-15 12:00:00');
            $purchasePayload1 = [
                'supplier_id' => $supplier->id,
                'warehouse_id' => $warehouseId,
                'payment_method' => 'credit',
                'purchase_date' => '2025-05-15',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'qty' => 10,
                        'unit_cost' => 50.00,
                        'tax_rate' => 0,
                        'business_pct' => 100,
                    ]
                ],
            ];
            $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload1)->assertStatus(302);

            // Purchase 10 @ 100 (12:01:00)
            \Carbon\Carbon::setTestNow('2025-05-15 12:01:00');
            $purchasePayload2 = [
                'supplier_id' => $supplier->id,
                'warehouse_id' => $warehouseId,
                'payment_method' => 'credit',
                'purchase_date' => '2025-05-15',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'qty' => 10,
                        'unit_cost' => 100.00,
                        'tax_rate' => 0,
                        'business_pct' => 100,
                    ]
                ],
            ];
            $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload2)->assertStatus(302);

            // Sell 15 @ 200 (12:02:00)
            \Carbon\Carbon::setTestNow('2025-05-15 12:02:00');
            $salePayload = [
                'customer_id' => $customer->id,
                'warehouse_id' => $warehouseId,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 15,
                        'price' => 200.00,
                        'discount' => 0,
                    ]
                ],
                'discount' => 0,
                'amount_paid' => 0,
                'payment_method' => 'credit',
                'add_to_ledger' => true,
            ];
            $res = $this->postJson("/s/{$tenant->slug}/sales", $salePayload);
            $res->assertStatus(200);

            $saleId = $res->json('sale_id');
            $saleItemId = DB::table('sale_items')->where('sale_id', $saleId)->value('id');

            // Return 2 items (12:03:00)
            \Carbon\Carbon::setTestNow('2025-05-15 12:03:00');
            $returnPayload = [
                'items' => [['id' => $saleItemId, 'quantity' => 2]],
                'refund_method' => 'ledger',
                'refund_source' => 'cash_drawer',
                'reason' => 'parity return',
            ];
            $this->postJson("/s/{$tenant->slug}/sales/{$saleId}/return", $returnPayload)->assertStatus(302);

            // Check COGS from FRS engine
            $frs = app(FinancialReportingService::class);
            $pl = $frs->getProfitAndLoss('2025-05-15', '2025-05-15');

            // COGS must be exactly 800.00 and stable across all runs
            $this->assertEquals(800.00, (float) $pl['cogs'], "COGS must be exactly 800.00 on run {$run}");

        }

        \Carbon\Carbon::setTestNow();
    }
}
