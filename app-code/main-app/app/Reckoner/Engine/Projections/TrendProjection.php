<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * TrendProjection: projects time-series points per server grain.
 * Invariant rules:
 * - Flows: trend_sums_to_stat
 * - Balances: trend_endpoint_matches_stat
 */
class TrendProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $precision = (int) ($card['precision'] ?? 2);
        $points = $measureData['series'] ?? $measureData['points'] ?? $measureData;

        $series = [];
        $total = 0.0;
        $lastVal = 0.0;

        foreach ($points as $date => $val) {
            $num = round((float) (is_array($val) ? ($val['value'] ?? 0) : $val), $precision);
            $series[] = [
                'date'  => (string) $date,
                'value' => $num,
            ];
            $total += $num;
            $lastVal = $num;
        }

        $isFlow = ($card['tier'] ?? '') === 'Flow' || ($card['contract']['period_kind'] ?? '') === 'flow';
        $headlineValue = $isFlow ? round($total, $precision) : $lastVal;

        $data = [
            'value'  => $headlineValue,
            'series' => $series,
            'total'  => round($total, $precision),
        ];

        return [
            'data' => $data,
            'meta' => [
                'empty' => empty($series),
                'grain' => $options['grain'] ?? 'daily',
            ],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
