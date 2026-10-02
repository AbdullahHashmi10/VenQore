<?php

namespace App\Models\Commerce\Concerns;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use DateTimeInterface;

/**
 * The host app switches PHP's timezone per tenant on staff pages but not on public pages, so naive
 * datetime strings written by one request are misread by another. Commerce rows are therefore always
 * written AND read as UTC, and converted to the store's timezone only for display.
 */
trait UtcTimes
{
    public function freshTimestamp()
    {
        return Carbon::now('UTC');
    }

    protected function asDateTime($value)
    {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/', $value)) {
            return Carbon::parse($value, 'UTC');
        }
        if ($value instanceof CarbonInterface) {
            return $value->copy()->setTimezone('UTC');
        }
        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value)->setTimezone('UTC');
        }
        return parent::asDateTime($value);
    }

    protected function serializeDate(DateTimeInterface $date)
    {
        return Carbon::instance($date)->setTimezone('UTC')->toIso8601ZuluString();
    }

    /** Display helper: "2026-10-03 01:56" in the given store timezone. */
    public static function localTime($value, ?string $tz): ?string
    {
        if (! $value) {
            return null;
        }
        return Carbon::instance($value instanceof DateTimeInterface ? $value : Carbon::parse($value, 'UTC'))
            ->setTimezone($tz ?: 'UTC')->format('Y-m-d H:i');
    }
}
