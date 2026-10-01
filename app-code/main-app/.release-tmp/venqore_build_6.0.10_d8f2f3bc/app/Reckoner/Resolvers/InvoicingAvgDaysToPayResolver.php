<?php

namespace App\Reckoner\Resolvers;

final class InvoicingAvgDaysToPayResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.avg_days_to_pay';
    }
}
