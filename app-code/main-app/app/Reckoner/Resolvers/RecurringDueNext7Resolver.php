<?php

namespace App\Reckoner\Resolvers;

final class RecurringDueNext7Resolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.due_next_7';
    }
}
