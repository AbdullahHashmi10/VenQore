<?php

namespace App\Reckoner\Resolvers;

final class TransfersDiscrepancyCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'transfers.discrepancy_count';
    }
}
