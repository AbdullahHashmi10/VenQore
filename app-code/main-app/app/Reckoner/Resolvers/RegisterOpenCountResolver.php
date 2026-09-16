<?php

namespace App\Reckoner\Resolvers;

final class RegisterOpenCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.open_count';
    }
}
