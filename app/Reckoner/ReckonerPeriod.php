<?php

namespace App\Reckoner;

use App\Models\Tenant;
use Carbon\CarbonImmutable;
use InvalidArgumentException;

/**
 * The only class in the entire application permitted to construct a date
 * range for a metric. See §3.2 of VENQORE_RECKONER_BUILD_SPEC.md.
 *
 * Decision baked in here, nowhere else: VenQore has no fiscal-year system, so
 * every yearly and quarterly period runs on the CALENDAR — 1 January to
 * 31 December, Jan–Mar / Apr–Jun / Jul–Sep / Oct–Dec. If a fiscal-year field
 * is ever added, this is the only class that changes.
 *
 * All windows resolve in the tenant's timezone, matching
 * WidgetDataService::now(). CarbonImmutable is used throughout so a period,
 * once resolved, can never be mutated by a caller holding a reference to it.
 *
 * Acceptance test: `grep -rn "startOfMonth\|startOfYear\|subDays\|whereBetween\|whereDate" app/Reckoner/`
 * must return hits only inside this file.
 */
final class ReckonerPeriod
{
    public const KEYS = [
        'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month',
        'this_quarter', 'last_quarter', 'this_year', 'last_year', 'last_7_days',
        'last_30_days', 'last_90_days', 'last_12_months', 'all_time', 'custom',
        'as_of', 'live',
    ];

    public function __construct(
        public readonly string $key,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
        public readonly ?CarbonImmutable $compareStart,
        public readonly ?CarbonImmutable $compareEnd,
        public readonly string $label,
        public readonly string $compareLabel,
    ) {
    }

    /**
     * Resolve a period key into concrete start/end (and comparison) windows,
     * in the tenant's timezone.
     *
     * @param  array{from?: string, to?: string}|null  $custom  Required (and only used) when $key === 'custom'.
     */
    public static function resolve(string $key, ?array $custom, ?Tenant $tenant): self
    {
        if (! in_array($key, self::KEYS, true)) {
            throw new InvalidArgumentException("Unknown Reckoner period key: {$key}");
        }

        $timezone = $tenant?->timezone ?: config('app.timezone', 'UTC');
        $now = CarbonImmutable::now($timezone);

        $period = match ($key) {
            'today' => self::fromDay($now, $now->subDay(), 'today', 'vs yesterday'),
            'yesterday' => self::fromDay($now->subDay(), $now->subDays(2), 'Yesterday', 'vs day before'),

            'this_week' => self::build(
                $now->startOfWeek(), $now,
                $now->subWeek()->startOfWeek(), $now->subWeek(),
                'This week', 'vs same span last week',
            ),
            'last_week' => self::build(
                $now->subWeek()->startOfWeek(), $now->subWeek()->endOfWeek(),
                $now->subWeeks(2)->startOfWeek(), $now->subWeeks(2)->endOfWeek(),
                'Last week', 'vs week before',
            ),

            'this_month' => self::build(
                $now->startOfMonth(), $now->endOfMonth(),
                $now->subMonthNoOverflow()->startOfMonth(), $now->subMonthNoOverflow()->endOfMonth(),
                $now->format('F Y'), 'vs '.$now->subMonthNoOverflow()->format('F'),
            ),
            'last_month' => self::build(
                $now->subMonthNoOverflow()->startOfMonth(), $now->subMonthNoOverflow()->endOfMonth(),
                $now->subMonthsNoOverflow(2)->startOfMonth(), $now->subMonthsNoOverflow(2)->endOfMonth(),
                $now->subMonthNoOverflow()->format('F Y'), 'vs month before',
            ),

            'this_quarter' => self::calendarQuarter($now, 0, $now, 'This quarter', 'vs same quarter last year', 4),
            'last_quarter' => self::calendarQuarter($now, 1, $now, 'Last quarter', 'vs quarter before', 1),

            'this_year' => self::build(
                $now->startOfYear(), $now,
                $now->subYear()->startOfYear(), $now->subYear(),
                (string) $now->year, 'vs same span last year',
            ),
            'last_year' => self::build(
                $now->subYear()->startOfYear(), $now->subYear()->endOfYear(),
                $now->subYears(2)->startOfYear(), $now->subYears(2)->endOfYear(),
                (string) $now->subYear()->year, 'vs year before',
            ),

            'last_7_days' => self::rolling($now, 7, 'Last 7 days'),
            'last_30_days' => self::rolling($now, 30, 'Last 30 days'),
            'last_90_days' => self::rolling($now, 90, 'Last 90 days'),

            'last_12_months' => self::build(
                $now->subMonthsNoOverflow(11)->startOfMonth(), $now,
                $now->subMonthsNoOverflow(23)->startOfMonth(), $now->subMonthsNoOverflow(12),
                'Last 12 months', 'vs preceding 12 months',
            ),

            'all_time' => self::build(
                CarbonImmutable::createFromDate(1900, 1, 1, $timezone)->startOfDay(), $now,
                null, null,
                'All time', '',
            ),

            'custom' => self::customPeriod($custom, $now),

            'as_of' => self::build(
                CarbonImmutable::createFromDate(1900, 1, 1, $timezone)->startOfDay(), $now,
                null, null,
                'As of '.$now->toDateString(), '',
            ),

            'live' => self::build($now, $now, null, null, 'Live', ''),

            default => throw new InvalidArgumentException("Unknown Reckoner period key: {$key}"),
        };

        return new self(
            key: $key,
            start: $period->start,
            end: $period->end,
            compareStart: $period->compareStart,
            compareEnd: $period->compareEnd,
            label: $period->label,
            compareLabel: $period->compareLabel,
        );
    }

    /** All period definitions, unresolved — used by ReckonerRegistryTest to validate `periods` lists. */
    public static function all(): array
    {
        return self::KEYS;
    }

    /* ------------------------------------------------------------------ *
     * Builders
     * ------------------------------------------------------------------ */

    private static function fromDay(
        CarbonImmutable $day,
        CarbonImmutable $compareDay,
        string $label,
        string $compareLabel,
    ): self {
        return self::build(
            $day->startOfDay(), $day->endOfDay(),
            $compareDay->startOfDay(), $compareDay->endOfDay(),
            $label, $compareLabel,
        );
    }

    private static function rolling(CarbonImmutable $now, int $days, string $label): self
    {
        return self::build(
            $now->subDays($days - 1)->startOfDay(), $now,
            $now->subDays(($days * 2) - 1)->startOfDay(), $now->subDays($days)->endOfDay(),
            $label, "vs preceding {$days} days",
        );
    }

    /**
     * Calendar quarter, $offset quarters back from now (0 = this quarter,
     * 1 = last quarter). $compareOffset controls how many quarters back the
     * comparison window sits (4 = same quarter last year, 1 = the quarter
     * immediately before).
     */
    private static function calendarQuarter(
        CarbonImmutable $now,
        int $offset,
        CarbonImmutable $anchor,
        string $label,
        string $compareLabel,
        int $compareOffsetQuarters,
    ): self {
        $quarterStart = $now->firstOfQuarter()->subQuarters($offset);
        $isCurrentQuarter = $offset === 0;
        $end = $isCurrentQuarter ? $now : $quarterStart->lastOfQuarter();
        $start = $quarterStart->startOfDay();

        $compareStart = $start->subQuarters($compareOffsetQuarters);
        $compareEnd = $isCurrentQuarter
            ? $compareStart->addDays($now->diffInDays($start))
            : $compareStart->lastOfQuarter();

        $quarterLabel = 'Q'.$start->quarter.' '.$start->year;

        return self::build($start, $end, $compareStart, $compareEnd, $quarterLabel, $compareLabel);
    }

    private static function customPeriod(?array $custom, CarbonImmutable $now): self
    {
        if (empty($custom['from']) || empty($custom['to'])) {
            throw new InvalidArgumentException('Custom period requires both "from" and "to".');
        }

        $tz = $now->timezone;
        $start = CarbonImmutable::parse($custom['from'], $tz)->startOfDay();
        $end = CarbonImmutable::parse($custom['to'], $tz)->endOfDay();

        if ($end->lessThan($start)) {
            throw new InvalidArgumentException('Custom period "to" must not be before "from".');
        }

        $spanDays = (int) $start->diffInDays($end) + 1;
        $compareEnd = $start->subDay()->endOfDay();
        $compareStart = $compareEnd->subDays($spanDays - 1)->startOfDay();

        return self::build(
            $start, $end, $compareStart, $compareEnd,
            $start->toDateString().' – '.$end->toDateString(),
            'vs preceding period',
        );
    }

    private static function build(
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?CarbonImmutable $compareStart,
        ?CarbonImmutable $compareEnd,
        string $label,
        string $compareLabel,
    ): self {
        return new self(
            key: 'resolved',
            start: $start,
            end: $end,
            compareStart: $compareStart,
            compareEnd: $compareEnd,
            label: $label,
            compareLabel: $compareLabel,
        );
    }

    /** The equivalent preceding window as a standalone period, or null. */
    public function comparisonWindow(): ?self
    {
        if ($this->compareStart === null || $this->compareEnd === null) {
            return null;
        }

        return new self(
            key: $this->key.'_compare',
            start: $this->compareStart,
            end: $this->compareEnd,
            compareStart: null,
            compareEnd: null,
            label: $this->compareLabel,
            compareLabel: '',
        );
    }
}
