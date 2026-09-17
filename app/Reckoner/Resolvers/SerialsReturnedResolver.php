<?php

namespace App\Reckoner\Resolvers;

final class SerialsReturnedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'serials.returned';
    }
}
