<?php

namespace App\Reckoner\Resolvers;

final class PresalesValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'presales.value';
    }
}
