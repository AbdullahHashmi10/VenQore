<?php

namespace App\Reckoner\Resolvers;

final class TaxNetLiabilityResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.net_liability';
    }
}
