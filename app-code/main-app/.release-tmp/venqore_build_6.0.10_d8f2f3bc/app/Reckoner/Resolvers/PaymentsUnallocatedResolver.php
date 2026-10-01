<?php

namespace App\Reckoner\Resolvers;

final class PaymentsUnallocatedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'payments.unallocated';
    }
}
