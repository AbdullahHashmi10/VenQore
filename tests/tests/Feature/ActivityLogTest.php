<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StoreActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Request;

class ActivityLogTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_model_activity_logging_records_full_audit_details(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        // Mock IP and User Agent on Request using a partial mock to allow system rebinding
        $requestMock = \Mockery::mock(request());
        $requestMock->makePartial();
        $requestMock->shouldReceive('ip')->andReturn('192.168.1.100');
        $requestMock->shouldReceive('userAgent')->andReturn('TestAgent/1.0');
        Request::swap($requestMock);

        // 1. Create a product and assert creation activity log is written
        $product = Product::create([
            'name' => 'Audited Product',
            'price' => 15.00,
            'cost_price' => 10.00,
            'sku' => 'AUD-PROD-1',
            'quantity' => 10,
        ]);

        $createLog = StoreActivityLog::where('action', 'product.created')
            ->where('tenant_id', $tenant->id)
            ->first();

        $this->assertNotNull($createLog);
        $this->assertEquals('Product', class_basename($createLog->subject_type));
        $this->assertEquals($product->id, $createLog->subject_id);
        $this->assertEquals('192.168.1.100', $createLog->ip_address);
        $this->assertEquals('TestAgent/1.0', $createLog->user_agent);

        // 2. Update the product and assert update activity log with payload is written
        $product->update([
            'price' => 20.00,
        ]);

        $updateLog = StoreActivityLog::where('action', 'product.updated')
            ->where('tenant_id', $tenant->id)
            ->first();

        $this->assertNotNull($updateLog);
        $this->assertEquals('192.168.1.100', $updateLog->ip_address);
        $this->assertEquals('TestAgent/1.0', $updateLog->user_agent);
        $this->assertNotNull($updateLog->payload);
        $this->assertArrayHasKey('old', $updateLog->payload);
        $this->assertArrayHasKey('new', $updateLog->payload);
        $this->assertEquals(15.00, $updateLog->payload['old']['price']);
        $this->assertEquals(20.00, $updateLog->payload['new']['price']);
    }
}
