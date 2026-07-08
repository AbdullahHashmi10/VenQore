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

    public function test_pos_controller_record_payment_creates_payment_allocation_with_correct_columns(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);

        // Create customer
        $customer = Party::create([
            'name' => 'Customer Y',
            'type' => 'customer',
        ]);

        // Create dummy Invoice (represented as Sale or general invoice)
        $invoice = Invoice::create([
            'invoice_number' => 'INV-TEST-123',
            'date' => '2026-07-08',
            'party_id' => $customer->id,
            'type' => 'sale',
            'status' => 'unpaid',
            'subtotal' => 100.0,
            'total_amount' => 100.0,
            'user_id' => auth()->id(),
        ]);

        // Call private recordPayment using reflection
        $controller = new PosController();
        $method = new ReflectionMethod(PosController::class, 'recordPayment');
        $method->setAccessible(true);
        $method->invoke($controller, $invoice, 100.0, 'cash');

        // Verify Payment and PaymentAllocation
        $payment = Payment::first();
        $this->assertNotNull($payment);

        $allocation = PaymentAllocation::first();
        $this->assertNotNull($allocation);
        $this->assertEquals($payment->id, $allocation->payment_journal_entry_id);
        $this->assertEquals($invoice->id, $allocation->sale_id);
        $this->assertEquals(100.0, $allocation->allocated_amount);
    }
}
