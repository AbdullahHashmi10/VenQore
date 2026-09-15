<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\ReckonerPeriod;
use Carbon\CarbonImmutable;
use Tests\Feature\VenQoreTestCase;

/**
 * §10 — ReckonerPeriodTest: all 18 periods; tenant timezone; calendar-year
 * quarters and years; comparison windows; DST and leap-day edges.
 */
class ReckonerPeriodTest extends VenQoreTestCase
{
    public function test_all_eighteen_period_keys_resolve_without_error(): void
    {
        $tenant = $this->createTenant();
        $tenant->timezone = 'Asia/Karachi';
        $tenant->save();

        foreach (ReckonerPeriod::KEYS as $key) {
            $custom = $key === 'custom' ? ['from' => '2026-01-01', 'to' => '2026-01-31'] : null;

            $period = ReckonerPeriod::resolve($key, $custom, $tenant);

            $this->assertSame($key, $period->key);
            $this->assertTrue(
                $period->start->lessThanOrEqualTo($period->end),
                "Period '{$key}' has start after end.",
            );
        }
    }

    public function test_periods_resolve_in_tenant_timezone(): void
    {
        $tenant = $this->createTenant();
        $tenant->timezone = 'Asia/Karachi';
        $tenant->save();

        $period = ReckonerPeriod::resolve('today', null, $tenant);

        $this->assertSame('Asia/Karachi', $period->start->timezoneName);
        $this->assertSame('Asia/Karachi', $period->end->timezoneName);
    }

    public function test_periods_fall_back_to_app_timezone_without_tenant(): void
    {
        $period = ReckonerPeriod::resolve('today', null, null);

        $this->assertSame(config('app.timezone', 'UTC'), $period->start->timezoneName);
    }

    public function test_this_year_runs_calendar_january_to_now(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('this_year', null, $tenant);

        $this->assertSame(1, $period->start->month);
        $this->assertSame(1, $period->start->day);
    }

    public function test_this_quarter_is_a_calendar_quarter(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('this_quarter', null, $tenant);

        // A calendar quarter always starts on Jan/Apr/Jul/Oct 1st.
        $this->assertContains($period->start->month, [1, 4, 7, 10]);
        $this->assertSame(1, $period->start->day);
    }

    public function test_last_quarter_compares_to_the_quarter_before(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('last_quarter', null, $tenant);

        $this->assertNotNull($period->compareStart);
        $this->assertTrue($period->compareEnd->lessThan($period->start));
    }

    public function test_last_year_is_the_full_previous_calendar_year(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('last_year', null, $tenant);
        $expectedYear = CarbonImmutable::now($tenant->timezone ?: 'UTC')->year - 1;

        $this->assertSame($expectedYear, $period->start->year);
        $this->assertSame($expectedYear, $period->end->year);
        $this->assertSame(1, $period->start->month);
        $this->assertSame(12, $period->end->month);
    }

    public function test_all_time_starts_in_1900(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('all_time', null, $tenant);

        $this->assertSame(1900, $period->start->year);
        $this->assertNull($period->compareStart);
    }

    public function test_custom_period_requires_from_and_to(): void
    {
        $tenant = $this->createTenant();

        $this->expectException(\InvalidArgumentException::class);
        ReckonerPeriod::resolve('custom', [], $tenant);
    }

    public function test_custom_period_uses_equal_length_preceding_comparison_window(): void
    {
        $tenant = $this->createTenant();
        $period = ReckonerPeriod::resolve('custom', ['from' => '2026-03-01', 'to' => '2026-03-10'], $tenant);

        // 10-day span; the comparison window must also be 10 days, ending the day before.
        $spanDays = $period->start->diffInDays($period->end) + 1;
        $compareSpanDays = $period->compareStart->diffInDays($period->compareEnd) + 1;

        $this->assertSame(10, (int) $spanDays);
        $this->assertSame(10, (int) $compareSpanDays);
        $this->assertTrue($period->compareEnd->lessThan($period->start));
    }

    public function test_leap_day_last_year_resolves_cleanly(): void
    {
        $tenant = $this->createTenant();
        $tenant->timezone = 'UTC';
        $tenant->save();

        CarbonImmutable::setTestNow(CarbonImmutable::create(2024, 2, 29, 12, 0, 0, 'UTC'));

        try {
            $period = ReckonerPeriod::resolve('last_year', null, $tenant);
            $this->assertSame(2023, $period->start->year);
            $this->assertSame(2023, $period->end->year);
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    public function test_dst_spring_forward_does_not_break_today(): void
    {
        $tenant = $this->createTenant();
        $tenant->timezone = 'America/New_York';
        $tenant->save();

        // 2026-03-08 is a US DST transition date (2am -> 3am).
        CarbonImmutable::setTestNow(CarbonImmutable::create(2026, 3, 8, 14, 0, 0, 'America/New_York'));

        try {
            $period = ReckonerPeriod::resolve('today', null, $tenant);
            $this->assertSame(8, $period->start->day);
            $this->assertTrue($period->start->lessThan($period->end));
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    public function test_unknown_period_key_throws(): void
    {
        $tenant = $this->createTenant();

        $this->expectException(\InvalidArgumentException::class);
        ReckonerPeriod::resolve('not_a_real_period', null, $tenant);
    }
}
