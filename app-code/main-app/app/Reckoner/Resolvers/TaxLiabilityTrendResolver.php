<?php

namespace App\Reckoner\Resolvers;

final class TaxLiabilityTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.liability_trend';
    }
}
