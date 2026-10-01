<?php

namespace App\Reckoner\Resolvers;

final class RecurringChurnedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.churned';
    }
}
