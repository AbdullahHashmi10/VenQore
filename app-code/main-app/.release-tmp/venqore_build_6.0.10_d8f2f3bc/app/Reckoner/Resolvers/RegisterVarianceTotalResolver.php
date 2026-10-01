<?php

namespace App\Reckoner\Resolvers;

final class RegisterVarianceTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.variance_total';
    }
}
