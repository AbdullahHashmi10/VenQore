<?php

namespace App\Reckoner\Resolvers;

final class RecurringShareOfRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.share_of_revenue';
    }
}
