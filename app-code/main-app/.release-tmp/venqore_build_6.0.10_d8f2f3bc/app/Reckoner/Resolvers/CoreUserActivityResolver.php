<?php

namespace App\Reckoner\Resolvers;

final class CoreUserActivityResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.user_activity';
    }
}
