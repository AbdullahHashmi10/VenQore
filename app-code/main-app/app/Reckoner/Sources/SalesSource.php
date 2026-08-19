<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;

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
            'sales.max_sale',
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
                        $granularity = match($period->key) {
                            'this_year', 'last_year', 'last_12_months' => 'monthly',
                            default => 'daily',
                        };
                        $profitByPeriod = $this->reporting->getProfitByPeriod($period->start->toDateString(), $period->end->toDateString(), $granularity);
                        $series = [];
                        foreach ($profitByPeriod as $date => $metrics) {
                            $series[] = [
                                'x' => $date,
                                'y' => (float) $metrics['revenue']
                            ];
                        }
                        usort($series, fn($a, $b) => strcmp($a['x'], $b['x']));
                        $out[$item['id']] = [
                            'series' => $series,
                            'granularity' => $granularity
                        ];
                        break;

                    case 'sales.payment_breakdown':
                        $paymentRows = DB::table('sales')
                            ->where('tenant_id', $ctx->tenant->id)
                            ->where('status', 'posted')
                            ->whereBetween('posted_at', [$period->start->toDateString() . ' 00:00:00', $period->end->toDateString() . ' 23:59:59'])
                            ->select('payment_method', DB::raw('SUM(net_sales) as val'))
                            ->groupBy('payment_method')
                            ->get();
                        $total = (float) $paymentRows->sum('val');
                        $slices = [];
                        foreach ($paymentRows as $row) {
                            $val = (float) $row->val;
                            $slices[] = [
                                'name' => ucfirst($row->payment_method ?: 'other'),
                                'value' => $val,
                                'pct' => $total > 0 ? round(($val / $total) * 100, 1) : 0.0
                            ];
                        }
                        $out[$item['id']] = [
                            'slices' => $slices,
                            'total' => $total
                        ];
                        break;

                    case 'sales.top_products':
                        $productRows = $this->reporting->getGrossProfitByProduct($period->start->toDateString(), $period->end->toDateString())
                            ->sortByDesc('quantity')
                            ->take(6)
                            ->values();
                        $rank = 1;
                        $rankings = [];
                        foreach ($productRows as $row) {
                            $rankings[] = [
                                'rank' => $rank++,
                                'name' => $row['name'],
                                'value' => (int) $row['quantity'],
                                'meta' => ['sku' => $row['sku']]
                            ];
                        }
                        $out[$item['id']] = [
                            'rows' => $rankings
                        ];
                        break;

                    case 'sales.hourly_heatmap':
                        $timezone = $ctx->tenant->timezone ?: config('app.timezone', 'UTC');
                        $offset = now($timezone)->getOffset();
                        $adjustedDate = "DATE_ADD(sales.created_at, INTERVAL {$offset} SECOND)";
                        $dayNameExpr = "DAYNAME({$adjustedDate})";
                        $hourExpr = "HOUR({$adjustedDate})";

                        $heatmapRows = DB::table('sales')
                            ->where('tenant_id', $ctx->tenant->id)
                            ->where('status', 'posted')
                            ->whereBetween('posted_at', [$period->start->toDateString() . ' 00:00:00', $period->end->toDateString() . ' 23:59:59'])
                            ->selectRaw("{$dayNameExpr} as day_name, {$hourExpr} as hour, COUNT(*) as count")
                            ->groupBy('day_name', 'hour')
                            ->get();

                        $formattedRows = [];
                        foreach ($heatmapRows as $row) {
                            $formattedRows[] = [
                                'day' => $row->day_name,
                                'hour' => (int) $row->hour,
                                'sales' => (int) $row->count,
                            ];
                        }

                        $out[$item['id']] = [
                            'columns' => [
                                ['key' => 'day', 'label' => 'Day', 'unit' => 'text'],
                                ['key' => 'hour', 'label' => 'Hour', 'unit' => 'integer'],
                                ['key' => 'sales', 'label' => 'Sales', 'unit' => 'integer']
                            ],
                            'rows' => $formattedRows,
                            'total' => null
                        ];
                        break;

                    case 'sales.live_feed':
                        $feedRows = DB::table('sales')
                            ->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
                            ->where('sales.tenant_id', $ctx->tenant->id)
                            ->where('sales.status', 'posted')
                            ->select('sales.id', 'sales.reference_number', 'sales.net_sales', 'sales.created_at', 'parties.name as party_name')
                            ->orderByDesc('sales.created_at')
                            ->limit(10)
                            ->get();

                        $feedItems = [];
                        foreach ($feedRows as $row) {
                            $createdAt = \Carbon\Carbon::parse($row->created_at);
                            $feedItems[] = [
                                'id' => (string) $row->id,
                                'title' => 'Invoice #' . ($row->reference_number ?: $row->id),
                                'subtitle' => $row->party_name ?: 'Walk-in ' . 'Customer',
                                'value' => 'Rs. ' . number_format($row->net_sales, 2),
                                'at' => $createdAt->diffForHumans(),
                            ];
                        }

                        $out[$item['id']] = [
                            'items' => $feedItems
                        ];
                        break;

                    case 'sales.max_sale':
                        $out[$item['id']] = (float) DB::table('sales')
                            ->where('tenant_id', $ctx->tenant->id)
                            ->where('status', 'posted')
                            ->whereBetween('posted_at', [$period->start, $period->end])
                            ->max('net_sales') ?? 0.0;
                        break;
                }
            }
        }

        return $out;
    }
}
