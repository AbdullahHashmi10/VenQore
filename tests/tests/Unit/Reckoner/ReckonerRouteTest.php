<?php

namespace Tests\Unit\Reckoner;

use App\Models\User;
use App\Models\Tenant;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

/**
 * ReckonerRouteTest — verifies the Reckoner HTTP routes are reachable,
 * authenticated, and correctly enforce tenant scoping rules.
 *
 * Runs on the MariaDB test database.
 *
 * @group reckoner
 */
class ReckonerRouteTest extends TestCase
{
    use DatabaseTransactions;

    public function test_reckoner_routes_require_authentication(): void
    {
        // Unauthenticated -> 401
        $response = $this->getJson('/api/reckoner/catalogue');
        $response->assertStatus(401);

        $response = $this->postJson('/api/reckoner/read', ['requests' => []]);
        $response->assertStatus(401);
    }

    public function test_catalogue_route_returns_tenant_metrics(): void
    {
        // Create actual database records for auth session
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        // Bind fake/actual tenant to DI container for request lifecycle
        app()->instance('current.tenant', $tenant);

        // Access route as authenticated user
        $response = $this->actingAs($user)
            ->getJson('/api/reckoner/catalogue');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'key',
                    'domain',
                    'label',
                    'generic',
                    'description',
                    'help',
                    'shape',
                    'unit',
                    'direction',
                    'signed',
                    'periods',
                    'default_period',
                    'supports_comparison',
                    'supports_series',
                    'drill_route',
                ]
            ]
        ]);

        // Platform-scoped keys must never appear in the tenant catalogue
        $keys = array_column($response->json('data'), 'key');
        $this->assertNotContains('platform.active_tenant_count', $keys);
        $this->assertNotContains('platform.mrr', $keys);
    }

    public function test_read_route_performs_batch_reads(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        // Give the user platform admin privileges so permission checks pass
        $user->is_platform_admin = true;
        $user->save();

        app()->instance('current.tenant', $tenant);

        // Use anonymous class because SalesSource is final
        $sourceMock = new class implements \App\Reckoner\Sources\ReckonerSource {
            public function supports(): array {
                return ['sales.revenue'];
            }
            public function resolveBatch(array $requests, \App\Reckoner\ReckonerContext $ctx): array {
                $out = [];
                foreach ($requests as $r) {
                    $out[$r['id']] = 1000.0;
                }
                return $out;
            }
        };
        app()->instance(\App\Reckoner\Sources\SalesSource::class, $sourceMock);

        $response = $this->actingAs($user)
            ->postJson('/api/reckoner/read', [
                'requests' => [
                    ['key' => 'sales.revenue', 'period' => 'today']
                ]
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'key',
                    'ok',
                    'shape',
                    'unit',
                    'precision',
                    'period',
                    'label',
                    'help',
                    'direction',
                    'data',
                    'meta',
                    'drill',
                ]
            ]
        ]);

        $data = $response->json('data.0.data');
        $this->assertEquals(1000.0, $data['value']);
    }
}
