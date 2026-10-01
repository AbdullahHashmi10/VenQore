<?php

namespace App\Reckoner\Resolvers;

final class LoansOutstandingTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loans.outstanding_trend';
    }
}
