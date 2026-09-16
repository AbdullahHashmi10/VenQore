<?php

namespace App\Reckoner\Resolvers;

final class PaymentsBouncedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.bounced';
    }
}
