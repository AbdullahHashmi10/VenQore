<?php

namespace App\Reckoner\Resolvers;

final class RegisterShiftCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.shift_count';
    }
}
