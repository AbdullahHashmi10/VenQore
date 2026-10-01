<?php

namespace App\Reckoner\Resolvers;

final class CompositeComponentShortageResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'composite.component_shortage';
    }
}
