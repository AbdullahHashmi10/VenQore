<?php

namespace App\Reckoner\Resolvers;

final class CoreTransactionCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.transaction_count';
    }
}
