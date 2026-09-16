<?php

namespace App\Reckoner\Resolvers;

final class ParkRecalledCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'park.recalled_count';
    }
}
