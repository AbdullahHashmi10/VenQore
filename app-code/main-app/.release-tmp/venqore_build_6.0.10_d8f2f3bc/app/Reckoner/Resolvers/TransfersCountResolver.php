<?php

namespace App\Reckoner\Resolvers;

final class TransfersCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'transfers.count';
    }
}
