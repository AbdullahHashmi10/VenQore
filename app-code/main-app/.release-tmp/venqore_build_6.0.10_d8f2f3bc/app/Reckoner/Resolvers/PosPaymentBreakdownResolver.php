<?php

namespace App\Reckoner\Resolvers;

final class PosPaymentBreakdownResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.payment_breakdown';
    }
}
