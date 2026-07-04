<?php

use App\Models\ChatSession;
use App\Models\Setting;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Sale;
use App\Models\Purchase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    // Provision tenant
    $this->tenant = $this->createTenant('smart-store');
    $this->owner = $this->createTenantUser($this->tenant, 'owner');
    
    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);

    $this->seedTenantDefaults($this->tenant);
    $this->fifo = app(\App\Services\V3\FifoService::class);

    // Smart Capture is an AI add-on (Pricing.jsx: managed AI tiers or $5 BYOK
    // unlock), included in NO base plan — seeder default is '0' everywhere.
    // Entitle this tenant the way a real add-on purchase would: a per-tenant
    // override row. These tests cover extraction/confirmation logic, not gating.
    DB::table('tenant_plan_overrides')->insert([
        'tenant_id' => $this->tenant->id,
        'override_key' => 'smart_capture',
        'override_value' => '1',
        'applied_by' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Save key in database settings for Gemini Extraction Service
    Setting::updateOrCreate([
        'tenant_id' => $this->tenant->id,
        'key' => 'chatbot_api_key'
    ], [
        'value' => 'mock-gemini-api-key'
    ]);

    // Create a product to match
    $this->product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Coca Cola 350ml Can',
        'sku' => 'COKE350',
        'price' => 120.00,
        'cost_price' => 80.00,
        'tax_rate' => 18,
    ]);

    // Create a supplier party
    $this->supplier = Party::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'supplier',
        'name' => 'Coca Cola Distributors',
    ]);

    // Create a customer party
    $this->customer = Party::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'name' => 'John Guest',
    ]);

    // Retrieve default warehouse seeded by TenantDefaultSeeder
    $this->warehouse = Warehouse::where('tenant_id', $this->tenant->id)->orderByDesc('is_default')->first();
});

test('gemini model extracts details and fuzzy match finds product candidates', function () {
    // Fake the Gemini Flash API response
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => json_encode([
                                'action' => 'purchase',
                                'party' => 'Coca Cola',
                                'items' => [
                                    ['name' => 'Coca Cola 350ml', 'qty' => 24, 'unit_price' => 75.00]
                                ]
                            ])]
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type' => 'image',
        'base64' => base64_encode('fake-image-bytes'),
        'mime_type' => 'image/png'
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'action',
        'party',
        'items' => [
            '*' => [
                'raw_name',
                'qty',
                'unit_price',
                'confidence',
                'product_id',
                'candidates' => [
                    '*' => [
                        'id',
                        'name',
                        'sku',
                        'sale_price',
                        'confidence'
                    ]
                ]
            ]
        ]
    ]);

    expect($response->json('action'))->toBe('purchase');
    expect($response->json('party'))->toBe('Coca Cola');
    expect($response->json('items.0.product_id'))->toBe($this->product->id);
    expect($response->json('items.0.confidence'))->toBeGreaterThanOrEqual(70);
});

test('user can confirm a purchase transaction', function () {
    $payload = [
        'action' => 'purchase',
        'party' => 'Coca Cola Distributors',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 10,
                'unit_price' => 80.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'message',
        'data' => [
            'success',
            'type',
            'id',
            'reference',
            'total'
        ]
    ]);

    // Check Purchase record
    $this->assertDatabaseHas('purchases', [
        'tenant_id' => $this->tenant->id,
        'party_id' => $this->supplier->id,
        'payment_method' => 'cash',
        'payment_status' => 'paid',
    ]);

    // Check Inventory batch is received
    $this->assertDatabaseHas('inventory_batches', [
        'tenant_id' => $this->tenant->id,
        'product_id' => $this->product->id,
        'remaining_qty' => 10
    ]);

    // Verify journal balancing entries (Debit Inventory Asset 1100, Credit Cash 1000)
    $purchaseRecord = DB::table('purchases')->where('tenant_id', $this->tenant->id)->first();
    
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1100',
        'debit' => $purchaseRecord->subtotal
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1000',
        'credit' => $purchaseRecord->total
    ]);
});

test('user can confirm a sale transaction', function () {
    // Prime the warehouse with inventory first (purchasing 20 cokes)
    app(\App\Services\V3\FifoService::class)->receiveBatch(
        productId: $this->product->id,
        warehouseId: $this->warehouse->id,
        qty: 20,
        unitCost: 80.00,
        batchType: 'purchase'
    );

    $payload = [
        'action' => 'sale',
        'party' => 'John Guest',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 5,
                'unit_price' => 120.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);

    // Verify Sale record
    $this->assertDatabaseHas('sales', [
        'tenant_id' => $this->tenant->id,
        'party_id' => $this->customer->id,
        'payment_method' => 'cash',
        'status' => 'posted'
    ]);

    // Verify FIFO stock deductions (20 cokes - 5 sold = 15 remaining)
    $this->assertDatabaseHas('inventory_batches', [
        'tenant_id' => $this->tenant->id,
        'product_id' => $this->product->id,
        'remaining_qty' => 15
    ]);
});

test('user can confirm an operating expense transaction', function () {
    $payload = [
        'action' => 'expense',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id, // dummy for validation
                'name' => 'Electricity bill payment',
                'qty' => 1,
                'unit_price' => 4500.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);

    // Verify journal entries are posted (Debit 6000 Operating Expense, Credit 1000 Cash in Hand)
    $entry = JournalEntry::where('tenant_id', $this->tenant->id)
        ->where('reference_type', 'operating_expense')
        ->first();

    expect($entry)->not->toBeNull();

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '6000',
        'debit' => 4500.00
    ]);

    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1000',
        'credit' => 4500.00
    ]);
});

test('smartcapture lens and voice extracts transaction from base64 audio memo', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => json_encode([
                                'action' => 'expense',
                                'party' => null,
                                'items' => [
                                    ['name' => 'Electricity bill', 'qty' => 1, 'unit_price' => 4500.00]
                                ]
                            ])]
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type' => 'audio',
        'base64' => base64_encode('fake-audio-bytes'),
        'mime_type' => 'audio/wav'
    ]);

    $response->assertStatus(200);
    $response->assertJsonFragment([
        'success' => true,
        'action' => 'expense',
    ]);
});

test('smartcapture lens and voice falls back gracefully on invalid api key', function () {
    // Set invalid key
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'chatbot_api_key'],
        ['value' => 'invalid-gemini-key']
    );

    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'error' => [
                'message' => 'API key not valid',
                'status' => 'INVALID_ARGUMENT'
            ]
        ], 400)
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type' => 'image',
        'base64' => base64_encode('fake-image'),
        'mime_type' => 'image/png'
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment([
        'success' => false,
    ]);
});

test('user can confirm a proposal transaction', function () {
    $payload = [
        'action' => 'proposal',
        'party' => 'John Guest',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 5,
                'unit_price' => 120.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    $this->assertDatabaseHas('proposals', [
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'total_amount' => 600.00,
    ]);
});

test('user can confirm a pre_invoice transaction', function () {
    $payload = [
        'action' => 'pre_invoice',
        'party' => 'John Guest',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 5,
                'unit_price' => 120.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    $this->assertDatabaseHas('sales_orders', [
        'tenant_id' => $this->tenant->id,
        'party_id' => $this->customer->id,
        'total_amount' => 600.00,
    ]);
});

test('user can confirm a pre_purchase transaction', function () {
    $payload = [
        'action' => 'pre_purchase',
        'party' => 'Coca Cola Distributors',
        'payment_method' => 'credit',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 5,
                'unit_price' => 80.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    
    $supplier = \App\Models\Supplier::where('tenant_id', $this->tenant->id)->first();
    expect($supplier)->not->toBeNull();

    $this->assertDatabaseHas('purchase_orders', [
        'tenant_id' => $this->tenant->id,
        'supplier_id' => $supplier->id,
        'total_amount' => 400.00,
    ]);
});

test('user can confirm a recurring invoice transaction', function () {
    $payload = [
        'action' => 'recurring_invoice',
        'party' => 'John Guest',
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 1,
                'unit_price' => 120.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    $this->assertDatabaseHas('recurring_invoices', [
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'status' => 'active',
    ]);
});

test('user can confirm a purchase return transaction', function () {
    $payload = [
        'action' => 'purchase_return',
        'party' => 'Coca Cola Distributors',
        'payment_method' => 'credit',
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 2,
                'unit_price' => 80.00
            ]
        ]
    ];

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $response->assertStatus(200);
    $this->assertDatabaseHas('debit_notes', [
        'tenant_id' => $this->tenant->id,
        'supplier_id' => $this->supplier->id,
        'amount' => 160.00,
        'status' => 'approved',
    ]);
});

test('extract endpoint parses target_type and custom_command', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => json_encode([
                                'action' => 'proposal',
                                'party' => 'John Guest',
                                'items' => [
                                    ['name' => 'Coca Cola 350ml Can', 'qty' => 5, 'unit_price' => 120.00]
                                ]
                            ])]
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type' => 'image',
        'base64' => base64_encode('fake-image-bytes'),
        'mime_type' => 'image/png',
        'target_type' => 'proposal',
        'custom_command' => 'Apply 10% discount'
    ]);

    $response->assertStatus(200);
    expect($response->json('action'))->toBe('proposal');
});

test('gemini prompt includes database products for cross-referencing and translation', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => function (\Illuminate\Http\Client\Request $request) {
            $body = $request->body();
            // Assert that our custom product list is passed in the prompt body
            expect($body)->toContain('Coca Cola 350ml Can');
            expect($body)->toContain('CRITICAL TRANSLATION & MAPPING RULES:');

            return Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => json_encode([
                                    'action' => 'purchase',
                                    'party' => 'Coca Cola Distributors',
                                    'items' => [
                                        ['name' => 'Coca Cola 350ml Can', 'qty' => 24, 'unit_price' => 75.00]
                                    ]
                                ])]
                            ]
                        ]
                    ]
                ]
            ], 200);
        }
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type' => 'image',
        'base64' => base64_encode('fake-image-bytes'),
        'mime_type' => 'image/png'
    ]);

    $response->assertStatus(200);
    expect($response->json('items.0.product_id'))->toBe($this->product->id);
});


