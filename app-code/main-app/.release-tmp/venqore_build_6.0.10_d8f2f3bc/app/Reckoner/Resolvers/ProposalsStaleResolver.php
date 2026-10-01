<?php

namespace App\Reckoner\Resolvers;

final class ProposalsStaleResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.stale';
    }
}
