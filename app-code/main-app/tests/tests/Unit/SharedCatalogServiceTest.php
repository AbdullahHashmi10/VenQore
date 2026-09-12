<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\SharedProduct;
use App\Models\SharedProductContribution;
use App\Services\SharedCatalogService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SharedCatalogServiceTest extends TestCase
{
    public function test_single_tenant_multiple_contributions_does_not_publish(): void
    {
        $tenant = new Tenant();
        $tenant->id = '11111111-1111-1111-1111-111111111111';
        $tenant->shared_catalog_opt_out = false;

        $service = new SharedCatalogService();
        $barcode = 'TEST-BARCODE-' . uniqid();

        // 3 contributions from the SAME tenant
        $service->contribute($tenant, $barcode, ['canonical_name' => 'Widget Pro']);
        $service->contribute($tenant, $barcode, ['canonical_name' => 'Widget Pro']);
        $service->contribute($tenant, $barcode, ['canonical_name' => 'Widget Pro']);

        $product = SharedProduct::where('barcode', $barcode)->first();
        $this->assertNotNull($product);
        $this->assertEquals(1, $product->confirmations);
        $this->assertFalse((bool) $product->is_published);
    }

    public function test_distinct_tenants_reach_threshold_publishes_product(): void
    {
        $t1 = new Tenant(); $t1->id = '11111111-1111-1111-1111-111111111111';
        $t2 = new Tenant(); $t2->id = '22222222-2222-2222-2222-222222222222';
        $t3 = new Tenant(); $t3->id = '33333333-3333-3333-3333-333333333333';
        $t4 = new Tenant(); $t4->id = '44444444-4444-4444-4444-444444444444';
        $t5 = new Tenant(); $t5->id = '55555555-5555-5555-5555-555555555555';

        $service = new SharedCatalogService();
        $barcode = 'TEST-BARCODE-' . uniqid();

        $service->contribute($t1, $barcode, ['canonical_name' => 'Shared Soda']);
        $product = SharedProduct::where('barcode', $barcode)->first();
        $this->assertFalse((bool) $product->is_published);

        $service->contribute($t2, $barcode, ['canonical_name' => 'Shared Soda']);
        $service->contribute($t3, $barcode, ['canonical_name' => 'Shared Soda']);
        $service->contribute($t4, $barcode, ['canonical_name' => 'Shared Soda']);
        $product->refresh();
        $this->assertFalse((bool) $product->is_published);

        $service->contribute($t5, $barcode, ['canonical_name' => 'Shared Soda']);
        $product->refresh();
        $this->assertTrue((bool) $product->is_published);
        $this->assertEquals(5, $product->confirmations);
    }

    public function test_opted_out_tenant_contributes_nothing(): void
    {
        $tenant = new Tenant();
        $tenant->id = '99999999-9999-9999-9999-999999999999';
        $tenant->shared_catalog_opt_out = true;

        $service = new SharedCatalogService();
        $barcode = 'OPT-OUT-BARCODE-' . uniqid();

        $result = $service->contribute($tenant, $barcode, ['canonical_name' => 'Private Label Product']);

        $this->assertFalse($result);
        $this->assertNull(SharedProduct::where('barcode', $barcode)->first());
    }
}
