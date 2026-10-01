<?php

namespace App\Reckoner\Resolvers;

final class BarcodesScanShareResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'barcodes.scan_share';
    }
}
