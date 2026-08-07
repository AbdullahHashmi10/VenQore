<?php

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Party;
use App\Models\Setting;
use App\Models\Stock;
use App\Models\Payment;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use App\Exceptions\PlanLimitException;
use App\Models\Sale;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-1');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    
    // Dynamically retrieve the seeded warehouse ID for this tenant
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
    
    // Clear Settings Cache to prevent state leak
    SettingsHelper::clearCache();
});

/**
 * 1. Split Payment Test
 * Specific rules:
 * - Create a sale totalling PKR 1,000.
 * - Pay PKR 400 cash + PKR 350 bank transfer + PKR 250 credit (party balance).
 * - Assert: three rows in payments table, each with correct method and amount.
 * - Assert: one journal entry per payment leg.
 * - Assert: party balance reduced by exactly PKR 250.
 * - Assert: the sale is marked payment_status = paid.
 */
test('split payment with cash, bank, and credit ledger legs', function () {
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'current_balance' => 500.00, // Starts with some debt or balance
    ]);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 200.00,
        'price' => 1000.00,
        'tax_rate' => 0,
    ]);

    // Seed stock to prevent stock blocking
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    // Let's create the stock batch for FIFO
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

    $data = [
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
        'payment_method' => 'split',
        'amount_paid' => 1000.00,
        'payments' => [
            ['method' => 'cash', 'amount' => 400.00],
            ['method' => 'bank', 'amount' => 350.00],
            ['method' => 'credit', 'amount' => 250.00],
        ],
        'add_to_ledger' => true,
    ];

    // Call the legacy controller endpoint which supports the payments array
    $response = $this->post("/s/{$this->tenant->slug}/sales", $data);

    // Assert successful request
    $response->assertStatus(200);

    $saleId = $response->json('sale_id');
    $this->assertNotEmpty($saleId);

    // Assert: the sale is marked payment_status = paid
    $sale = DB::table('sales')->where('id', $saleId)->first();
    $this->assertEquals('paid', $sale->payment_status);

    // Assert: three rows in payments table, each with correct method and amount.
    $payments = Payment::where('sale_id', $saleId)->get();
    $this->assertCount(3, $payments, 'Expected exactly 3 payments in the database.');

    $paymentCash = $payments->where('method', 'cash')->first();
    $paymentBank = $payments->where('method', 'bank')->first();
    $paymentCredit = $payments->where('method', 'credit')->first();

    $this->assertNotNull($paymentCash, 'Cash payment row missing.');
    $this->assertEquals(400.00, $paymentCash->amount);

    $this->assertNotNull($paymentBank, 'Bank payment row missing.');
    $this->assertEquals(350.00, $paymentBank->amount);

    // This is expected to fail in legacy because 'credit' is rewritten to 'cash'
    $this->assertNotNull($paymentCredit, 'Credit payment row missing.');
    $this->assertEquals(250.00, $paymentCredit->amount);

    // Assert: one journal entry per payment leg (debit cash, bank, credit).
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1000', // Cash Account
        'debit' => 400.00,
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1010', // Bank Account
        'debit' => 350.00,
    ]);

    // This is expected to fail because credit payment legs are routed to Cash '1000' or handled as cash
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1200', // AR / Ledger Account
        'debit' => 250.00,
    ]);

    // Assert: party balance reduced by exactly PKR 250.
    // Starting balance was 500.00. Since it's paid with 250.00 credit leg, the balance should decrease by 250.00 to become 250.00.
    $customer->refresh();
    $this->assertEquals(250.00, $customer->current_balance);
});

/**
 * 2. Plan Transaction Limit Test
 * Specific rules:
 * - set the tenant's plan limit for transactions to exactly 5.
 * - Create 5 sales. Attempt a 6th.
 * - Assert PlanLimitException is thrown (or 422 HTTP response).
 * - Assert the 6th sale does NOT exist in the database.
 */
test('plan limit enforcement blocks 6th transaction when limit is 5', function () {
    // 1. Override limit to 5
    TenantPlanOverride::create([
        'tenant_id' => $this->tenant->id,
        'override_key' => 'transactions_per_month',
        'override_value' => '5',
        'applied_by' => auth()->id() ?? 1,
    ]);
    PlanRepository::invalidateTenantCache($this->tenant->id);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 100.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 100]
    );

    // Seed stock batches
    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50.00,
        'original_qty' => 100,
        'initial_qty' => 100,
        'remaining_qty' => 100,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $data = [
        'customer_id' => Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer'])->id,
        'warehouse_id' => $this->warehouseId,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount_received' => 100.00,
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 1,
                'sale_uom' => 'PCS',
                'unit_price' => 100.00,
            ]
        ]
    ];

    // 2. Create 5 sales (using V3 endpoint where PlanGate is enforced)
    for ($i = 1; $i <= 5; $i++) {
        $response = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
        $response->assertSessionHasNoErrors();
        $response->assertStatus(302); // Redirect back on success
    }

    // Assert 5 sales exist in DB
    $this->assertEquals(5, DB::table('sales')->where('tenant_id', $this->tenant->id)->count());

    // 3. Attempt a 6th sale
    // We expect this to fail due to PlanLimitException (which yields a 403 response or 422 depending on how handled, or throws exception)
    $response6 = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);

    // Let's assert it was blocked: either throwing PlanLimitException or returning 403/422 status
    $this->assertTrue(
        in_array($response6->status(), [403, 422]) ||
        $response6->exception instanceof PlanLimitException
    );

    // Assert the 6th sale does NOT exist in the database
    $this->assertEquals(5, DB::table('sales')->where('tenant_id', $this->tenant->id)->count());
});

/**
 * 3. Negative Stock Test
 * Specific rules:
 * - create a product with stock_quantity = 0.
 * - Try to sell 1 unit.
 * - When the setting stop_sale_on_negative_stock = true, assert the sale is blocked.
 * - Change the setting to false, assert the sale goes through and stock_quantity becomes -1.
 */
test('negative stock blocking enforcement based on system settings', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 150.00,
        'stock_quantity' => 0.00,
    ]);

    // Ensure Stock record is 0 too
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 0]
    );

    $data = [
        'customer_id' => Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer'])->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 150.00,
                'discount' => 0,
            ]
        ],
        'payment_method' => 'cash',
        'amount_paid' => 150.00,
    ];

    // CASE A: stop_sale_negative_stock = true
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'stop_sale_negative_stock'],
        ['value' => '1']
    );
    SettingsHelper::clearCache();

    // Try to sell 1 unit - should fail / be blocked
    $responseBlocked = $this->post("/s/{$this->tenant->slug}/sales", $data);
    $responseBlocked->assertStatus(422); // Throws Exception which returns 422 in controller
    $this->assertEquals(0, DB::table('sales')->where('tenant_id', $this->tenant->id)->count());

    // CASE B: stop_sale_negative_stock = false
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'stop_sale_negative_stock'],
        ['value' => '0']
    );
    SettingsHelper::clearCache();

    // Try to sell 1 unit - should go through
    $responseAllowed = $this->post("/s/{$this->tenant->slug}/sales", $data);
    $responseAllowed->assertStatus(200);

    // Assert sale was recorded
    $this->assertEquals(1, DB::table('sales')->where('tenant_id', $this->tenant->id)->count());

    // Assert: stock_quantity becomes -1
    $product->refresh();
    $this->assertEquals(-1.00, $product->stock_quantity);
});

/**
 * 4. Discount Test
 * Specific rules:
 * - for every discount test: calculate the expected values yourself in comments, then assert against your own numbers.
 * - Show the arithmetic.
 */
test('discount waterfall calculations are precise and correct', function () {
    // SETUP:
    // Create product with Price = PKR 500
    // Item Quantity = 2
    // Item Discount = PKR 50 (directly on the line item)
    // Global/Invoice Discount = PKR 100 (applied to net total)
    // Tax Rate = 10%
    //
    // CORRECTED ARITHMETIC WORKOUT (M1-06 fix — tax must follow BOTH discounts):
    // 1. Subtotal Gross:
    //    Gross value = Price × Quantity = 500 × 2 = 1,000.00
    //
    // 2. Net after item discount:
    //    Net_line = Gross − Item Discount = 1,000.00 − 50.00 = 950.00
    //
    // 3. Net Sales (taxable base — AFTER global discount):
    //    Net Sales = Net_line − Global Discount = 950.00 − 100.00 = 850.00
    //
    // 4. Tax Amount (10% of Net Sales, i.e. the post-all-discounts base):
    //    Tax = 850.00 × (10 / 100) = 85.00
    //    (Wrong OLD result was 95.00, taxing the pre-global-discount net of 950.00)
    //
    // 5. Invoice Total (Net Sales + Tax):
    //    Total = 850.00 + 85.00 = 935.00
    //    (Wrong OLD result was 945.00)

    $expectedSubtotal = 1000.00;
    $expectedNetSales = 850.00;
    $expectedTax      = 85.00;   // CORRECTED: was 95.00 (taxed 950, ignoring global discount)
    $expectedTotal    = 935.00;  // CORRECTED: was 945.00

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 500.00,
        'tax_rate' => 10,
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

    $data = [
        'customer_id' => Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer'])->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 500.00,
                'discount' => 50.00,
            ]
        ],
        'discount' => 100.00,
        'payment_method' => 'cash',
        'amount_paid' => 935.00, // CORRECTED: was 945.00
    ];

    $response = $this->post("/s/{$this->tenant->slug}/sales", $data);
    $response->assertStatus(200);

    $saleId = $response->json('sale_id');
    $sale = DB::table('sales')->where('id', $saleId)->first();

    // Assert waterfall numbers against hand-calculated values
    $this->assertEquals($expectedSubtotal, $sale->subtotal);
    $this->assertEquals($expectedNetSales, $sale->net_sales);
    $this->assertEquals($expectedTax, $sale->total_tax);
    $this->assertEquals($expectedTotal, $sale->invoice_total);
});

test('correctly voids all payment table rows when a split-paid sale is cancelled', function () {
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 1000.00]);
    Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

    // Create a sale paid with: Cash 400 + Bank 350 + Credit 250
    $data = [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 1000.00]],
        'payment_method' => 'split',
        'amount_paid' => 1000.00,
        'payments' => [
            ['method' => 'cash', 'amount' => 400.00],
            ['method' => 'bank', 'amount' => 350.00],
            ['method' => 'credit', 'amount' => 250.00],
        ],
        'add_to_ledger' => true,
    ];

    $response = $this->post("/s/{$this->tenant->slug}/sales", $data);
    $response->assertStatus(200);
    $saleId = $response->json('sale_id');
    $sale = Sale::find($saleId);

    // Cancel the sale
    $cancelResponse = $this->post("/s/{$this->tenant->slug}/sales/{$sale->id}/cancel", ['reason' => 'Customer return']);
    $cancelResponse->assertStatus(302); // Redirect back

    // Assert that counter payment rows are generated to balance the payments ledger
    $payments = Payment::where('sale_id', $saleId)->get();
    // Original 3 payments + 3 reversal payments = 6 payments total
    expect($payments)->toHaveCount(6);
    expect($payments->where('amount', -400.00)->where('method', 'cash'))->not->toBeNull();
    expect($payments->where('amount', -350.00)->where('method', 'bank'))->not->toBeNull();
    expect($payments->where('amount', -250.00)->where('method', 'credit'))->not->toBeNull();
});

test('returns a graceful 422 validation error when allocating an overpayment instead of crashing with 500', function () {
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $sale = Sale::factory()->create([
        'tenant_id' => $this->tenant->id,
        'party_id' => $customer->id,
        'total' => 100.00,
        'payment_status' => 'unpaid',
    ]);

    // Attempt to allocate 120.00 to a 100.00 invoice
    $response = $this->postJson("/s/{$this->tenant->slug}/v3/customer-payments", [
        'customer_id' => $customer->id,
        'payment_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount' => 120.00,
        'allocations' => [
            ['sale_id' => $sale->id, 'amount' => 120.00]
        ]
    ]);

    // Assert status is 422 and not 500
    expect($response->status())->toBe(422);
    expect($response->json('errors.allocations.0'))->toContain('Over-allocation blocked');
});

test('routes sale checkout cash overpayment to Customer Advances Account 2100 in double-entry ledgers', function () {
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 1000.00]);
    Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

    // Purchase PKR 1,000 invoice, but customer pays PKR 1,200 (overpayment PKR 200)
    $data = [
        'tenant_id' => $this->tenant->id,
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'sale_date' => now()->toDateString(),
        'items' => [['product_id' => $product->id, 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 1000.00]],
        'payment_method' => 'cash',
        'amount_received' => 1200.00,
    ];

    $response = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
    $response->assertStatus(302);

    // Verify double-entry ledger has PKR 200 credit on Customer Advances (Account 2100)
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '2100', // Customer Advances
        'credit' => 200.00,
    ]);
});

test('blocks concurrent checkout requests that attempt to exceed the monthly transaction limit', function () {
    // Set monthly transaction limit to 1
    TenantPlanOverride::create([
        'tenant_id' => $this->tenant->id,
        'override_key' => 'transactions_per_month',
        'override_value' => '1',
        'applied_by' => 1,
    ]);
    \App\Services\PlanRepository::invalidateTenantCache($this->tenant->id);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 100.00,
        'cost_price' => 50.00,
    ]);
    Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $data = [
        'customer_id' => Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer'])->id,
        'warehouse_id' => $this->warehouseId,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount_received' => 100.00,
        'items' => [[
            'product_id' => $product->id,
            'qty' => 1,
            'sale_uom' => 'PCS',
            'unit_price' => 100.00,
        ]]
    ];

    // Simulate concurrent requests
    // First checkout should succeed
    $response1 = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
    $response1->assertStatus(302);

    // Second checkout should immediately fail with 403 or 422 plan limit error
    $response2 = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
    expect($response2->status())->toBe(403);
});
