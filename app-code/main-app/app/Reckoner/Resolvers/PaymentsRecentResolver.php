<?php

namespace App\Reckoner\Resolvers;

final class PaymentsRecentResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.recent';
    }
}
