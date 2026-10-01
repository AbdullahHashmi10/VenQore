<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * HeatmapProjection: projects 2D matrices (e.g. weekday x hour).
 */
class HeatmapProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $matrix = $measureData['matrix'] ?? $measureData;
        $total = 0.0;

        foreach ($matrix as $row) {
            if (is_array($row)) {
                foreach ($row as $cell) {
                    $total += (float) (is_array($cell) ? ($cell['value'] ?? 0) : $cell);
                }
            }
        }

        return [
            'data' => [
                'value'  => $total,
                'matrix' => $matrix,
            ],
            'meta' => [
                'empty' => empty($matrix),
            ],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
