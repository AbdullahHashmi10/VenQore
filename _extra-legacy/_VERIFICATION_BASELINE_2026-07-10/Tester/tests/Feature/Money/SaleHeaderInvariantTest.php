<?php

namespace Tester\tests\Feature\Money;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Party;
use App\Models\Sale;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

class SaleHeaderInvariantTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_B4_header_invariant_holds_across_many_randomized_sales()
    {
        $tenant = $this->createTenant("invariant-store", "ltd_3");
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouseId = DB::table("warehouses")->where("tenant_id", $tenant->id)->value("id");
        $customer = Party::factory()->customer()->create(["tenant_id" => $tenant->id]);

        // Create 4 products with different tax rates: 0%, 5%, 17%
        $taxRates = [0, 5, 17, 5];
        $products = [];
        foreach ($taxRates as $i => $taxRate) {
            $product = Product::factory()->create([
                "tenant_id" => $tenant->id,
                "name" => "Product " . ($i + 1),
                "cost_price" => 50.00,
                "price" => 100.00 + ($i * 20), // 100, 120, 140, 160
                "tax_rate" => $taxRate,
            ]);

            // Add stock using Eloquent to get generated UUID
            Stock::create([
                "tenant_id" => $tenant->id,
                "product_id" => $product->id,
                "warehouse_id" => $warehouseId,
                "quantity" => 1000.00,
            ]);

            // Add FIFO batch
            DB::table("inventory_batches")->insert([
                "id" => Str::uuid()->toString(),
                "tenant_id" => $tenant->id,
                "product_id" => $product->id,
                "warehouse_id" => $warehouseId,
                "unit_cost" => 50.00,
                "original_qty" => 1000.00,
                "initial_qty" => 1000.00,
                "remaining_qty" => 1000.00,
                "created_at" => now(),
                "updated_at" => now(),
            ]);

            $products[] = $product;
        }

        // Loop 40 iterations
        $iterations = 40;
        for ($iter = 0; $iter < $iterations; $iter++) {
            // Pick 1 to 4 random products
            $numItems = rand(1, 4);
            $selectedProducts = array_slice($products, 0, $numItems);
            shuffle($selectedProducts);

            $itemsPayload = [];
            $subtotalGrossExpected = 0.0;
            $totalItemDiscountsExpected = 0.0;

            foreach ($selectedProducts as $product) {
                // Random quantity (fractional or integer)
                $qtyOptions = [1, 2, 2.5, 3.25, 1.5, 4];
                $quantity = $qtyOptions[array_rand($qtyOptions)];
                $price = (float) $product->price;
                $lineGross = $quantity * $price;

                // Random line discount
                $lineDiscountOptions = [0, 5, 10, 12.50];
                $discount = $lineDiscountOptions[array_rand($lineDiscountOptions)];
                if ($discount > $lineGross) {
                    $discount = 0.0;
                }

                $itemsPayload[] = [
                    "product_id" => $product->id,
                    "quantity" => $quantity,
                    "price" => $price,
                    "discount" => $discount,
                ];

                $subtotalGrossExpected += $lineGross;
                $totalItemDiscountsExpected += $discount;
            }

            // Global discount: up to subtotal-after-item-discounts
            $subtotalAfterItemDiscounts = $subtotalGrossExpected - $totalItemDiscountsExpected;
            $globalDiscountOptions = [0, 5, 15, 20.00];
            $globalDiscount = $globalDiscountOptions[array_rand($globalDiscountOptions)];
            if ($globalDiscount > $subtotalAfterItemDiscounts) {
                $globalDiscount = 0.0;
            }

            $payload = [
                "customer_id" => $customer->id,
                "warehouse_id" => $warehouseId,
                "items" => $itemsPayload,
                "discount" => $globalDiscount,
                "amount_paid" => 10000.00, // Pay ample amount to keep invoicing simple
                "payment_method" => "cash",
                "add_to_ledger" => true,
            ];

            $response = $this->postJson("/s/{$tenant->slug}/sales", $payload);
            
            if ($response->status() !== 200) {
                dd('Sale posting failed with status: ' . $response->status(), $response->json(), $payload);
            }

            $response->assertStatus(200);
            $saleId = $response->json("sale_id");
            $sale = Sale::findOrFail($saleId);

            // Fetch the stored values
            $subtotalGross = (float) $sale->subtotal_gross;
            $totalItemDiscounts = (float) $sale->total_item_discounts;
            $dbGlobalDiscount = (float) $sale->global_discount;
            $netSales = (float) $sale->net_sales;
            $totalTax = (float) $sale->total_tax;
            $invoiceTotal = (float) $sale->invoice_total;

            // Invariant A: subtotal_gross - total_item_discounts - global_discount == net_sales (within epsilon)
            $expectedNetSales = $subtotalGross - $totalItemDiscounts - $dbGlobalDiscount;
            $diffA = abs($expectedNetSales - $netSales);
            if ($diffA >= 0.01) {
                dd([
                    'payload' => $payload,
                    'db_record' => $sale->toArray(),
                    'expectedNetSales' => $expectedNetSales,
                    'netSales' => $netSales
                ]);
            }
            $this->assertTrue(
                $diffA < 0.01,
                "Iteration {$iter} Failed Invariant A: subtotal_gross ({$subtotalGross}) - total_item_discounts ({$totalItemDiscounts}) - global_discount ({$dbGlobalDiscount}) = expected {$expectedNetSales}, got net_sales {$netSales}. Diff: {$diffA}"
            );

            // Invariant B: net_sales + total_tax == invoice_total (assuming no shipping charges)
            $expectedInvoiceTotal = $netSales + $totalTax + (float)$sale->shipping_charges;
            $diffB = abs($expectedInvoiceTotal - $invoiceTotal);
            $this->assertTrue(
                $diffB < 0.01,
                "Iteration {$iter} Failed Invariant B: net_sales ({$netSales}) + total_tax ({$totalTax}) + shipping ({$sale->shipping_charges}) = expected {$expectedInvoiceTotal}, got invoice_total {$invoiceTotal}. Diff: {$diffB}"
            );

            // Invariant C: net_sales >= 0 and invoice_total >= 0 (clamp test)
            $this->assertTrue($netSales >= 0, "Iteration {$iter} Failed Invariant C: net_sales is negative ({$netSales})");
            $this->assertTrue($invoiceTotal >= 0, "Iteration {$iter} Failed Invariant C: invoice_total is negative ({$invoiceTotal})");

            // Invariant D: Journal entry trial balance balances to zero
            $this->assertTrialBalanceZero($tenant);
        }
    }
}
