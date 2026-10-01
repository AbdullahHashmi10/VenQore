<?php

namespace App\Reckoner\Resolvers;

final class InvoicingCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.count';
    }
}
