<?php

namespace App\Reckoner\Resolvers;

final class BatchesExpiredValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.expired_value';
    }
}
