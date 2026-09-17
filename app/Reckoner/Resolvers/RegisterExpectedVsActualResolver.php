<?php

namespace App\Reckoner\Resolvers;

final class RegisterExpectedVsActualResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.expected_vs_actual';
    }
}
