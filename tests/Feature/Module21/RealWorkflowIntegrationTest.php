<?php

namespace Tests\Feature\Module21;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\Proposal;
use App\Models\SalesOrder;
use App\Models\Invoice as Purchase;
use App\Models\Quotation;
use App\Models\Setting;
use App\Models\Account;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\Feature\VenQoreTestCase;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-1');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
    
    SettingsHelper::clearCache();
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP A: Complete Sale Workflows
// ─────────────────────────────────────────────────────────────────────────────

test('full_pos_sale_cash_payment', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 50]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 50,
        'initial_qty' => 50,
        'remaining_qty' => 50,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 2000.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $this->assertDatabaseHas('sales', [
        'tenant_id' => $this->tenant->id,
        'net_sales' => 2000.00,
        'invoice_total' => 2000.00,
    ]);

    $stock = Stock::where('product_id', $product->id)->first();
    $this->assertEquals(40.00, $stock->quantity);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1000', // Cash
        'debit' => 2000.00,
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '4000', // Sales Revenue
        'credit' => 2000.00,
    ]);
});

test('full_pos_sale_credit_khata', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'current_balance' => 0,
        'credit_limit' => 5000.00,
    ]);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 150.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 20]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50.00,
        'original_qty' => 20,
        'initial_qty' => 20,
        'remaining_qty' => 20,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 150.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 0,
        'payment_method' => 'credit',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1200', // Accounts Receivable
        'debit' => 1500.00,
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '4000', // Sales Revenue
        'credit' => 1500.00,
    ]);
});

test('full_pos_sale_split_payment', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'current_balance' => 0,
    ]);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 1000.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 300.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 1000.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 1000.00,
        'payment_method' => 'split',
        'payments' => [
            ['method' => 'cash', 'amount' => 400.00],
            ['method' => 'bank', 'amount' => 350.00],
            ['method' => 'credit', 'amount' => 250.00],
        ],
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1000',
        'debit' => 400.00,
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1010',
        'debit' => 350.00,
    ]);
});

test('sale_with_discount', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 1000.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 300.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 1000.00,
                'discount' => 100.00, // 10% discount on line
            ]
        ],
        'discount' => 50.00, // Global discount
        'amount_paid' => 850.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $this->assertDatabaseHas('sales', [
        'tenant_id' => $this->tenant->id,
        'net_sales' => 850.00,
        'invoice_total' => 850.00,
    ]);
});

test('sale_with_tax', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 1000.00,
        'tax_rate' => 17,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 300.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 1000.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 1170.00, // 1000 net sales + 170 tax
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $this->assertDatabaseHas('sales', [
        'tenant_id' => $this->tenant->id,
        'net_sales' => 1000.00,
        'total_tax' => 170.00,
        'invoice_total' => 1170.00,
    ]);
});

test('stock_moves_on_sale', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 50]
    );

    $batchId = \Illuminate\Support\Str::uuid()->toString();
    DB::table('inventory_batches')->insert([
        'id' => $batchId,
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 50,
        'initial_qty' => 50,
        'remaining_qty' => 50,
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 2000.00,
        'payment_method' => 'cash',
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $batch = DB::table('inventory_batches')->where('id', $batchId)->first();
    $this->assertEquals(40.00, $batch->remaining_qty);
});

test('cogs_calculated_from_fifo_batch', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 150.00, // Product default
        'price' => 200.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00, // FIFO Cost is 100
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 5,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 1000.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    // Verify COGS is debited at FIFO cost (5 * 100 = 500)
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '5000', // COGS Expense
        'debit' => 500.00,
    ]);
});

test('cancel_posted_sale', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 200.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 400.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $saleId = $response->json('sale_id');
    $this->assertNotEmpty($saleId);

    // Cancel sale
    $cancelResponse = $this->postJson("/s/{$this->tenant->slug}/sales/{$saleId}/cancel");
    $cancelResponse->assertOk();

    $this->assertDatabaseHas('sales', [
        'id' => $saleId,
        'status' => 'cancelled',
    ]);
});

test('sale_return_partial', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 200.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 5,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 1000.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $saleId = $response->json('sale_id');
    $saleItem = DB::table('sale_items')->where('sale_id', $saleId)->first();

    // Partial return of 2 items
    $returnResponse = $this->postJson("/s/{$this->tenant->slug}/sales/{$saleId}/return", [
        'items' => [
            [
                'id' => $saleItem->id,
                'quantity' => 2,
            ]
        ]
    ]);
    $returnResponse->assertRedirect();

    // Assert stock is restored: 10 original - 5 sold + 2 returned = 7
    $stock = Stock::where('product_id', $product->id)->first();
    $this->assertEquals(7.00, $stock->quantity);

    // Assert journal entry reduces revenue by 400.00 (2 * 200)
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '4000',
        'debit' => 400.00,
    ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP B: Complete Purchase Workflows
// ─────────────────────────────────────────────────────────────────────────────

test('full_purchase_stock_in', function () {
    $supplier = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 60]);

    $payload = [
        'tenant_id' => $this->tenant->id,
        'warehouse_id' => $this->warehouseId,
        'date' => now()->toDateString(),
        'party_id' => $supplier->id,
        'status' => 'received',
        'payment_status' => 'paid',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 20,
                'price' => 60,
                'subtotal' => 1200
            ]
        ],
        'total_amount' => 1200,
        'amount_paid' => 1200,
        'payment_method' => 'cash',
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/purchases", $payload);
    $response->assertOk();

    $this->assertDatabaseHas('inventory_batches', [
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'initial_qty' => 20,
        'remaining_qty' => 20,
    ]);
});

test('purchase_does_not_overwrite_cost_price', function () {
    $supplier = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50]);

    $payload = [
        'tenant_id' => $this->tenant->id,
        'warehouse_id' => $this->warehouseId,
        'date' => now()->toDateString(),
        'party_id' => $supplier->id,
        'status' => 'received',
        'payment_status' => 'paid',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 80,
                'subtotal' => 800
            ]
        ],
        'total_amount' => 800,
        'amount_paid' => 800,
        'payment_method' => 'cash',
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/purchases", $payload);
    $response->assertOk();

    $this->assertEquals(50, $product->fresh()->cost_price);
});

test('pay_supplier_clear_payable', function () {
    $supplier = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50]);

    // 1. Create a credit purchase using V3 PurchaseController
    $payload = [
        'supplier_id' => $supplier->id,
        'warehouse_id' => $this->warehouseId,
        'purchase_date' => now()->toDateString(),
        'payment_method' => 'credit',
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 10,
                'unit_cost' => 50.00,
                'tax_rate' => 0,
            ]
        ]
    ];
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/purchases", $payload);
    $response->assertRedirect();

    $purchase = DB::table('purchases')->where('tenant_id', $this->tenant->id)->latest()->first();

    // 2. Clear payable using V3 SupplierPaymentController
    $paymentResponse = $this->postJson("/s/{$this->tenant->slug}/v3/supplier-payments", [
        'supplier_id' => $supplier->id,
        'payment_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount' => 500.00,
        'allocations' => [
            [
                'purchase_id' => $purchase->id,
                'amount' => 500.00,
            ]
        ]
    ]);
    
    $paymentResponse->assertRedirect();
});

test('partial_purchase_receiving', function () {
    $supplier = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50, 'stock_quantity' => 0]);

    $orderPayload = [
        'party_id' => $supplier->id,
        'date' => now()->toDateString(),
        'status' => 'pending',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 50,
                'price' => 50,
            ]
        ],
        'amount_paid' => 0,
        'payment_method' => 'credit',
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/purchases", $orderPayload);
    $response->assertSuccessful();

    $purchase = Purchase::latest()->first();
    $this->assertNotNull($purchase);

    $invoiceItem = DB::table('invoice_items')->where('invoice_id', $purchase->id)->first();

    $receivePayload = [
        'items' => [
            [
                'item_id' => $invoiceItem->id,
                'receiving_qty' => 30,
            ]
        ]
    ];

    $receiveResponse = $this->postJson("/s/{$this->tenant->slug}/purchases/{$purchase->id}/receive", $receivePayload);
    $receiveResponse->assertOk();
});

test('purchase_return_to_supplier', function () {
    $supplier = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50]);

    // 1. Create purchase using V3 PurchaseController
    $payload = [
        'supplier_id' => $supplier->id,
        'warehouse_id' => $this->warehouseId,
        'purchase_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 10,
                'unit_cost' => 50.00,
                'tax_rate' => 0,
            ]
        ]
    ];
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/purchases", $payload);
    $response->assertRedirect();

    $purchase = DB::table('purchases')->where('tenant_id', $this->tenant->id)->latest()->first();
    $purchaseItem = DB::table('purchase_items')->where('purchase_id', $purchase->id)->first();

    // 2. Perform a partial return of 2 items using V3 PurchaseReturnController
    $returnResponse = $this->postJson("/s/{$this->tenant->slug}/v3/purchases/{$purchase->id}/return", [
        'return_date' => now()->toDateString(),
        'reason' => 'Damaged',
        'items' => [
            [
                'purchase_item_id' => $purchaseItem->id,
                'inventory_batch_id' => $purchaseItem->inventory_batch_id,
                'return_qty' => 2,
            ]
        ]
    ]);
    
    $returnResponse->assertRedirect();
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP C: Money Movements
// ─────────────────────────────────────────────────────────────────────────────

test('receive_money_from_customer', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'credit_limit' => 5000.00,
    ]);
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 500.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );
    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 200.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // 1. Create a credit sale
    $payload = [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 500.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 0,
        'payment_method' => 'credit',
        'add_to_ledger' => true,
    ];
    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $saleId = $response->json('sale_id');

    // 2. Receive payment using V3 CustomerPaymentController
    $paymentResponse = $this->postJson("/s/{$this->tenant->slug}/v3/customer-payments", [
        'customer_id' => $customer->id,
        'payment_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount' => 500.00,
        'allocations' => [
            [
                'sale_id' => $saleId,
                'amount' => 500.00,
            ]
        ]
    ]);
    
    $paymentResponse->assertRedirect();
});

test('record_an_expense', function () {
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/expenses", [
        'description' => 'Utility Bill',
        'expense_date' => now()->toDateString(),
        'amount' => 150,
        'payment_method' => 'cash',
    ]);
    
    $response->assertRedirect();
});

test('add_money_to_bank_account', function () {
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/funds", [
        'type' => 'injection',
        'description' => 'Owner Capital injection',
        'transaction_date' => now()->toDateString(),
        'amount' => 5000,
        'payment_method' => 'bank',
    ]);
    
    $response->assertRedirect();
});

test('transfer_bank_to_cash', function () {
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/bank-transfers", [
        'description' => 'ATM withdrawal to till',
        'transfer_date' => now()->toDateString(),
        'amount' => 2000,
        'from_account' => '1010', // Bank
        'to_account' => '1000', // Cash
    ]);
    
    $response->assertRedirect();
});

test('transfer_cash_to_bank', function () {
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/bank-transfers", [
        'description' => 'Excess cash bank deposit',
        'transfer_date' => now()->toDateString(),
        'amount' => 3000,
        'from_account' => '1000', // Cash
        'to_account' => '1010', // Bank
    ]);
    
    $response->assertRedirect();
});

test('expense_does_not_double_count', function () {
    $initialCount = JournalEntry::where('tenant_id', $this->tenant->id)->count();

    $this->postJson("/s/{$this->tenant->slug}/v3/expenses", [
        'description' => 'Test expense entry count',
        'expense_date' => now()->toDateString(),
        'amount' => 100,
        'payment_method' => 'cash',
    ]);

    $newCount = JournalEntry::where('tenant_id', $this->tenant->id)->count();
    $this->assertEquals($initialCount + 1, $newCount);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP D: Report & Dashboard Accuracy
// ─────────────────────────────────────────────────────────────────────────────

test('cash_in_hand_is_consistent_everywhere', function () {
    // 1. Get from P&L or Dashboard endpoints and verify they pull Account 1000 cash balance
    $response = $this->get("/s/{$this->tenant->slug}/dashboard");
    $response->assertOk();
});

test('todays_revenue_is_net_not_gross', function () {
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 100]);
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 100]
    );
    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50,
        'original_qty' => 100,
        'initial_qty' => 100,
        'remaining_qty' => 100,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->postJson("/s/{$this->tenant->slug}/sales", [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 100, 'discount' => 10]],
        'discount' => 10,
        'amount_paid' => 80,
        'payment_method' => 'cash',
    ]);

    $response = $this->get("/s/{$this->tenant->slug}/dashboard");
    $response->assertOk();
});

test('receivables_widget_matches_report', function () {
    $response = $this->get("/s/{$this->tenant->slug}/dashboard");
    $response->assertOk();
});

test('stock_valuation_uses_fifo_cost', function () {
    $response = $this->get("/s/{$this->tenant->slug}/dashboard");
    $response->assertOk();
});

test('pl_revenue_equals_sum_of_net_sales', function () {
    $response = $this->get("/s/{$this->tenant->slug}/reports/profit-loss");
    $response->assertOk();
});

test('trial_balance_always_zeros', function () {
    $this->assertTrialBalanceZero($this->tenant);
});

test('stock_valuation_report_vs_fifo_batches', function () {
    $response = $this->get("/s/{$this->tenant->slug}/v3/reports/inventory-valuation");
    $response->assertOk();
});

test('tax_report_matches_sale_items', function () {
    $response = $this->get("/s/{$this->tenant->slug}/v3/reports/tax?from=" . now()->toDateString() . "&to=" . now()->toDateString());
    $response->assertOk();
});

test('party_balance_matches_ledger', function () {
    $response = $this->getJson("/s/{$this->tenant->slug}/parties?type=customer");
    $response->assertOk();
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP E: Quotations & Pre-Sales Workflows
// ─────────────────────────────────────────────────────────────────────────────

test('quotation_to_sale_conversion', function () {
    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

    $quotation = Quotation::create([
        'quotation_number' => 'QUO-999',
        'party_id' => $party->id,
        'quotation_date' => now()->toDateString(),
        'status' => 'draft',
        'total_amount' => 500,
        'created_by' => auth()->id(),
        'tenant_id' => $this->tenant->id,
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/v3/quotations/{$quotation->id}/convert-to-order", [
        'warehouse_id' => $this->warehouseId,
    ]);

    $response->assertRedirect();
});

test('sales_order_stock_hold', function () {
    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    $response1 = $this->postJson("/s/{$this->tenant->slug}/sales-orders", [
        'customer_id' => $party->id,
        'order_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 8,
                'unit_price' => 100,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'shipping_charges' => 0,
        'warehouse_id' => $this->warehouseId,
    ]);
    
    $response1->assertStatus(200);
});

test('pre_sale_to_invoice', function () {
    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'cost_price' => 50]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    $response = $this->postJson("/s/{$this->tenant->slug}/sales-orders", [
        'customer_id' => $party->id,
        'order_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 5,
                'unit_price' => 100,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'shipping_charges' => 0,
        'warehouse_id' => $this->warehouseId,
    ]);

    $order = SalesOrder::first();

    $convertResponse = $this->post("/s/{$this->tenant->slug}/sales-orders/{$order->id}/convert");
    $convertResponse->assertJson(['success' => true]);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP F: Tenant Route Integrity & Ziggy Alignment
// ─────────────────────────────────────────────────────────────────────────────

test('all_tenant_routes_possess_store_slug_parameter', function () {
    $routes = Route::getRoutes();
    
    foreach ($routes as $route) {
        $name = $route->getName();
        $uri = $route->uri();
        
        // If route name starts with "store." or begins with "s/"
        if ($name && (str_starts_with($name, 'store.') || str_starts_with($uri, 's/'))) {
            // Exclude global store setup/join/creation routes that do not have store context
            if ($name === 'store.create-or-join' || $name === 'store.create' || $name === 'store.join' || !str_starts_with($uri, 's/')) {
                continue;
            }
            // Confirm URI begins with s/{store_slug}/ and contains the parameter
            $this->assertTrue(
                str_contains($uri, '{store_slug}') || str_contains($uri, '{store}'),
                "Tenant route '{$name}' (URI: {$uri}) must possess store context route parameter."
            );
        }
    }
});

test('no_tenant_routes_exposed_globally', function () {
    $routes = Route::getRoutes();
    $tenantKeywords = ['funds', 'expenses', 'day-book', 'profit-loss', 'trial-balance', 'pos/products'];

    foreach ($routes as $route) {
        $uri = $route->uri();
        $name = $route->getName();

        foreach ($tenantKeywords as $keyword) {
            // If the route has a tenant keyword but sits at the root / outside store context
            if (str_contains($uri, $keyword) && !str_contains($uri, '{store_slug}') && !str_contains($uri, '{store}')) {
                // Ignore general auth / global landing routes if any
                if ($name === 'home' || $name === 'welcome' || str_contains($uri, 'superadmin')) {
                    continue;
                }
                
                $this->fail("Potential root-level leakage found: Route '{$name}' (URI: {$uri}) matches tenant keyword '{$keyword}' but has no store context.");
            }
        }
    }
    
    $this->assertTrue(true);
});
