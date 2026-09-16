<?php

namespace App\Reckoner\Resolvers;

final class BatchesExpiringValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.expiring_value';
    }
}
