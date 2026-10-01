<?php

namespace App\Reckoner\Resolvers;

final class PresalesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'presales.count';
    }
}
