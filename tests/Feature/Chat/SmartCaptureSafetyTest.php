<?php

/**
 * Guards the rule that a scan can never silently create something the user
 * cannot undo.
 *
 * A posted Sale is financially immutable — App\Observers\SaleObserver aborts on
 * any change to a financial column, and the only correction is a credit note.
 * So AI Scan must not turn an OCR reading into a posted invoice in one click.
 * It either hands the reviewed lines to the normal creation screen, or creates
 * the editable draft (Pre-Sale / Purchase Order) instead.
 */

use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Warehouse;
use App\Services\SmartCapture\PrefillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->tenant = $this->createTenant('scan-safety-store');
    $this->owner  = $this->createTenantUser($this->tenant, 'owner');

    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
    $this->seedTenantDefaults($this->tenant);

    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'smartcapture_api_key'],
        ['value' => 'safety-test-key']
    );

    $this->product = Product::factory()->create([
        'tenant_id'  => $this->tenant->id,
        'name'       => 'Basmati Rice 5kg',
        'sku'        => 'RICE5',
        'price'      => 1800.00,
        'cost_price' => 1500.00,
    ]);

    $this->customer = Party::create([
        'tenant_id' => $this->tenant->id,
        'type'      => 'customer',
        'name'      => 'Ahmed Traders',
    ]);

    $this->supplier = Party::create([
        'tenant_id' => $this->tenant->id,
        'type'      => 'supplier',
        'name'      => 'Punjab Rice Mills',
    ]);

    $this->warehouse = Warehouse::where('tenant_id', $this->tenant->id)
        ->orderByDesc('is_default')->first();
});

function saleLines($test): array
{
    return [[
        'product_id' => $test->product->id,
        'raw_name'   => 'basmati 5k',
        'qty'        => 3,
        'unit_price' => 1800.00,
    ]];
}

// ─────────────────────────────────────────────────────────────────────────────
// Nothing irreversible without an explicit choice
// ─────────────────────────────────────────────────────────────────────────────

test('a scan cannot post a sales invoice directly', function () {
    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'sale',
        'party_id'       => $this->customer->id,
        'payment_method' => 'cash',
        'items'          => saleLines($this),
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('code', 'requires_review');
    $response->assertJsonPath('draft_action', 'pre_invoice');

    expect(DB::table('sales')->where('tenant_id', $this->tenant->id)->count())->toBe(0);
});

test('a scan cannot post a purchase bill directly', function () {
    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'purchase',
        'party_id'       => $this->supplier->id,
        'payment_method' => 'cash',
        'items'          => saleLines($this),
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('code', 'requires_review');
    $response->assertJsonPath('draft_action', 'pre_purchase');

    expect(DB::table('purchases')->where('tenant_id', $this->tenant->id)->count())->toBe(0);
});

test('an expense needs an explicit acknowledgement because it has no draft form', function () {
    $category = ExpenseCategory::create(['tenant_id' => $this->tenant->id, 'name' => 'Rent']);

    $payload = [
        'action'              => 'expense',
        'expense_category_id' => $category->id,
        'payment_method'      => 'cash',
        'items' => [[
            'product_id' => $this->product->id,
            'qty'        => 1,
            'unit_price' => 25000.00,
        ]],
    ];

    // Without the acknowledgement — refused.
    $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", $payload)
        ->assertStatus(422)
        ->assertJsonPath('code', 'requires_acknowledgement');

    // With it — allowed.
    $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", array_merge($payload, [
        'acknowledge_locked' => true,
    ]))->assertStatus(200);
});

test('editable documents are still created directly, with no extra friction', function () {
    foreach (['pre_invoice', 'proposal'] as $action) {
        $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
            'action'         => $action,
            'party_id'       => $this->customer->id,
            'payment_method' => 'cash',
            'items'          => saleLines($this),
        ])->assertStatus(200);
    }

    expect(DB::table('sales_orders')->where('tenant_id', $this->tenant->id)->count())->toBe(1);
    expect(DB::table('proposals')->where('tenant_id', $this->tenant->id)->count())->toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// The hand-off
// ─────────────────────────────────────────────────────────────────────────────

test('hand-off writes no document and returns the creation screen URL', function () {
    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'sale',
        'mode'           => 'handoff',
        'party_id'       => $this->customer->id,
        'payment_method' => 'cash',
        'items'          => saleLines($this),
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('mode', 'handoff');

    expect($response->json('redirect'))->toContain('/sales/invoice/create');
    expect($response->json('redirect'))->toContain('ai_prefill=');

    // The critical assertion: the ledger is untouched.
    expect(DB::table('sales')->where('tenant_id', $this->tenant->id)->count())->toBe(0);
});

test('the pre-filled creation screen receives the reviewed lines', function () {
    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'sale',
        'mode'           => 'handoff',
        'party_id'       => $this->customer->id,
        'payment_method' => 'cash',
        'reference'      => 'INV-889',
        'items'          => saleLines($this),
    ]);

    parse_str(parse_url($response->json('redirect'), PHP_URL_QUERY) ?? '', $query);
    $payload = app(PrefillService::class)->peek($query['ai_prefill'] ?? null);

    expect($payload)->not->toBeNull();
    expect($payload['action'])->toBe('sale');
    expect($payload['reference'])->toBe('INV-889');
    expect($payload['party']->id)->toBe($this->customer->id);
    expect($payload['items'])->toHaveCount(1);
    expect($payload['items'][0]['product']->id)->toBe($this->product->id);
    expect((float) $payload['items'][0]['quantity'])->toBe(3.0);
});

test('a prefill is single use, so a refresh cannot duplicate an entry', function () {
    $prefill = app(PrefillService::class);
    $key = $prefill->put(['action' => 'sale', 'items' => []]);

    expect($prefill->pull($key))->not->toBeNull();
    expect($prefill->pull($key))->toBeNull();
});

test('a prefill belonging to another user is not readable', function () {
    $key = app(PrefillService::class)->put(['action' => 'sale', 'items' => []]);

    $otherUser = $this->createTenantUser($this->tenant, 'admin');
    $this->actingAs($otherUser);
    $this->bindTenantContext($this->tenant, $otherUser);

    expect(app(PrefillService::class)->pull($key))->toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// Party correctness
// ─────────────────────────────────────────────────────────────────────────────

test('a customer cannot be used as the supplier on a purchase', function () {
    config(['smartcapture.document_policy.purchase.handoff_route' => null]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'             => 'purchase',
        'party_id'           => $this->customer->id, // wrong side of the ledger
        'payment_method'     => 'cash',
        'acknowledge_locked' => true,
        'items'              => saleLines($this),
    ]);

    $response->assertStatus(422);
    expect($response->json('message'))->toContain('is a customer');

    expect(DB::table('purchases')->where('tenant_id', $this->tenant->id)->count())->toBe(0);
});

test('a document is never booked against a guessed party', function () {
    // A second customer exists, so the old "first customer in the table"
    // fallback would have silently picked one instead of failing.
    Party::create(['tenant_id' => $this->tenant->id, 'type' => 'customer', 'name' => 'Zzz Late Customer']);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'pre_invoice',
        'party'          => 'Someone Not In The System',
        'payment_method' => 'cash',
        'items'          => saleLines($this),
    ]);

    $response->assertStatus(422);
    expect(DB::table('sales_orders')->where('tenant_id', $this->tenant->id)->count())->toBe(0);
});

test('a party chosen before scanning is preselected and sent to the model', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => function (\Illuminate\Http\Client\Request $request) {
            expect($request->body())->toContain('Punjab Rice Mills');

            return Http::response([
                'candidates' => [['content' => ['parts' => [['text' => json_encode([
                    'action' => 'purchase',
                    'party'  => null,
                    'items'  => [['name' => 'Basmati Rice 5kg', 'qty' => 10, 'unit_price' => 1500.00]],
                ])]]]]],
            ], 200);
        },
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type'     => 'image',
        'files'    => [['base64' => base64_encode('bytes'), 'mime' => 'image/png']],
        'party_id' => $this->supplier->id,
    ]);

    $response->assertStatus(200);
    expect($response->json('suggested_party_id'))->toBe($this->supplier->id);
    expect($response->json('party_preselected.type_mismatch'))->toBeFalse();
});

test('choosing the wrong side of the ledger up front is flagged, not silently used', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => json_encode([
                'action' => 'purchase',   // a supplier bill…
                'items'  => [['name' => 'Basmati Rice 5kg', 'qty' => 10, 'unit_price' => 1500.00]],
            ])]]]]],
        ], 200),
    ]);

    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/extract", [
        'type'     => 'image',
        'files'    => [['base64' => base64_encode('bytes'), 'mime' => 'image/png']],
        'party_id' => $this->customer->id, // …but they picked a customer
    ]);

    $response->assertStatus(200);
    expect($response->json('party_preselected.type_mismatch'))->toBeTrue();
    expect($response->json('suggested_party_id'))->not->toBe($this->customer->id);
});

// ─────────────────────────────────────────────────────────────────────────────
// New products
// ─────────────────────────────────────────────────────────────────────────────

test('products created by a scan are reported back and tagged as such', function () {
    $response = $this->post("/s/{$this->tenant->slug}/smart-capture/confirm", [
        'action'         => 'pre_invoice',
        'party_id'       => $this->customer->id,
        'payment_method' => 'cash',
        'items' => [[
            'raw_name'   => 'chawal tota',
            'qty'        => 2,
            'unit_price' => 900.00,
            'create_new' => ['name' => 'Broken Rice 1kg', 'price' => 900, 'cost_price' => 700],
        ]],
    ]);

    $response->assertStatus(200);
    expect($response->json('created_products'))->toHaveCount(1);
    expect($response->json('created_products.0.name'))->toBe('Broken Rice 1kg');

    $this->assertDatabaseHas('products', [
        'tenant_id'   => $this->tenant->id,
        'name'        => 'Broken Rice 1kg',
        'created_via' => 'ai_scan',
    ]);
});
