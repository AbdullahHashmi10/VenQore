<?php

namespace App\Reckoner\Resolvers;

final class LandedTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'landed.total';
    }
}
