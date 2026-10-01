<?php

namespace App\Reckoner\Resolvers;

final class BatchesWriteOffTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'batches.write_off_trend';
    }
}
