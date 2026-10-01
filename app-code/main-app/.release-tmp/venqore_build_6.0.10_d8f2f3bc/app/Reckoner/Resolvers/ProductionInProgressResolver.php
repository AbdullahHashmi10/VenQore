<?php

namespace App\Reckoner\Resolvers;

final class ProductionInProgressResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.in_progress';
    }
}
