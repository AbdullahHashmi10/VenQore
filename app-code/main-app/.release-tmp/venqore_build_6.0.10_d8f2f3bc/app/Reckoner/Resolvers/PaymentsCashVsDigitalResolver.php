<?php

namespace App\Reckoner\Resolvers;

final class PaymentsCashVsDigitalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.cash_vs_digital';
    }
}
