<?php

namespace Tests\Feature\Ai;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class AiControllerAccessTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
        app()->instance('current.tenant', $this->tenant);
    }

    public function test_restricted_role_cannot_bypass_via_intent_query(): void
    {
        Setting::updateOrCreate(
            ['key' => 'ai_restricted_roles'],
            ['value' => json_encode(['cashier', 'stock_manager'])]
        );
        Setting::updateOrCreate(
            ['key' => 'ai_enabled'],
            ['value' => '1']
        );

        $cashier = User::factory()->create([
            'role' => 'cashier',
        ]);
        $this->tenant->users()->attach($cashier, ['role' => 'cashier']);

        $url = route('store.ai.query', ['store_slug' => $this->tenant->slug, 'query' => 'who owes me money']);
        $response = $this->actingAs($cashier)->getJson($url);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
        ]);
        $this->assertStringContainsString('not authorized', $response->json('message'));
    }

    public function test_disabled_ai_blocks_query_before_intent(): void
    {
        Setting::updateOrCreate(
            ['key' => 'ai_enabled'],
            ['value' => '0']
        );

        $user = User::factory()->create([
            'role' => 'manager',
        ]);
        $this->tenant->users()->attach($user, ['role' => 'manager']);

        $url = route('store.ai.query', ['store_slug' => $this->tenant->slug, 'query' => 'who owes me money']);
        $response = $this->actingAs($user)->getJson($url);

        $response->assertStatus(403);
        $this->assertStringContainsString('disabled', $response->json('message'));
    }
}
