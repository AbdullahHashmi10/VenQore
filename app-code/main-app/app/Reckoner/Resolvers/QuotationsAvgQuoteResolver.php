<?php

namespace App\Reckoner\Resolvers;

final class QuotationsAvgQuoteResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'quotations.avg_quote';
    }
}
