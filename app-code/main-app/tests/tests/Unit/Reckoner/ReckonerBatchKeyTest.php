<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Models\User;
use Tests\TestCase;

/**
 * ReckonerBatchKeyTest — verifies that requesting the same key at different
 * periods or parameters returns distinct results in the response, mapped
 * correctly by their composite IDs.
 *
 * @group reckoner
 */
class ReckonerBatchKeyTest extends TestCase
{
    public function test_same_key_at_different_periods_returns_distinct_results(): void
    {
        $reckoner = app(Reckoner::class);
        $tenant = app('current.tenant');
        $user = User::make(['id' => 1, 'is_platform_admin' => true]);

        // Use anonymous class because SalesSource is final and cannot be doubled with PHPUnit createMock
        $sourceMock = new class implements \App\Reckoner\Sources\ReckonerSource {
            public function supports(): array {
                return ['sales.revenue'];
            }
            public function resolveBatch(array $requests, \App\Reckoner\ReckonerContext $ctx): array {
                $out = [];
                foreach ($requests as $r) {
                    if (str_contains($r['id'], 'yesterday')) {
                        $out[$r['id']] = 80.0;
                    } else {
                        $out[$r['id']] = 120.0;
                    }
                }
                return $out;
            }
        };
        app()->instance(\App\Reckoner\Sources\SalesSource::class, $sourceMock);

        $request1 = new ReckonerRequest(key: 'sales.revenue', period: 'today');
        $request2 = new ReckonerRequest(key: 'sales.revenue', period: 'yesterday');

        $results = $reckoner->readMany([$request1, $request2], $user, $tenant);

        $id1 = $request1->getCompositeId();
        $id2 = $request2->getCompositeId();

        $this->assertCount(2, $results);
        $this->assertArrayHasKey($id1, $results);
        $this->assertArrayHasKey($id2, $results);

        $this->assertTrue($results[$id1]->ok);
        $this->assertTrue($results[$id2]->ok);

        $this->assertSame(120.0, $results[$id1]->data['value']);
        $this->assertSame(80.0, $results[$id2]->data['value']);
    }
}
