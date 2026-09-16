<?php

namespace App\Reckoner\Resolvers;

final class TablesAvgTurnMinutesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.avg_turn_minutes';
    }
}
