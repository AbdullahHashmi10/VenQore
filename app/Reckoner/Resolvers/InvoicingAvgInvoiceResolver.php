<?php

namespace App\Reckoner\Resolvers;

final class InvoicingAvgInvoiceResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.avg_invoice';
    }
}
