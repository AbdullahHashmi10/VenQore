<?php

namespace App\Reckoner\Resolvers;

final class BatchesQtyResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.qty';
    }
}
