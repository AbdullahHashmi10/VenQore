<?php

namespace App\Reckoner\Resolvers;

final class BatchesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.count';
    }
}
