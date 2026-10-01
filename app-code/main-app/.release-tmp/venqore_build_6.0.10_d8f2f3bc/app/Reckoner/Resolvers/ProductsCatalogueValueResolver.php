<?php

namespace App\Reckoner\Resolvers;

final class ProductsCatalogueValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.catalogue_value';
    }
}
