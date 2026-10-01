<?php

namespace App\Reckoner\Resolvers;

final class PosWeekdaySplitResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.weekday_split';
    }
}
