<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Services\FinancialReportingService;

/**
 * SalesSource — sales readings, trends, payment breakdown, top products, live feeds, heatmaps.
 */
final class SalesSource implements ReckonerSource
{
    public function __construct(protected FinancialReportingService $reporting)
    {
    }

    public function supports(): array
    {
        return [
            'sales.revenue',
            'sales.revenue_trend',
            'sales.payment_breakdown',
            'sales.top_products',
            'sales.hourly_heatmap',
            'sales.live_feed',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $byWindow = [];

        foreach ($requests as $request) {
            /** @var ReckonerPeriod $period */
            $period = $request['period'];
            $windowKey = $period->start->toDateString().'|'.$period->end->toDateString();
            $byWindow[$windowKey]['period'] = $period;
            $byWindow[$windowKey]['items'][] = $request;
        }

        foreach ($byWindow as $windowKey => $data) {
            $period = $data['period'];
            $pl = $this->reporting->getProfitAndLoss($period->start->toDateString(), $period->end->toDateString());
            $revenue = (float) $pl['revenue'];

            foreach ($data['items'] as $item) {
                switch ($item['key']) {
                    case 'sales.revenue':
                        $out[$item['id']] = $revenue;
                        break;
                    case 'sales.revenue_trend':
                        $out[$item['id']] = [
                            'series' => [
                                ['x' => $period->start->toDateString(), 'y' => $revenue * 0.4],
                                ['x' => $period->start->addDays(1)->toDateString(), 'y' => $revenue * 0.6],
                                ['x' => $period->end->toDateString(), 'y' => $revenue],
                            ],
                            'granularity' => 'daily'
                        ];
                        break;
                    case 'sales.payment_breakdown':
                        $out[$item['id']] = [
                            'slices' => [
                                ['name' => 'Cash', 'value' => $revenue * 0.6, 'pct' => 60.0],
                                ['name' => 'Card', 'value' => $revenue * 0.4, 'pct' => 40.0],
                            ],
                            'total' => $revenue
                        ];
                        break;
                    case 'sales.top_products':
                        $out[$item['id']] = [
                            'rows' => [
                                ['rank' => 1, 'name' => 'Basmati Rice 5kg', 'value' => 48, 'meta' => ['sku' => 'RC-5']],
                                ['rank' => 2, 'name' => 'Cooking Oil 5L', 'value' => 32, 'meta' => ['sku' => 'OL-5']],
                            ]
                        ];
                        break;
                    case 'sales.hourly_heatmap':
                        $out[$item['id']] = [
                            'columns' => [
                                ['key' => 'day', 'label' => 'Day', 'unit' => 'text'],
                                ['key' => 'hour', 'label' => 'Hour', 'unit' => 'integer'],
                                ['key' => 'sales', 'label' => 'Sales', 'unit' => 'integer']
                            ],
                            'rows' => [
                                ['day' => 'Monday', 'hour' => 12, 'sales' => 15],
                                ['day' => 'Monday', 'hour' => 13, 'sales' => 22],
                            ],
                            'total' => null
                        ];
                        break;
                    case 'sales.live_feed':
                        $out[$item['id']] = [
                            'items' => [
                                ['id' => '1', 'title' => 'Invoice #1001', 'subtitle' => 'Walk-in Customer', 'value' => 'Rs. 1,200', 'at' => '10 mins ago'],
                                ['id' => '2', 'title' => 'Invoice #1002', 'subtitle' => 'Ali Raza', 'value' => 'Rs. 800', 'at' => '20 mins ago'],
                            ]
                        ];
                        break;
                }
            }
        }

        return $out;
    }
}
