<?php

namespace App\Reckoner\Resolvers;

final class BarcodesMissingCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'barcodes.missing_count';
    }
}
