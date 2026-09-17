<?php

namespace App\Reckoner\Resolvers;

final class CoreProfitVsPrevResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.profit_vs_prev';
    }
}
