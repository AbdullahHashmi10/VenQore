<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * GaugeProjection: projects percentage ratios (e.g. margin %, expense ratio).
 * Returns null (not 0) when denominator is 0.
 */
class GaugeProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $precision = (int) ($card['precision'] ?? 2);

        if (array_key_exists('value', $measureData) && !isset($measureData['numerator'])) {
            $val = $measureData['value'] !== null ? round((float) $measureData['value'], $precision) : null;
            return [
                'data' => [
                    'value'       => $val,
                    'numerator'   => null,
                    'denominator' => null,
                ],
                'meta' => [
                    'empty' => $val === null,
                ],
                'checks' => $options['checks'] ?? [],
            ];
        }

        $numerator = (float) ($measureData['numerator'] ?? 0.0);
        $denominator = (float) ($measureData['denominator'] ?? 0.0);

        if (abs($denominator) < 0.00001) {
            return [
                'data' => [
                    'value'       => null,
                    'numerator'   => $numerator,
                    'denominator' => $denominator,
                ],
                'meta' => [
                    'empty'  => true,
                    'reason' => 'Zero denominator',
                ],
                'checks' => $options['checks'] ?? [],
            ];
        }

        $pct = round(($numerator / $denominator) * 100, $precision);

        return [
            'data' => [
                'value'       => $pct,
                'numerator'   => round($numerator, $precision),
                'denominator' => round($denominator, $precision),
            ],
            'meta' => [
                'empty' => false,
            ],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
