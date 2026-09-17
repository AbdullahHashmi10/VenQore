<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * StatProjection: projects a single scalar or comparative value.
 */
class StatProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $precision = (int) ($card['precision'] ?? 2);
        $primaryValue = 0.0;

        if (isset($measureData['value'])) {
            $primaryValue = (float) $measureData['value'];
        } elseif (!empty($measureData)) {
            $first = reset($measureData);
            if (is_numeric($first)) {
                $primaryValue = (float) $first;
            } elseif (is_array($first) && isset($first['value'])) {
                $primaryValue = (float) $first['value'];
            }
        }

        $primaryValue = round($primaryValue, $precision);

        $data = [
            'value' => $primaryValue,
        ];

        // If comparison value is provided in options
        if (array_key_exists('compare_value', $options) && $options['compare_value'] !== null) {
            $prevValue = round((float) $options['compare_value'], $precision);
            $diff = round($primaryValue - $prevValue, $precision);
            $pct = $prevValue != 0.0 ? round(($diff / abs($prevValue)) * 100, 1) : null;

            $data['comparison'] = [
                'previous' => $prevValue,
                'change'   => $diff,
                'percent'  => $pct,
            ];
        }

        return [
            'data' => $data,
            'meta' => [
                'empty' => empty($measureData) && $primaryValue === 0.0,
            ],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
