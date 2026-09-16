<?php

namespace App\Reckoner\Resolvers;

final class PosHourlyHeatmapResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.hourly_heatmap';
    }
}
