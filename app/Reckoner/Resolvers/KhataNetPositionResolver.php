<?php

namespace App\Reckoner\Resolvers;

final class KhataNetPositionResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.net_position';
    }
}
