<?php

namespace App\Reckoner\Resolvers;

final class ReconDifferenceResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recon.difference';
    }
}
