<?php

namespace Tests\Feature\Hardening;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Contract of the New Production Run screen
 * (resources/js/Pages/Inventory/Production/Create.jsx).
 *
 * The screen posts to route store.production.store, which points at
 * V3\ProductionRunController@store ({bom_id, warehouse_id, planned_qty,
 * run_date}). It used to send {product_id, quantity, recipe_id, …} and every
 * submit failed validation — and the route itself was unreachable: POST
 * /inventory/{id} (inventory.update) was registered first and captured
 * /inventory/production as a product id (404). production.store is now
 * registered before it. The body the screen sends is built by
 * buildProductionRunPayload() in resources/js/Domain/production/runPayload.js;
 * SCREEN_FIELDS mirrors it and is checked against that file.
 */
class ProductionScreenContractTest extends VenQoreTestCase
{
    /** Mirrors PRODUCTION_RUN_FIELDS / buildProductionRunPayload() in Domain/production/runPayload.js. */
    private const SCREEN_FIELDS = ['bom_id', 'warehouse_id', 'planned_qty', 'run_date'];

    /** What the screen sent before the fix (Create.jsx formData). */
    private const OLD_SCREEN_FIELDS = ['product_id', 'product_name', 'quantity', 'warehouse_id', 'recipe_id', 'notes'];

    private Tenant $tenant;
    private User $manager;
    private string $warehouseId;
    private Product $finished;
    private Product $raw;
    private string $bomId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('production-contract', 'ltd_3', 'active');
        $this->seedTenantDefaults($this->tenant);
        $this->manager = $this->createTenantUser($this->tenant, 'manager');   // has inventory.adjust
        $this->actingAsTenantUserModel($this->manager, $this->tenant);
        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');

        $this->finished = Product::factory()->create(['tenant_id' => $this->tenant->id, 'name' => 'Loaf', 'is_manufactured' => 1]);
        $this->raw      = Product::factory()->create(['tenant_id' => $this->tenant->id, 'name' => 'Flour', 'is_manufactured' => 0]);

        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'product_id' => $this->raw->id,
            'warehouse_id' => $this->warehouseId, 'unit_cost' => 50.00, 'original_qty' => 20,
            'initial_qty' => 20, 'remaining_qty' => 20, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'product_id' => $this->raw->id,
            'warehouse_id' => $this->warehouseId, 'quantity' => 20, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->bomId = (string) Str::uuid();
        DB::table('bill_of_materials')->insert([
            'id' => $this->bomId, 'tenant_id' => $this->tenant->id, 'product_id' => $this->finished->id,
            'version' => 1, 'effective_from' => today()->toDateString(), 'is_active' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('bom_items')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'bom_id' => $this->bomId,
            'product_id' => $this->raw->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0, 'byproduct_nrv' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    /** buildProductionRunPayload({bom_id, warehouse_id, planned_qty, run_date}) as the screen sends it. */
    private function screenPayload(): array
    {
        $payload = [
            'bom_id'       => $this->bomId,
            'warehouse_id' => $this->warehouseId,
            'planned_qty'  => 3,
            'run_date'     => today()->toDateString(),
        ];
        $this->assertSame(self::SCREEN_FIELDS, array_keys($payload));
        return $payload;
    }

    public function test_the_screen_payload_mirror_matches_the_jsx(): void
    {
        $js = file_get_contents(base_path('resources/js/Domain/production/runPayload.js'));
        $this->assertMatchesRegularExpression('/PRODUCTION_RUN_FIELDS\s*=\s*\[([^\]]*)\]/', $js);
        preg_match('/PRODUCTION_RUN_FIELDS\s*=\s*\[([^\]]*)\]/', $js, $m);
        preg_match_all("/'([a-z_]+)'/", $m[1], $fields);
        $this->assertSame(self::SCREEN_FIELDS, $fields[1], 'PHP mirror and runPayload.js disagree on the contract.');

        preg_match('/export function buildProductionRunPayload\(.*?\)\s*\{\s*return\s*\{(.*?)\};/s', $js, $body);
        preg_match_all('/^\s*([a-z_]+):/m', $body[1] ?? '', $keys);
        $this->assertSame(self::SCREEN_FIELDS, $keys[1], 'buildProductionRunPayload() must send exactly the contract fields.');

        $page = file_get_contents(base_path('resources/js/Pages/Inventory/Production/Create.jsx'));
        $this->assertStringContainsString("route('store.production.store'", $page);
        $this->assertStringContainsString('buildProductionRunPayload(formData)', $page, 'The screen must post the built payload.');
    }

    public function test_posting_the_screen_payload_creates_a_production_run(): void
    {
        $response = $this->postJson("/s/{$this->tenant->slug}/inventory/production", $this->screenPayload());

        $this->assertContains($response->status(), [200, 201, 302], 'Screen submit failed: ' . $response->getContent());
        $response->assertSessionHasNoErrors();

        $run = DB::table('production_runs')->where('tenant_id', $this->tenant->id)->where('bom_id', $this->bomId)->first();
        $this->assertNotNull($run, 'The screen payload must create a production run.');
        $this->assertEqualsWithDelta(3.0, (float) $run->planned_qty, 0.0001);
        $this->assertSame($this->warehouseId, (string) $run->warehouse_id);

        // 2 flour per loaf × 3 = 6 consumed FIFO.
        $this->assertEqualsWithDelta(14.0, (float) DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)->where('product_id', $this->raw->id)->sum('remaining_qty'), 0.0001);
    }

    public function test_the_old_screen_payload_is_rejected_with_422(): void
    {
        $old = [
            'product_id'   => $this->finished->id,
            'product_name' => $this->finished->name,
            'quantity'     => 3,
            'warehouse_id' => $this->warehouseId,
            'recipe_id'    => '',
            'notes'        => 'old screen',
        ];
        $this->assertSame(self::OLD_SCREEN_FIELDS, array_keys($old));

        $this->postJson("/s/{$this->tenant->slug}/inventory/production", $old)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['bom_id', 'planned_qty', 'run_date']);

        $this->assertSame(0, DB::table('production_runs')->where('tenant_id', $this->tenant->id)->count());
    }

    public function test_bom_list_endpoint_feeds_the_screen_and_is_permission_guarded(): void
    {
        $res = $this->getJson("/s/{$this->tenant->slug}/inventory/production/boms")->assertOk();
        $res->assertJsonPath('boms.0.id', $this->bomId)
            ->assertJsonPath('boms.0.product_id', (string) $this->finished->id)
            ->assertJsonPath('boms.0.product_name', 'Loaf')
            ->assertJsonPath('boms.0.items.0.product_id', (string) $this->raw->id)
            ->assertJsonPath('boms.0.items.0.name', 'Flour');

        // Filter by product.
        $this->getJson("/s/{$this->tenant->slug}/inventory/production/boms?product_id={$this->raw->id}")
            ->assertOk()->assertJsonCount(0, 'boms');

        // Another store's BOM never shows.
        $other = $this->createTenant('production-contract-other', 'ltd_3', 'active');
        DB::table('bill_of_materials')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $other->id, 'product_id' => $this->finished->id,
            'version' => 1, 'effective_from' => today()->toDateString(), 'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->getJson("/s/{$this->tenant->slug}/inventory/production/boms")->assertOk()->assertJsonCount(1, 'boms');

        // Same permission as starting a run (inventory.adjust): a cashier is refused.
        $cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $this->tenant);
        $this->getJson("/s/{$this->tenant->slug}/inventory/production/boms")->assertForbidden();
    }
}
