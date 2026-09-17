<?php

namespace App\Reckoner\Resolvers;

final class BatchesExpiryListResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.expiry_list';
    }
}
