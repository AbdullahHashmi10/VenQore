<?php

namespace App\Reckoner\Resolvers;

final class RegisterByStaffResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.by_staff';
    }
}
