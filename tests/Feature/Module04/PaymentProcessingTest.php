<?php

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
    $responseBlocked->assertStatus(500); // Throws Exception which returns 500 in legacy controller
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
    // ARITHMETIC WORKOUT:
    // 1. Subtotal Gross:
    //    Gross value = Price * Quantity = 500 * 2 = 1,000.00
    //
    // 2. Net Line Item:
    //    Net = Gross - Item Discount = 1,000.00 - 50.00 = 950.00
    //
    // 3. Tax Amount (10% of Net Line Item):
    //    Tax = 950.00 * (10 / 100) = 95.00
    //
    // 4. Net Sales (Subtotal Gross - Item Discounts - Global Discount):
    //    Net Sales = 1,000.00 - 50.00 - 100.00 = 850.00
    //
    // 5. Invoice Total (Net Sales + Tax):
    //    Total = 850.00 + 95.00 = 945.00

    $expectedSubtotal = 1000.00;
    $expectedNetSales = 850.00;
    $expectedTax      = 95.00;
    $expectedTotal    = 945.00;

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
        'amount_paid' => 945.00,
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
