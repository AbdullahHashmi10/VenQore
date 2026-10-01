<?php

namespace App\Reckoner\Resolvers;

final class ProposalsWinRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.win_rate';
    }
}
