<?php

namespace App\Reckoner\Resolvers;

final class ReconMatchedPctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recon.matched_pct';
    }
}
