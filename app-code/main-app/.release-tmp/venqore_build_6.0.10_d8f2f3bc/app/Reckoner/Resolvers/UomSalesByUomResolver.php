<?php

namespace App\Reckoner\Resolvers;

final class UomSalesByUomResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'uom.sales_by_uom';
    }
}
