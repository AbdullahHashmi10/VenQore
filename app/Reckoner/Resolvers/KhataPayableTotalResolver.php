<?php

namespace App\Reckoner\Resolvers;

final class KhataPayableTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.payable_total';
    }
}
