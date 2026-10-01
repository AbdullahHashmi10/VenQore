<?php

namespace App\Reckoner\Resolvers;

final class InvoicingOverdueValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.overdue_value';
    }
}
