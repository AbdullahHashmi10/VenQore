<?php

namespace App\Reckoner\Resolvers;

final class ServicesShareOfRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.share_of_revenue';
    }
}
