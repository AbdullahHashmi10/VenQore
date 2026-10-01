<?php

namespace App\Reckoner\Resolvers;

final class QuotationsWinRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.win_rate';
    }
}
