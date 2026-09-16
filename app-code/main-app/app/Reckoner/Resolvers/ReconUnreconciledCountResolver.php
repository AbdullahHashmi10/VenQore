<?php

namespace App\Reckoner\Resolvers;

final class ReconUnreconciledCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recon.unreconciled_count';
    }
}
