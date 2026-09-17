<?php

namespace App\Reckoner\Resolvers;

final class KhataReceivableTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.receivable_total';
    }
}
