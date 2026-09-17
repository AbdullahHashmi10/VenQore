<?php

namespace App\Reckoner\Resolvers;

final class TablesAvgCoverValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.avg_cover_value';
    }
}
