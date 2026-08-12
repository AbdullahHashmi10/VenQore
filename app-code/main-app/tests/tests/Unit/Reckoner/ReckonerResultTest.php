<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Tests\TestCase;

/**
 * ReckonerResult — the envelope every reading returns. These tests check
 * serialisation, the shape/data pass-through, and the failure envelope.
 *
 * @group reckoner
 */
class ReckonerResultTest extends TestCase
{
    /* ------------------------------------------------------------------ *
     * failure() envelope
     * ------------------------------------------------------------------ */

    public function test_failure_returns_not_ok(): void
    {
        $result = ReckonerResult::failure('sales.revenue|today|hash', 'sales.revenue', 'not_found', 'No key.');
        $this->assertFalse($result->ok);
    }

    public function test_failure_serialises_error_structure(): void
    {
        $result = ReckonerResult::failure('sales.revenue|today|hash', 'sales.revenue', 'plan_locked', 'Upgrade required.');
        $arr = $result->toArray();

        $this->assertSame('sales.revenue|today|hash', $arr['id']);
        $this->assertSame('sales.revenue', $arr['key']);
        $this->assertFalse($arr['ok']);
        $this->assertSame('plan_locked', $arr['error']['code']);
        $this->assertSame('Upgrade required.', $arr['error']['message']);
        $this->assertArrayNotHasKey('data', $arr);
    }

    public function test_failure_does_not_expose_shape_or_period(): void
    {
        $arr = ReckonerResult::failure('x|today|hash', 'x', 'not_found', 'x')->toArray();
        $this->assertArrayNotHasKey('shape', $arr);
        $this->assertArrayNotHasKey('period', $arr);
    }

    /* ------------------------------------------------------------------ *
     * success() envelope
     * ------------------------------------------------------------------ */

    private function makeSuccessResult(mixed $data, array $definitionOverrides = []): ReckonerResult
    {
        $period = \App\Reckoner\ReckonerPeriod::resolve('today', null, app('current.tenant'));

        $definition = array_merge([
            'key'              => 'sales.revenue',
            'label'            => 'Revenue',
            'help'             => 'Money earned.',
            'shape'            => ReckonerShape::SCALAR,
            'unit'             => 'currency',
            'precision'        => 2,
            'direction'        => 'higher_is_better',
            'signed'           => false,
            'drill_route'      => 'reports.sales',
        ], $definitionOverrides);

        return ReckonerResult::success(
            'sales.revenue|today|hash',
            'sales.revenue',
            $definition['shape'],
            $definition,
            $period,
            $data
        );
    }

    public function test_success_is_ok(): void
    {
        $this->assertTrue($this->makeSuccessResult(['value' => 1234.56])->ok);
    }

    public function test_success_exposes_data(): void
    {
        $result = $this->makeSuccessResult(['value' => 999.0]);
        $arr = $result->toArray();

        $this->assertSame(['value' => 999.0], $arr['data']);
    }

    public function test_success_exposes_period(): void
    {
        $arr = $this->makeSuccessResult(['value' => 0.0])->toArray();
        $this->assertArrayHasKey('period', $arr);
        $this->assertArrayHasKey('from', $arr['period']);
        $this->assertArrayHasKey('to', $arr['period']);
    }

    public function test_success_exposes_drill(): void
    {
        $arr = $this->makeSuccessResult(['value' => 0.0])->toArray();
        $this->assertArrayHasKey('drill', $arr);
        $this->assertSame('reports.sales', $arr['drill']['route']);
    }

    public function test_meta_includes_computed_at(): void
    {
        $arr = $this->makeSuccessResult(['value' => 0.0])->toArray();
        $this->assertArrayHasKey('computed_at', $arr['meta']);
    }

    public function test_status_shape_passes_through_as_is(): void
    {
        // §7.19: STATUS payloads are not wrapped in {value: ...}.
        $statusPayload = ['state' => 'balanced', 'label' => 'Balanced', 'severity' => 'ok'];

        $result = $this->makeSuccessResult($statusPayload, [
            'shape' => ReckonerShape::STATUS,
            'key'   => 'finance.balance_sheet_ok',
            'label' => 'Books Balanced',
        ]);

        $arr = $result->toArray();
        $this->assertSame($statusPayload, $arr['data']);
    }

    public function test_json_serialize_matches_to_array(): void
    {
        $result = $this->makeSuccessResult(['value' => 5.0]);
        $this->assertSame($result->toArray(), $result->jsonSerialize());
    }
}
