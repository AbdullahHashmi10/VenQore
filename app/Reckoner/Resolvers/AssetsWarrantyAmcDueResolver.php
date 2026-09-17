<?php

namespace App\Reckoner\Resolvers;

final class AssetsWarrantyAmcDueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.warranty_amc_due';
    }
}
