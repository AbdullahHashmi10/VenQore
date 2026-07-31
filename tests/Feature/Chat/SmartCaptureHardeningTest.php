<?php

/**
 * Guards the three properties that AI Scan must never lose:
 *
 *  1. ONE SCAN == ONE UPSTREAM REQUEST. The old model-fallback loop fired up to
 *     four Gemini calls per scan and turned a single 429 into a quota-draining
 *     retry storm. These tests count the actual HTTP calls.
 *  2. LEARNING. What a user picks on the review screen must be remembered for
 *     the whole store and reused on the next scan.
 *  3. TENANT ISOLATION. Keys, catalogs and learned aliases must never cross
 *     between stores, including when two stores scan simultaneously.
 */

use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\Setting;
use App\Models\SmartCaptureAlias;
use App\Models\Warehouse;
use App\Services\SmartCapture\LearningService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->tenant = $this->createTenant('scan-hardening-store');
    $this->owner  = $this->createTenantUser($this->tenant, 'owner');

    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
    $this->seedTenantDefaults($this->tenant);

    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'smartcapture_api_key'],
        ['value' => 'test-key-for-this-store']
    );

    $this->product = Product::factory()->create([
        'tenant_id'  => $this->tenant->id,
        'name'       => 'Coca Cola 1.5L Bottle',
        'sku'        => 'COKE15L',
        'price'      => 220.00,
        'cost_price' => 180.00,
    ]);

    $this->supplier = Party::create([
        'tenant_id' => $this->tenant->id,
        'type'      => 'supplier',
        'name'      => 'Metro Beverages',
    ]);

    $this->warehouse = Warehouse::where('tenant_id', $this->tenant->id)
        ->orderByDesc('is_default')->first();
});

/** Build a well-formed Gemini response body. */
function geminiJson(array $payload): array
{
    return [
        'candidates' => [
            ['content' => ['parts' => [['text' => json_encode($payload)]]]],
        ],
        'usageMetadata' => ['promptTokenCount' => 100, 'candidatesTokenCount' => 50, 'totalTokenCount' => 150],
    ];
}

function scanImage($test, array $extra = [])
{
    return $test->post("/s/{$test->tenant->slug}/smart-capture/extract", array_merge([
        'type'  => 'image',
        'files' => [['base64' => base64_encode('fake-image-bytes'), 'mime' => 'image/png']],
    ], $extra));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Request budget
// ─────────────────────────────────────────────────────────────────────────────

test('a successful scan costs exactly one upstream AI request', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response(geminiJson([
            'action' => 'purchase',
            'party'  => 'Metro Beverages',
            'items'  => [['name' => 'Coca Cola 1.5L Bottle', 'qty' => 12, 'unit_price' => 180.00]],
        ]), 200),
    ]);

    $response = scanImage($this);

    $response->assertStatus(200);
    expect($response->json('meta.api_requests'))->toBe(1);

    Http::assertSentCount(1);
});

test('a rate limit is surfaced as 429 and never retried against another model', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'error' => [
                'code'    => 429,
                'message' => 'Quota exceeded for quota metric generate_content_free_tier_requests',
                'details' => [['retryDelay' => '17s']],
            ],
        ], 429),
    ]);

    $response = scanImage($this);

    $response->assertStatus(429);
    $response->assertJsonPath('code', 'rate_limited');
    expect($response->json('retry_after'))->toBe(17);

    // The critical assertion: ONE call, not one per fallback model.
    Http::assertSentCount(1);
});

test('a server error is surfaced without burning extra requests', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response(['error' => ['message' => 'backend error']], 503),
    ]);

    scanImage($this)->assertStatus(422);

    Http::assertSentCount(1);
});

test('an unusable model is substituted exactly once', function () {
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'smartcapture_model'],
        ['value' => 'gemini-does-not-exist']
    );

    $calls = 0;

    Http::fake([
        'generativelanguage.googleapis.com/*' => function () use (&$calls) {
            $calls++;

            if ($calls === 1) {
                return Http::response(['error' => ['message' => 'models/gemini-does-not-exist is not found']], 404);
            }

            return Http::response(geminiJson([
                'action' => 'sale',
                'party'  => null,
                'items'  => [['name' => 'Coca Cola 1.5L Bottle', 'qty' => 1, 'unit_price' => 220.00]],
            ]), 200);
        },
    ]);

    $response = scanImage($this);

    $response->assertStatus(200);
    // One failed probe + one working call. Never more.
    expect($calls)->toBe(2);
});

test('a truncated JSON response is repaired instead of triggering a re-scan', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [[
                'content' => ['parts' => [[
                    // Cut off mid-array, exactly how a MAX_TOKENS response looks.
                    'text' => '{"action":"sale","party":null,"items":[{"name":"Coca Cola 1.5L Bottle","qty":2,"unit_price":220},{"name":"Half wri',
                ]]],
            ]],
        ], 200),
    ]);

    $response = scanImage($this);

    $response->assertStatus(200);
    expect($response->json('items'))->toHaveCount(1);
    Http::assertSentCount(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Learning memory
// ─────────────────────────────────────────────────────────────────────────────

test('confirming a transaction teaches the store what the wording meant', function () {
    $payload = [
        'action'         => 'purchase',
        'party'          => 'Metro Bev',           // how the AI read it
        'party_id'       => $this->supplier->id,   // what the user picked
        'payment_method' => 'cash',
        'items' => [[
            'product_id' => $this->product->id,
            'raw_name'   => 'col 1.5',             // local shorthand on the bill
            'qty'        => 12,
            'unit_price' => 180.00,
        ]],
    ];

    $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload)->assertStatus(200);

    $this->assertDatabaseHas('smart_capture_aliases', [
        'tenant_id'    => $this->tenant->id,
        'kind'         => 'product',
        'source_key'   => 'col 1 5',
        'target_id'    => $this->product->id,
    ]);

    $this->assertDatabaseHas('smart_capture_aliases', [
        'tenant_id'  => $this->tenant->id,
        'kind'       => 'party',
        'scope'      => 'supplier',
        'target_id'  => $this->supplier->id,
    ]);
});

test('a learned wording is pre-selected at full confidence on the next scan', function () {
    app(LearningService::class)->rememberProduct('col 1.5', $this->product->id, $this->product->name);

    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response(geminiJson([
            'action' => 'purchase',
            'party'  => null,
            // Deliberately NOT a catalog name, and no SKU: only the memory can resolve it.
            'items'  => [['name' => 'col 1.5', 'qty' => 6, 'unit_price' => 180.00, 'matched_sku' => null]],
        ]), 200),
    ]);

    $response = scanImage($this);

    $response->assertStatus(200);
    expect($response->json('items.0.product_id'))->toBe($this->product->id);
    expect($response->json('items.0.confidence'))->toBe(100);
    expect($response->json('items.0.learned'))->toBeTrue();
    expect($response->json('meta.learned_lines'))->toBe(1);
});

test('the store vocabulary is sent to the model on the next scan', function () {
    app(LearningService::class)->rememberProduct('col 1.5', $this->product->id, $this->product->name);

    Http::fake([
        'generativelanguage.googleapis.com/*' => function (\Illuminate\Http\Client\Request $request) {
            expect($request->body())->toContain("THIS STORE'S CONFIRMED VOCABULARY");
            expect($request->body())->toContain('col 1.5');

            return Http::response(geminiJson([
                'action' => 'sale',
                'items'  => [['name' => 'Coca Cola 1.5L Bottle', 'qty' => 1, 'unit_price' => 220.00]],
            ]), 200);
        },
    ]);

    scanImage($this)->assertStatus(200);
});

test('repeating a lesson strengthens it rather than duplicating the row', function () {
    $learning = app(LearningService::class);

    $learning->rememberProduct('col 1.5', $this->product->id, $this->product->name);
    $learning->rememberProduct('COL 1.5!', $this->product->id, $this->product->name);
    $learning->rememberProduct('  col   1.5 ', $this->product->id, $this->product->name);

    $aliases = SmartCaptureAlias::withoutGlobalScopes()
        ->where('tenant_id', $this->tenant->id)
        ->where('kind', 'product')
        ->get();

    expect($aliases)->toHaveCount(1);
    expect($aliases->first()->hits)->toBe(3);
});

test('a lesson pointing at a deleted product is discarded, not returned', function () {
    $learning = app(LearningService::class);
    $learning->rememberProduct('col 1.5', $this->product->id, $this->product->name);

    $this->product->delete();

    expect($learning->resolveProduct('col 1.5'))->toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tenant isolation and concurrency
// ─────────────────────────────────────────────────────────────────────────────

test('one store cannot see or use another store learned aliases', function () {
    $learning = app(LearningService::class);
    $learning->rememberProduct('col 1.5', $this->product->id, $this->product->name);

    // A second, unrelated store.
    $other      = $this->createTenant('other-store');
    $otherOwner = $this->createTenantUser($other, 'owner');
    $this->actingAs($otherOwner);
    $this->bindTenantContext($other, $otherOwner);
    $this->seedTenantDefaults($other);

    expect(app(LearningService::class)->resolveProduct('col 1.5'))->toBeNull();
    expect(app(LearningService::class)->promptHints())->toBeEmpty();
});

test('a store BYOK key is never used by another store', function () {
    $other      = $this->createTenant('keyless-store');
    $otherOwner = $this->createTenantUser($other, 'owner');
    $this->actingAs($otherOwner);
    $this->bindTenantContext($other, $otherOwner);
    $this->seedTenantDefaults($other);

    $config = app(\App\Services\SmartCapture\AiExtractionService::class)->resolveConfig();

    expect($config['api_key'])->not->toBe('test-key-for-this-store');
    expect($config['byok'])->toBeFalse();
});

test('the same idempotency key posts a transaction only once', function () {
    $payload = [
        'action'          => 'purchase',
        'party'           => 'Metro Beverages',
        'party_id'        => $this->supplier->id,
        'payment_method'  => 'cash',
        'idempotency_key' => 'fixed-key-abc123',
        'items' => [[
            'product_id' => $this->product->id,
            'raw_name'   => 'Coca Cola 1.5L Bottle',
            'qty'        => 5,
            'unit_price' => 180.00,
        ]],
    ];

    $first  = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);
    $second = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload);

    $first->assertStatus(200);
    $second->assertStatus(200);
    $second->assertJsonPath('duplicate', true);

    expect(\Illuminate\Support\Facades\DB::table('purchases')
        ->where('tenant_id', $this->tenant->id)->count())->toBe(1);
});

test('similar names with different pack sizes do not match confidently', function () {
    Product::factory()->create([
        'tenant_id'  => $this->tenant->id,
        'name'       => 'Coca Cola 500ml Bottle',
        'sku'        => 'COKE500',
        'price'      => 90.00,
        'cost_price' => 70.00,
    ]);

    $matches = app(\App\Services\SmartCapture\FuzzyMatchService::class)
        ->matchProduct('Coca Cola 1.5L Bottle');

    expect($matches[0]['product']->sku)->toBe('COKE15L');

    $fiveHundred = collect($matches)->firstWhere(fn ($m) => $m['product']->sku === 'COKE500');
    expect($fiveHundred['confidence'])->toBeLessThan($matches[0]['confidence']);
});

test('an expense category the user picked is remembered', function () {
    $category = ExpenseCategory::create([
        'tenant_id' => $this->tenant->id,
        'name'      => 'Utilities',
    ]);

    $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'              => 'expense',
        'expense_category'    => 'bijli bill',   // how the AI read it
        'expense_category_id' => $category->id,  // what the user picked
        'payment_method'      => 'cash',
        'items' => [[
            'product_id' => $this->product->id,
            'raw_name'   => 'Electricity bill',
            'qty'        => 1,
            'unit_price' => 4500.00,
        ]],
    ])->assertStatus(200);

    expect(app(LearningService::class)->resolveExpenseCategory('bijli bill'))
        ->not->toBeNull();
});
