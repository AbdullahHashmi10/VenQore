<?php

namespace App\Reckoner\Resolvers;

final class PoOverdueCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.overdue_count';
    }
}
