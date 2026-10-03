<?php

namespace App\Services\Commerce;

use Carbon\CarbonImmutable;

/**
 * opening_hours format: {"mon":{"open":"09:00","close":"21:00"}, "tue":null, ...}
 * Missing day or null => closed. close < open is treated as closing after midnight.
 * Evaluated in the STOREFRONT timezone, never the visitor's.
 */
class OpeningHours
{
    public const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    public static function isOpenNow(?array $hours, string $tz, ?CarbonImmutable $now = null): ?bool
    {
        if (empty($hours)) {
            return null; // unknown — shown as no label rather than a guess
        }
        $now = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        $day = self::DAYS[$now->dayOfWeekIso - 1];
        $prev = self::DAYS[($now->dayOfWeekIso + 5) % 7];
        $minutes = $now->hour * 60 + $now->minute;

        $today = $hours[$day] ?? null;
        if ($today && ! empty($today['open']) && ! empty($today['close'])) {
            [$o, $c] = [self::m($today['open']), self::m($today['close'])];
            if ($c > $o && $minutes >= $o && $minutes < $c) {
                return true;
            }
            if ($c <= $o && $minutes >= $o) {
                return true;
            }
        }
        $yesterday = $hours[$prev] ?? null;
        if ($yesterday && ! empty($yesterday['open']) && ! empty($yesterday['close'])) {
            [$o, $c] = [self::m($yesterday['open']), self::m($yesterday['close'])];
            if ($c <= $o && $minutes < $c) {
                return true;
            }
        }
        return false;
    }

    /** Next opening instant (UTC) after now, or null when no day has hours. */
    public static function nextOpening(?array $hours, string $tz, ?CarbonImmutable $now = null): ?CarbonImmutable
    {
        if (empty($hours)) {
            return null;
        }
        $now = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        for ($i = 0; $i <= 7; $i++) {
            $d = $now->addDays($i);
            $h = $hours[self::DAYS[$d->dayOfWeekIso - 1]] ?? null;
            if (! $h || empty($h['open']) || empty($h['close'])) {
                continue;
            }
            $m = self::m($h['open']);
            $at = $d->startOfDay()->addMinutes($m);
            if ($at->gt($now)) {
                return $at->setTimezone('UTC');
            }
        }
        return null;
    }

    private static function m(string $hhmm): int
    {
        [$h, $mm] = array_map('intval', explode(':', $hhmm) + [0, 0]);
        return $h * 60 + $mm;
    }
}
