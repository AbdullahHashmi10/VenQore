<?php

namespace App\Reckoner\Resolvers;

final class InvoicingLargestOpenResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.largest_open';
    }
}
