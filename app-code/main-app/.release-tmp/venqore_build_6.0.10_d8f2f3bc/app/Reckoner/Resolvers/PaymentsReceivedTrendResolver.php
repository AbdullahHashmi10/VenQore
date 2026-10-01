<?php

namespace App\Reckoner\Resolvers;

final class PaymentsReceivedTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.received_trend';
    }
}
