<?php

namespace App\Reckoner\Resolvers;

final class KhataCollectedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.collected';
    }
}
