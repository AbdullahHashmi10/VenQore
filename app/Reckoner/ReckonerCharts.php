<?php

namespace App\Reckoner;

/**
 * ReckonerCharts — defines legal combinations of metric shapes and chart types.
 *
 * See §4.1. This is the backend authority that ensures the frontend picker
 * only shows legal configurations, and that the API rejects invalid charts.
 */
final class ReckonerCharts
{
    public const MAP = [
        'scalar'       => ['stat', 'sparkline', 'gauge', 'ring'],
        'series'       => ['line', 'area', 'bar', 'sparkline', 'live_line', 'profit_loss_line', 'composed', 'scatter', 'heatmap'],
        'multi_series' => ['line', 'area', 'bar', 'composed', 'radar', 'scatter', 'sankey'],
        'breakdown'    => ['pie', 'ring', 'sunburst', 'bar', 'funnel', 'radar', 'stat'],
        'table'        => ['table', 'bar', 'heatmap'],
        'ranking'      => ['table', 'bar', 'funnel', 'pie'],
        'funnel'       => ['funnel', 'bar', 'sankey'],
        'gauge'        => ['gauge', 'ring', 'stat'],
        'status'       => ['status', 'stat'],
        'feed'         => ['feed', 'table'],
        'geo'          => ['choropleth', 'table'],
    ];

    /**
     * Get legal chart keys for a shape.
     */
    public static function for(ReckonerShape $shape): array
    {
        return self::MAP[$shape->value] ?? [];
    }

    /**
     * Determine if a shape and chart pair is legal.
     */
    public static function isLegal(ReckonerShape $shape, string $chart): bool
    {
        return in_array($chart, self::for($shape), true);
    }

    /**
     * The default chart for a shape.
     */
    public static function default(ReckonerShape $shape): string
    {
        return self::for($shape)[0] ?? 'stat';
    }
}
