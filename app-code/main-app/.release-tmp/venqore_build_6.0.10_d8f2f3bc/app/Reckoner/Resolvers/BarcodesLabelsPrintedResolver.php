<?php

namespace App\Reckoner\Resolvers;

final class BarcodesLabelsPrintedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'barcodes.labels_printed';
    }
}
