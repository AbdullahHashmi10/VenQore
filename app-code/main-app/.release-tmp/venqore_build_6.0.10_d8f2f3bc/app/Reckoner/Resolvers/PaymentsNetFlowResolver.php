<?php

namespace App\Reckoner\Resolvers;

final class PaymentsNetFlowResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.net_flow';
    }
}
