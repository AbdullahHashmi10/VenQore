<?php

namespace App\Reckoner\Resolvers;

final class PaymentsPaidResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.paid';
    }
}
