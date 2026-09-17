<?php

namespace App\Reckoner\Resolvers;

final class InvoicingOverdueCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.overdue_count';
    }
}
