<?php

namespace App\Reckoner\Resolvers;

final class TransfersPendingCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'transfers.pending_count';
    }
}
