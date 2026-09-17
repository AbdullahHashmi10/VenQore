<?php

namespace App\Reckoner\Resolvers;

final class TransfersPendingValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'transfers.pending_value';
    }
}
