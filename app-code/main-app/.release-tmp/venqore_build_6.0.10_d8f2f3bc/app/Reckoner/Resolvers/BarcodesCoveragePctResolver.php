<?php

namespace App\Reckoner\Resolvers;

final class BarcodesCoveragePctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'barcodes.coverage_pct';
    }
}
