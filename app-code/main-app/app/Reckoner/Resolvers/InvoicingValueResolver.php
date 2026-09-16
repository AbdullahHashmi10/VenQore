<?php

namespace App\Reckoner\Resolvers;

final class InvoicingValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.value';
    }
}
