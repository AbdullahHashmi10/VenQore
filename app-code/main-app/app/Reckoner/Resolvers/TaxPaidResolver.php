<?php

namespace App\Reckoner\Resolvers;

final class TaxPaidResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.paid';
    }
}
