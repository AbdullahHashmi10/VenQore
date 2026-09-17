<?php

namespace App\Reckoner\Resolvers;

final class TaxInvoicesMissingTaxResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.invoices_missing_tax';
    }
}
