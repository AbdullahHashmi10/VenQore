<?php

namespace App\Services\Commerce;

use Carbon\CarbonImmutable;

/**
 * opening_hours format: {"mon":{"open":"15:00","close":"03:00"}, "tue":null, ...}
 * Missing day or null => closed. close < open is treated as closing after midnight (overnight).
 * Evaluated in the STOREFRONT timezone, never the visitor's.
 */
class OpeningHours
{
    public const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    public static function isOpenNow(?array $hours, ?string $tz, ?CarbonImmutable $now = null): ?bool
    {
        if (empty($hours)) {
            return null; // unknown — shown as no label rather than a guess
        }
        $tz = ! empty($tz) ? $tz : 'UTC';
        try {
            $now = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        } catch (\Throwable) {
            $now = ($now ?? CarbonImmutable::now())->setTimezone('UTC');
        }

        $day = self::DAYS[$now->dayOfWeekIso - 1];
        $prev = self::DAYS[($now->dayOfWeekIso + 5) % 7];
        $minutes = $now->hour * 60 + $now->minute;

        $today = $hours[$day] ?? null;
        if ($today && ! empty($today['open']) && ! empty($today['close'])) {
            [$o, $c] = [self::m($today['open']), self::m($today['close'])];
            // Normal same-day hours (e.g. 09:00 to 21:00)
            if ($c > $o && $minutes >= $o && $minutes < $c) {
                return true;
            }
            // Overnight hours: open today, closes tomorrow (e.g. 15:00 to 03:00)
            if ($c < $o && $minutes >= $o) {
                return true;
            }
            // 24-hours open (e.g. 00:00 to 00:00)
            if ($c === $o) {
                return true;
            }
        }

        // Check if yesterday had overnight hours extending into today before closing time
        $yesterday = $hours[$prev] ?? null;
        if ($yesterday && ! empty($yesterday['open']) && ! empty($yesterday['close'])) {
            [$o, $c] = [self::m($yesterday['open']), self::m($yesterday['close'])];
            if ($c < $o && $minutes < $c) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determines whether the business is currently on a scheduled mid-shift break.
     * Returns an array with break details if on break, or null if not.
     */
    public static function isOnBreak(?array $hours, ?string $tz, ?CarbonImmutable $now = null): ?array
    {
        if (empty($hours)) {
            return null;
        }
        $tz = ! empty($tz) ? $tz : 'UTC';
        try {
            $now = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        } catch (\Throwable) {
            $now = ($now ?? CarbonImmutable::now())->setTimezone('UTC');
        }

        $day = self::DAYS[$now->dayOfWeekIso - 1];
        $prev = self::DAYS[($now->dayOfWeekIso + 5) % 7];
        $minutes = $now->hour * 60 + $now->minute;

        // 1. Check if today's shift is active and on break
        $today = $hours[$day] ?? null;
        if ($today && ! empty($today['open']) && ! empty($today['close']) && ! empty($today['break_start']) && ! empty($today['break_end'])) {
            [$o, $c] = [self::m($today['open']), self::m($today['close'])];
            [$bo, $bc] = [self::m($today['break_start']), self::m($today['break_end'])];

            $shiftActiveToday = ($c > $o && $minutes >= $o && $minutes < $c) // standard daytime
                || ($c < $o && $minutes >= $o)                               // overnight evening
                || ($c === $o);                                               // 24 hours

            if ($shiftActiveToday) {
                if ($bc > $bo && $minutes >= $bo && $minutes < $bc) {
                    $resumeTime = self::format12h($today['break_end']);
                    return [
                        'break_start' => self::format12h($today['break_start']),
                        'break_end' => $resumeTime,
                        'resumes_at' => $resumeTime,
                        'resumes_utc' => $now->startOfDay()->addMinutes($bc)->setTimezone('UTC'),
                    ];
                }
                // Break spans midnight (e.g., 23:30 to 00:30)
                if ($bc < $bo && $minutes >= $bo) {
                    $resumeTime = self::format12h($today['break_end']);
                    return [
                        'break_start' => self::format12h($today['break_start']),
                        'break_end' => $resumeTime,
                        'resumes_at' => $resumeTime,
                        'resumes_utc' => $now->startOfDay()->addDay()->addMinutes($bc)->setTimezone('UTC'),
                    ];
                }
            }
        }

        // 2. Check if yesterday's overnight shift extends into this morning and is on break
        $yesterday = $hours[$prev] ?? null;
        if ($yesterday && ! empty($yesterday['open']) && ! empty($yesterday['close']) && ! empty($yesterday['break_start']) && ! empty($yesterday['break_end'])) {
            [$yo, $yc] = [self::m($yesterday['open']), self::m($yesterday['close'])];
            [$ybo, $ybc] = [self::m($yesterday['break_start']), self::m($yesterday['break_end'])];

            if ($yc < $yo && $minutes < $yc) {
                // Overnight shift from yesterday is active this morning
                // Case A: break scheduled in the morning hours (e.g. 01:00 to 02:00)
                if ($ybc > $ybo && $minutes >= $ybo && $minutes < $ybc) {
                    $resumeTime = self::format12h($yesterday['break_end']);
                    return [
                        'break_start' => self::format12h($yesterday['break_start']),
                        'break_end' => $resumeTime,
                        'resumes_at' => $resumeTime,
                        'resumes_utc' => $now->startOfDay()->addMinutes($ybc)->setTimezone('UTC'),
                    ];
                }
                // Case B: break spanned midnight from last night (e.g. 23:30 to 00:30)
                if ($ybc < $ybo && $minutes < $ybc) {
                    $resumeTime = self::format12h($yesterday['break_end']);
                    return [
                        'break_start' => self::format12h($yesterday['break_start']),
                        'break_end' => $resumeTime,
                        'resumes_at' => $resumeTime,
                        'resumes_utc' => $now->startOfDay()->addMinutes($ybc)->setTimezone('UTC'),
                    ];
                }
            }
        }

        return null;
    }

    /** Next opening instant (UTC) after now, or null when no day has hours. */
    public static function nextOpening(?array $hours, ?string $tz, ?CarbonImmutable $now = null): ?CarbonImmutable
    {
        if (empty($hours)) {
            return null;
        }
        $tz = ! empty($tz) ? $tz : 'UTC';
        try {
            $now = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        } catch (\Throwable) {
            $now = ($now ?? CarbonImmutable::now())->setTimezone('UTC');
        }

        // If currently on break, next opening is when the break ends!
        $onBreak = self::isOnBreak($hours, $tz, $now);
        if ($onBreak !== null && ! empty($onBreak['resumes_utc'])) {
            return $onBreak['resumes_utc'];
        }

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

    /**
     * Human-friendly status & guidance for merchant and customer views.
     */
    public static function statusGuidance(?array $hours, ?string $tz, ?CarbonImmutable $now = null): ?array
    {
        if (empty($hours)) {
            return null;
        }
        $tz = ! empty($tz) ? $tz : 'UTC';
        try {
            $localNow = ($now ?? CarbonImmutable::now())->setTimezone($tz);
        } catch (\Throwable) {
            $localNow = ($now ?? CarbonImmutable::now())->setTimezone('UTC');
            $tz = 'UTC';
        }

        $isOpen = self::isOpenNow($hours, $tz, $localNow);
        $onBreak = self::isOnBreak($hours, $tz, $localNow);
        $dayIdx = $localNow->dayOfWeekIso - 1;
        $dayKey = self::DAYS[$dayIdx];
        $prevKey = self::DAYS[($dayIdx + 6) % 7];
        $minutes = $localNow->hour * 60 + $localNow->minute;

        $guidance = null;
        $closesAt = null;
        $opensAt = null;

        if ($onBreak !== null) {
            $guidance = "On break until {$onBreak['resumes_at']}";
            $opensAt = $onBreak['resumes_at'];
        } elseif ($isOpen) {
            $today = $hours[$dayKey] ?? null;
            $yesterday = $hours[$prevKey] ?? null;

            // Check if open from today's schedule
            if ($today && ! empty($today['open']) && ! empty($today['close'])) {
                [$o, $c] = [self::m($today['open']), self::m($today['close'])];
                if ($c > $o && $minutes >= $o && $minutes < $c) {
                    $closeTime = $localNow->startOfDay()->addMinutes($c)->format('g:i A');
                    $guidance = "Closes today at {$closeTime}";
                    $closesAt = $closeTime;
                } elseif ($c < $o && $minutes >= $o) {
                    $closeTime = $localNow->startOfDay()->addMinutes($c)->format('g:i A');
                    $guidance = "Closes at {$closeTime} tomorrow morning (Overnight)";
                    $closesAt = $closeTime;
                } elseif ($c === $o) {
                    $guidance = "Open 24 hours";
                }
            }

            // If not found yet, check if open from yesterday's overnight schedule
            if (! $guidance && $yesterday && ! empty($yesterday['open']) && ! empty($yesterday['close'])) {
                [$o, $c] = [self::m($yesterday['open']), self::m($yesterday['close'])];
                if ($c < $o && $minutes < $c) {
                    $closeTime = $localNow->startOfDay()->addMinutes($c)->format('g:i A');
                    $guidance = "Closes at {$closeTime} this morning (Overnight shift)";
                    $closesAt = $closeTime;
                }
            }
        } else {
            $nextUtc = self::nextOpening($hours, $tz, $localNow);
            if ($nextUtc) {
                $nextLocal = $nextUtc->setTimezone($tz);
                $openTime = $nextLocal->format('g:i A');
                if ($nextLocal->isSameDay($localNow)) {
                    $guidance = "Opens today at {$openTime}";
                } elseif ($nextLocal->isSameDay($localNow->addDay())) {
                    $guidance = "Opens tomorrow at {$openTime}";
                } else {
                    $guidance = "Opens {$nextLocal->format('l')} at {$openTime}";
                }
                $opensAt = $openTime;
            } else {
                $guidance = "Currently closed";
            }
        }

        return [
            'is_open' => $isOpen && ($onBreak === null),
            'is_on_break' => $onBreak !== null,
            'break_info' => $onBreak,
            'badge' => $onBreak !== null ? "On break until {$onBreak['resumes_at']}" : ($isOpen ? 'Open now' : 'Closed now'),
            'guidance' => $guidance,
            'closes_at' => $closesAt,
            'opens_at' => $opensAt,
            'current_time' => $localNow->format('g:i A'),
            'current_time_full' => $localNow->format('l, g:i A (T)'),
            'current_day_key' => $dayKey,
            'timezone' => $tz,
        ];
    }

    public static function format12h(?string $hhmm): ?string
    {
        if (empty($hhmm)) {
            return null;
        }
        [$h, $m] = array_map('intval', explode(':', $hhmm) + [0, 0]);
        $period = $h >= 12 ? 'PM' : 'AM';
        $h12 = $h % 12;
        if ($h12 === 0) {
            $h12 = 12;
        }
        return sprintf('%d:%02d %s', $h12, $m, $period);
    }

    private static function m(string $hhmm): int
    {
        [$h, $mm] = array_map('intval', explode(':', $hhmm) + [0, 0]);
        return $h * 60 + $mm;
    }
}
