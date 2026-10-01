<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * StatusProjection: projects boolean status / health checks (e.g. balance_sheet_ok).
 */
class StatusProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $passed = (bool) ($measureData['passed'] ?? true);
        $message = $measureData['message'] ?? ($passed ? 'Passed' : 'Failed');
        $difference = (float) ($measureData['difference'] ?? 0.0);

        return [
            'data' => [
                'value'      => $passed ? 1.0 : 0.0,
                'status'     => $passed ? 'ok' : 'fail',
                'message'    => $message,
                'difference' => $difference,
            ],
            'meta' => [
                'empty' => false,
            ],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
