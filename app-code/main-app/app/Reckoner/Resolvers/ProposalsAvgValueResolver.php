<?php

namespace App\Reckoner\Resolvers;

final class ProposalsAvgValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.avg_value';
    }
}
