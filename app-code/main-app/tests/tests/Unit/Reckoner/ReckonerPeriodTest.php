<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerPeriod;
use Tests\TestCase;

/**
 * ReckonerPeriod — period resolution, timezone handling, and validation.
 * No database required — all period logic is deterministic date arithmetic.
 *
 * @group reckoner
 */
class ReckonerPeriodTest extends TestCase
{
    /* ------------------------------------------------------------------ *
     * Named periods resolve without throwing
     * ------------------------------------------------------------------ */

    /** @dataProvider namedPeriodProvider */
    public function test_named_period_resolves(string $key): void
    {
        $tenant = $this->makeTenant();
        $period = ReckonerPeriod::resolve($key, null, $tenant);

        $this->assertInstanceOf(ReckonerPeriod::class, $period);
        $this->assertSame($key, $period->key);
        $this->assertTrue(
            $period->start->lte($period->end),
            "Period '{$key}' has start after end."
        );
    }

    public static function namedPeriodProvider(): array
    {
        // 'custom' and 'as_of' need custom date arguments and are tested separately.
        $skip = ['custom', 'as_of'];
        return array_map(
            fn ($k) => [$k],
            array_filter(ReckonerPeriod::KEYS, fn ($k) => ! in_array($k, $skip, true))
        );
    }

    /* ------------------------------------------------------------------ *
     * Today
     * ------------------------------------------------------------------ */

    public function test_today_start_and_end_are_same_date(): void
    {
        $period = ReckonerPeriod::resolve('today', null, $this->makeTenant());
        $this->assertSame($period->start->toDateString(), $period->end->toDateString());
    }

    /* ------------------------------------------------------------------ *
     * This week / this month / this quarter / this year
     * ------------------------------------------------------------------ */

    public function test_this_month_start_is_first_of_month(): void
    {
        $period = ReckonerPeriod::resolve('this_month', null, $this->makeTenant());
        $this->assertSame('01', $period->start->format('d'));
    }

    public function test_this_year_start_is_january_first(): void
    {
        $period = ReckonerPeriod::resolve('this_year', null, $this->makeTenant());
        $this->assertSame('01-01', $period->start->format('m-d'));
    }

    /* ------------------------------------------------------------------ *
     * Custom range
     * ------------------------------------------------------------------ */

    public function test_custom_range_uses_supplied_dates(): void
    {
        $period = ReckonerPeriod::resolve('custom', ['from' => '2026-01-01', 'to' => '2026-03-31'], $this->makeTenant());
        $this->assertSame('2026-01-01', $period->start->toDateString());
        $this->assertSame('2026-03-31', $period->end->toDateString());
    }

    public function test_custom_range_requires_both_dates(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        ReckonerPeriod::resolve('custom', ['from' => '2026-01-01'], $this->makeTenant());
    }

    public function test_custom_range_start_after_end_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        ReckonerPeriod::resolve('custom', ['from' => '2026-12-31', 'to' => '2026-01-01'], $this->makeTenant());
    }

    /* ------------------------------------------------------------------ *
     * Live / as_of
     * ------------------------------------------------------------------ */

    public function test_live_period_resolves(): void
    {
        $period = ReckonerPeriod::resolve('live', null, $this->makeTenant());
        $this->assertSame('live', $period->key);
    }

    /* ------------------------------------------------------------------ *
     * KEYS constant is a non-empty list of strings
     * ------------------------------------------------------------------ */

    public function test_keys_constant_is_non_empty(): void
    {
        $this->assertNotEmpty(ReckonerPeriod::KEYS);
        foreach (ReckonerPeriod::KEYS as $k) {
            $this->assertIsString($k);
        }
    }

    public function test_custom_is_in_keys(): void
    {
        $this->assertContains('custom', ReckonerPeriod::KEYS);
    }

    /* ------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------ */

    private function makeTenant(): \App\Models\Tenant
    {
        return app('current.tenant'); // set by TestCase::setUp()
    }
}
