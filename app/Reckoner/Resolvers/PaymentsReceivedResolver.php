<?php

namespace App\Reckoner\Resolvers;

final class PaymentsReceivedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.received';
    }
}
