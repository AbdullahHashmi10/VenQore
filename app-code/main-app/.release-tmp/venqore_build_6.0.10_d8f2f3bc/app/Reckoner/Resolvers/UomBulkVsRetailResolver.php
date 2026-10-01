<?php

namespace App\Reckoner\Resolvers;

final class UomBulkVsRetailResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'uom.bulk_vs_retail';
    }
}
