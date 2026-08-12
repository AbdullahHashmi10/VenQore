<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\ReckonerResult;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

/**
 * ReckonerComparisonTest — verifies previous and change_pct fields are computed
 * correctly according to comparison configurations and the zero-baseline rule.
 *
 * @group reckoner
 */
class ReckonerComparisonTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_comparison_resolves_previous_and_change_pct(): void
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
                    $out[$r['id']] = str_contains($r['id'], ':cmp') ? 100.0 : 150.0;
                }
                return $out;
            }
        };
        app()->instance(\App\Reckoner\Sources\SalesSource::class, $sourceMock);

        $request = new ReckonerRequest(key: 'sales.revenue', period: 'this_month');
        $result = $reckoner->read($request, $user, $tenant);

        $this->assertTrue($result->ok);
        $data = $result->data;
        $this->assertSame(150.0, $data['value']);
        $this->assertSame(100.0, $data['previous']);
        $this->assertSame(50.0, $data['change_pct']); // ((150 - 100) / 100) * 100 = 50%
    }

    public function test_zero_baseline_returns_null_change_pct(): void
    {
        $reckoner = app(Reckoner::class);
        $tenant = app('current.tenant');
        $user = User::make(['id' => 1, 'is_platform_admin' => true]);

        $sourceMock = new class implements \App\Reckoner\Sources\ReckonerSource {
            public function supports(): array {
                return ['sales.revenue'];
            }
            public function resolveBatch(array $requests, \App\Reckoner\ReckonerContext $ctx): array {
                $out = [];
                foreach ($requests as $r) {
                    $out[$r['id']] = str_contains($r['id'], ':cmp') ? 0.0 : 150.0;
                }
                return $out;
            }
        };
        app()->instance(\App\Reckoner\Sources\SalesSource::class, $sourceMock);

        $request = new ReckonerRequest(key: 'sales.revenue', period: 'this_month');
        $result = $reckoner->read($request, $user, $tenant);

        $this->assertTrue($result->ok);
        $data = $result->data;
        $this->assertSame(150.0, $data['value']);
        $this->assertSame(0.0, $data['previous']);
        $this->assertNull($data['change_pct']); // Zero-baseline rule: must be null
    }

    public function test_live_period_does_not_trigger_comparison_read(): void
    {
        $reckoner = app(Reckoner::class);
        $tenant = app('current.tenant');
        $user = User::make(['id' => 1, 'is_platform_admin' => true]);

        $sourceMock = new class implements \App\Reckoner\Sources\ReckonerSource {
            public function supports(): array {
                return ['finance.balance_sheet_ok'];
            }
            public function resolveBatch(array $requests, \App\Reckoner\ReckonerContext $ctx): array {
                $out = [];
                foreach ($requests as $r) {
                    if (str_contains($r['id'], ':cmp')) {
                        throw new \Exception("Comparison request should not be generated for live-only periods!");
                    }
                    $out[$r['id']] = ['state' => 'balanced', 'label' => 'Balanced', 'severity' => 'ok'];
                }
                return $out;
            }
        };
        app()->instance(\App\Reckoner\Sources\FinanceSource::class, $sourceMock);

        $request = new ReckonerRequest(key: 'finance.balance_sheet_ok', period: 'live');
        $result = $reckoner->read($request, $user, $tenant);

        $this->assertTrue($result->ok);
        $data = $result->data;
        $this->assertSame('balanced', $data['state']);
        $this->assertNull($data['previous'] ?? null);
    }
}
