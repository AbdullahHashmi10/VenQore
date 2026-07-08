<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Party;
use App\Models\Product;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Services\PurchaseService;
use App\Http\Controllers\PosController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;

class PaymentAllocationTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_purchase_service_creates_payment_allocation_with_correct_columns(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);

        // Create product
        $product = Product::create([
            'name' => 'Item X',
            'sku' => 'SKU-X',
            'price' => 10.0,
            'cost_price' => 5.0,
            'base_unit' => 'PCS',
        ]);

        // Create supplier
        $supplier = Party::create([
            'name' => 'Supplier X',
            'type' => 'supplier',
        ]);

        // Run PurchaseService
        $service = app(PurchaseService::class);
        $invoice = $service->createPurchase([
            'supplier_id' => $supplier->id,
            'date' => '2026-07-08',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'discount' => 0,
            'tax' => 0,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                    'unit_price' => 5.0,
                ]
            ]
        ]);

        $this->assertNotNull($invoice);

        // Verify Payment and PaymentAllocation
        $payment = Payment::first();
        $this->assertNotNull($payment);

        $allocation = PaymentAllocation::first();
        $this->assertNotNull($allocation);
        $this->assertEquals($payment->id, $allocation->payment_journal_entry_id);
        $this->assertEquals($invoice->id, $allocation->purchase_id);
        $this->assertEquals(50.0, $allocation->allocated_amount);
    }
}
