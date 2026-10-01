<?php

namespace App\Reckoner\Resolvers;

final class CompositeCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'composite.count';
    }
}
