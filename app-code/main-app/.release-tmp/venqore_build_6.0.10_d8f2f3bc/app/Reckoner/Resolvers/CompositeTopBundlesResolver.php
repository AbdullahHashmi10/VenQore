<?php

namespace App\Reckoner\Resolvers;

final class CompositeTopBundlesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'composite.top_bundles';
    }
}
