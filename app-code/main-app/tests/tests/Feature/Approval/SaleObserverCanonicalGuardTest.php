<?php

namespace Tests\Feature\Approval;

use App\Engines\SaleService;
use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\CanonicalPostingScope;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class SaleObserverCanonicalGuardTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private Warehouse $warehouse;
    private Party $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        CanonicalPostingScope::reset();

        $this->tenant = $this->createTenant();
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->bindTenantContext($this->tenant, $this->owner);

        $this->warehouse = Warehouse::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Main Warehouse',
            'code' => 'WH-' . uniqid(),
            'status' => 'active',
        ]);

        $this->customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'type' => 'customer',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'sku' => 'SKU-' . uniqid(),
            'type' => 'standard',
            'base_unit' => 'pcs',
            'retail_price' => 100.00,
            'purchase_price' => 50.00,
            'cost_price' => 50.00,
            'stock_quantity' => 100,
            'is_active' => true,
        ]);

        // Create inventory batch
        DB::table('inventory_batches')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'initial_qty' => 100,
            'original_qty' => 100,
            'remaining_qty' => 100,
            'unit_cost' => 50.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_direct_eloquent_posted_sale_creation_is_denied(): void
    {
        $this->assertFalse(CanonicalPostingScope::isActive());

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        // Attempt direct creation outside canonical posting scope
        Sale::create([
            'tenant_id' => $this->tenant->id,
            'reference_number' => 'SAL-DIRECT-FAIL',
            'party_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'net_sales' => 100.00,
            'invoice_total' => 100.00,
            'subtotal' => 100.00,
            'total' => 100.00,
            'status' => 'posted',
        ]);
    }

    public function test_sale_service_post_succeeds_through_canonical_scope(): void
    {
        $this->actingAs($this->owner);
        app()->instance('current.tenant', $this->tenant);

        $saleService = app(SaleService::class);

        $result = $saleService->post([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'cash',
            'amount_received' => 100.00,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'qty' => 1,
                    'sale_uom' => 'pcs',
                    'unit_price' => 100.00,
                ],
            ],
        ]);

        $this->assertNotNull($result);
        $this->assertEquals('posted', $result->status);
        $this->assertFalse(CanonicalPostingScope::isActive()); // Scope exited cleanly
    }

    public function test_approval_execution_engine_post_succeeds_through_canonical_scope(): void
    {
        $this->actingAs($this->owner);

        $doc = ApprovalDocument::create([
            'tenant_id' => $this->tenant->id,
            'document_type' => ApprovalDocument::TYPE_SALES_INVOICE,
            'status' => ApprovalDocument::STATUS_PENDING,
            'maker_id' => $this->owner->id,
            'version' => 1,
        ]);

        $revision = ApprovalRevision::create([
            'approval_document_id' => $doc->id,
            'revision_number' => 1,
            'title' => 'Sale Invoice Approval Test',
            'amount' => 100.00,
            'payload' => [
                'party_id' => $this->customer->id,
                'warehouse_id' => $this->warehouse->id,
                'payment_method' => 'cash',
                'amount_received' => 100.00,
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'qty' => 1,
                        'sale_uom' => 'pcs',
                        'unit_price' => 100.00,
                    ],
                ],
            ],
            'payload_hash' => hash('sha256', 'test'),
            'created_by' => $this->owner->id,
        ]);

        $doc->current_revision_id = $revision->id;
        $doc->save();

        $engine = app(ApprovalExecutionEngine::class);
        $result = $engine->approve($doc->id, $this->tenant, $this->owner);

        $this->assertTrue($result['success']);
        $this->assertEquals(ApprovalDocument::STATUS_APPROVED, $result['document']->status);
        $this->assertFalse(CanonicalPostingScope::isActive());
    }

    public function test_canonical_posting_scope_handles_nested_and_exceptional_calls_safely(): void
    {
        $this->assertFalse(CanonicalPostingScope::isActive());

        CanonicalPostingScope::run(function () {
            $this->assertTrue(CanonicalPostingScope::isActive());

            CanonicalPostingScope::run(function () {
                $this->assertTrue(CanonicalPostingScope::isActive());
            });

            $this->assertTrue(CanonicalPostingScope::isActive());
        });

        $this->assertFalse(CanonicalPostingScope::isActive());

        // Test exception safety
        try {
            CanonicalPostingScope::run(function () {
                $this->assertTrue(CanonicalPostingScope::isActive());
                throw new \RuntimeException('Test exception');
            });
        } catch (\RuntimeException $e) {
            // Expected
        }

        $this->assertFalse(CanonicalPostingScope::isActive());
    }
}
