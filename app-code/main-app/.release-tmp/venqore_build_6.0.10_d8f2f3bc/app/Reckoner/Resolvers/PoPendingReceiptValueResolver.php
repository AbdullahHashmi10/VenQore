<?php

namespace App\Reckoner\Resolvers;

final class PoPendingReceiptValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.pending_receipt_value';
    }
}
