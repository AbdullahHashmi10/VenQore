<?php

namespace App\Reckoner\Resolvers;

final class InvoicingValueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'invoicing.value_trend';
    }
}
