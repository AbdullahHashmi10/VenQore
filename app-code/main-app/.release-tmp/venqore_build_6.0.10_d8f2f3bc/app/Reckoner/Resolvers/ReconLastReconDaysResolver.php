<?php

namespace App\Reckoner\Resolvers;

final class ReconLastReconDaysResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recon.last_recon_days';
    }
}
