<?php

namespace App\Reckoner\Resolvers;

final class TaxFilingDueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.filing_due';
    }
}
