<?php

namespace App\Reckoner\Resolvers;

final class PoOpenCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.open_count';
    }
}
