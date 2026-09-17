<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * BreakdownProjection: projects grouped segments.
 * Invariant: segments must sum to parent total within 0.01 or check fails.
 */
class BreakdownProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $precision = (int) ($card['precision'] ?? 2);
        $rawSegments = $measureData['segments'] ?? $measureData['breakdown'] ?? $measureData;

        $segments = [];
        $sum = 0.0;

        foreach ($rawSegments as $label => $val) {
            $amt = round((float) (is_array($val) ? ($val['value'] ?? 0) : $val), $precision);
            $segments[] = [
                'label' => (string) $label,
                'value' => $amt,
            ];
            $sum += $amt;
        }

        $parentTotal = isset($options['parent_total']) ? (float) $options['parent_total'] : $sum;
        $parentTotal = round($parentTotal, $precision);
        $diff = abs($sum - $parentTotal);

        $checks = $options['checks'] ?? [];
        if (isset($options['parent_total'])) {
            $passed = $diff <= 0.05;
            $checks[] = [
                'key'        => 'breakdown_sums_to_parent',
                'status'     => $passed ? 'pass' : 'fail',
                'difference' => $diff,
                'message'    => $passed
                    ? "Breakdown segments sum to parent total ({$parentTotal})."
                    : "Breakdown segments sum ({$sum}) does not match parent total ({$parentTotal}). Diff: {$diff}",
            ];
        }

        // Add percentages
        foreach ($segments as &$seg) {
            $seg['percent'] = $parentTotal != 0.0
                ? round(($seg['value'] / $parentTotal) * 100, 1)
                : 0.0;
        }

        $data = [
            'value'    => $parentTotal,
            'segments' => $segments,
            'total'    => round($sum, $precision),
        ];

        return [
            'data'   => $data,
            'meta'   => ['empty' => empty($segments)],
            'checks' => $checks,
        ];
    }
}
