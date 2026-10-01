<?php

namespace App\Reckoner\Resolvers;

final class InvoicingUnpaidValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.unpaid_value';
    }
}
