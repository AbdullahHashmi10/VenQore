<?php

namespace App\Reckoner\Resolvers;

final class StaffOnShiftCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.on_shift_count';
    }
}
