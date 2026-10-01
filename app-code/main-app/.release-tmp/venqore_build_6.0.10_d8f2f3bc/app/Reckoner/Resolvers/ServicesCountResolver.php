<?php

namespace App\Reckoner\Resolvers;

final class ServicesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.count';
    }
}
