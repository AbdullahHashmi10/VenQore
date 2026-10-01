<?php

namespace App\Reckoner\Resolvers;

final class QuotationsWinRateTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.win_rate_trend';
    }
}
