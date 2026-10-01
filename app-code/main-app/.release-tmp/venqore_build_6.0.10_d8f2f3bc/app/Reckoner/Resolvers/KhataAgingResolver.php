<?php

namespace App\Reckoner\Resolvers;

final class KhataAgingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.aging';
    }
}
