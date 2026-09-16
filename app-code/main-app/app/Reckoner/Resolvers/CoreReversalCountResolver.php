<?php

namespace App\Reckoner\Resolvers;

final class CoreReversalCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.reversal_count';
    }
}
