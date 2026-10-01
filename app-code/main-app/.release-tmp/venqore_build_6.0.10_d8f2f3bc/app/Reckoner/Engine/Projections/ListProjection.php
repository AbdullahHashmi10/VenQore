<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * ListProjection: projects rankings, sorted lists, and feed items.
 * Carries total and truncated flag when capped.
 */
class ListProjection implements ProjectionInterface
{
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array {
        $rows = $measureData['rows'] ?? $measureData['items'] ?? $measureData;
        $limit = $options['limit'] ?? 10;

        $items = [];
        $totalSum = 0.0;

        foreach ($rows as $r) {
            $arr = (array) $r;
            $items[] = $arr;
            if (isset($arr['amount'])) {
                $totalSum += (float) $arr['amount'];
            } elseif (isset($arr['value'])) {
                $totalSum += (float) $arr['value'];
            } elseif (isset($arr['total_amount'])) {
                $totalSum += (float) $arr['total_amount'];
            }
        }

        $count = count($items);
        $truncated = $count > $limit;
        $displayItems = array_slice($items, 0, $limit);

        $headlineValue = isset($options['headline_value'])
            ? (float) $options['headline_value']
            : (float) $totalSum;

        $data = [
            'value'     => $headlineValue,
            'items'     => $displayItems,
            'count'     => $count,
            'total'     => $totalSum,
            'truncated' => $truncated,
        ];

        return [
            'data'   => $data,
            'meta'   => ['empty' => empty($displayItems)],
            'checks' => $options['checks'] ?? [],
        ];
    }
}
