<?php

namespace App\Reckoner\Resolvers;

final class AssetsDepreciationPeriodResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.depreciation_period';
    }
}
