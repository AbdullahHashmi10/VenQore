<?php

namespace App\Reckoner\Resolvers;

final class PoOpenValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.open_value';
    }
}
