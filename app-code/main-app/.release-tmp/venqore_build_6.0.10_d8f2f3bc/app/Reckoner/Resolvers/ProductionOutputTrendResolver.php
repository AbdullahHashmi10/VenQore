<?php

namespace App\Reckoner\Resolvers;

final class ProductionOutputTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.output_trend';
    }
}
