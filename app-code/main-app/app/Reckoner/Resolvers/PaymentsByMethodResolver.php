<?php

namespace App\Reckoner\Resolvers;

final class PaymentsByMethodResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.by_method';
    }
}
