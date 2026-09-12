<?php

namespace Tests\Feature\Ai;

use App\Jobs\GenerateProductDescriptionsJob;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Feature\VenQoreTestCase;

class GenerateProductDescriptionsJobTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('ai_usage_events')->delete();
    }

    public function test_tenant_with_no_entitlement_and_no_byok_makes_zero_calls_and_zero_usage_rows(): void
    {
        Http::fake();

        $tenant = $this->createTenant();
        $tenant->update(['ai_status' => 'none', 'ai_descriptions_balance' => 0]);
        $product = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Sample T-Shirt']);

        $job = new GenerateProductDescriptionsJob($tenant->id, [$product->id]);
        $job->handle();

        Http::assertNothingSent();
        $this->assertDatabaseCount('ai_usage_events', 0);
    }

    public function test_tenant_with_byok_records_usage_with_key_mode_byok(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'ai_title' => 'Enhanced T-Shirt',
                                        'ai_description_short' => 'Great shirt',
                                        'ai_description_long' => '100% cotton premium t-shirt',
                                        'ai_tags' => 'shirt,cotton,casual',
                                    ])
                                ]
                            ]
                        ]
                    ]
                ],
                'usageMetadata' => [
                    'promptTokenCount' => 120,
                    'candidatesTokenCount' => 60,
                ]
            ], 200)
        ]);

        $tenant = $this->createTenant();
        $tenant->update(['ai_status' => 'none', 'ai_descriptions_balance' => 0]);

        // Add BYOK key
        Setting::create([
            'tenant_id' => $tenant->id,
            'key'       => 'smartcapture_api_key',
            'value'     => 'test-byok-gemini-key',
        ]);

        $product = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Sample T-Shirt']);

        $job = new GenerateProductDescriptionsJob($tenant->id, [$product->id]);
        $job->handle();

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'key=test-byok-gemini-key');
        });

        $this->assertDatabaseHas('ai_usage_events', [
            'tenant_id' => $tenant->id,
            'feature'   => 'catalog',
            'key_mode'  => 'byok',
            'success'   => 1,
        ]);
    }
}
