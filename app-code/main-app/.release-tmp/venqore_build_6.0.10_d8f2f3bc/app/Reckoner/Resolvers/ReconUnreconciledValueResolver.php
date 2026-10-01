<?php

namespace App\Reckoner\Resolvers;

final class ReconUnreconciledValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recon.unreconciled_value';
    }
}
