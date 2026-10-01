<?php

namespace App\Reckoner\Resolvers;

final class PresalesAdvanceCollectedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'presales.advance_collected';
    }
}
