<?php

namespace App\Reckoner\Resolvers;

final class BatchesExpiring30Resolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.expiring_30';
    }
}
