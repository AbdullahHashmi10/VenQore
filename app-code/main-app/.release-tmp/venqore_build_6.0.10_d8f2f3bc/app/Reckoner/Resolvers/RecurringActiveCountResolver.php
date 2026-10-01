<?php

namespace App\Reckoner\Resolvers;

final class RecurringActiveCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.active_count';
    }
}
