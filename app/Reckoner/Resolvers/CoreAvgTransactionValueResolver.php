<?php

namespace App\Reckoner\Resolvers;

final class CoreAvgTransactionValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.avg_transaction_value';
    }
}
