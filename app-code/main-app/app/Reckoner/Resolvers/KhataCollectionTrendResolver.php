<?php

namespace App\Reckoner\Resolvers;

final class KhataCollectionTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.collection_trend';
    }
}
