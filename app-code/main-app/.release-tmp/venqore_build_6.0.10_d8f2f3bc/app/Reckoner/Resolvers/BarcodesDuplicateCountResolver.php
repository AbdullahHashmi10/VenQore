<?php

namespace App\Reckoner\Resolvers;

final class BarcodesDuplicateCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'barcodes.duplicate_count';
    }
}
