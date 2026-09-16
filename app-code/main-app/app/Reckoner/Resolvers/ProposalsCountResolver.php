<?php

namespace App\Reckoner\Resolvers;

final class ProposalsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.count';
    }
}
