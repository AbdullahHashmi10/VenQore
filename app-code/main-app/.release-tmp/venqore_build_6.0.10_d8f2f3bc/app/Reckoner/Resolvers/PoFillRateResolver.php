<?php

namespace App\Reckoner\Resolvers;

final class PoFillRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.fill_rate';
    }
}
