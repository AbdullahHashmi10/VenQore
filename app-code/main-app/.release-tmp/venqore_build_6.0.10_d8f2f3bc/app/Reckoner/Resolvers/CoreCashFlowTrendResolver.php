<?php

namespace App\Reckoner\Resolvers;

final class CoreCashFlowTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.cash_flow_trend';
    }
}
