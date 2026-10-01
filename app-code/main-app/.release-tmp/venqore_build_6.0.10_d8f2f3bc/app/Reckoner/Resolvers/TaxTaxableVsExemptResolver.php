<?php

namespace App\Reckoner\Resolvers;

final class TaxTaxableVsExemptResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.taxable_vs_exempt';
    }
}
